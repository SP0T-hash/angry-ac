import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/infra/supabase/client";
import { getGSSession } from "@/lib/gs/session";
import { isAdmin } from "@/lib/gs/types";

// Provisionamento de AR (white-label multi-tenant) a partir do GS.
// Cria/atualiza a AR em gs_ars (slug + branding) e sua integração de AC
// (gs_integracoes_ac), e provisiona o tenant correspondente no RI (ar-eletronica)
// via chamada best-effort ao endpoint de provisionamento do RI.
//
// Autenticação: sessão GS de ADMIN, OU header `x-provision-secret` igual a
// GS_PROVISION_SECRET (para integração automatizada/self-service).
//
// NÃO habilita emissão ICP-Brasil real sob nenhuma circunstância.
export async function POST(req: NextRequest) {
  try {
    const sess = await getGSSession();
    const secret = req.headers.get("x-provision-secret");
    const secretOk = !!process.env.GS_PROVISION_SECRET && secret === process.env.GS_PROVISION_SECRET;
    const adminOk = !!sess && isAdmin(sess.usuario.nivel);

    if (!adminOk && !secretOk) {
      return NextResponse.json({ error: "Não autenticado." }, { status: 401 });
    }

    const body = await req.json();
    const {
      slug, nome, cnpj, email, telefone, logoUrl,
      branding, acProvider, acConfig,
    } = body as {
      slug?: string; nome?: string; cnpj?: string; email?: string; telefone?: string;
      logoUrl?: string; branding?: Record<string, any>; acProvider?: string; acConfig?: Record<string, any>;
    };

    if (!nome || !cnpj) {
      return NextResponse.json({ error: "nome e cnpj são obrigatórios." }, { status: 400 });
    }

    const admin = await getSupabaseAdmin();

    // 1) Upsert gs_ars (por slug se informado, senão por cnpj).
    const arPayload: Record<string, any> = { nome, cnpj, email, telefone, logo_url: logoUrl, branding };
    if (slug) arPayload.slug = slug;

    let arId: string | undefined;
    if (slug) {
      const { data: existente } = await admin.from("gs_ars").select("id").eq("slug", slug).maybeSingle();
      if (existente?.id) {
        await admin.from("gs_ars").update(arPayload).eq("id", existente.id);
        arId = existente.id as string;
      }
    }
    if (!arId) {
      const { data: porCnpj } = await admin.from("gs_ars").select("id").eq("cnpj", cnpj).maybeSingle();
      if (porCnpj?.id) {
        await admin.from("gs_ars").update(arPayload).eq("id", porCnpj.id);
        arId = porCnpj.id as string;
      } else {
        const { data: ins, error } = await admin.from("gs_ars").insert(arPayload).select("id").single();
        if (error || !ins) return NextResponse.json({ error: "Falha ao criar AR." }, { status: 400 });
        arId = ins.id as string;
      }
    }

    // 2) Upsert gs_integracoes_ac (integração de AC por AR).
    if (acProvider) {
      const { data: existInt } = await admin
        .from("gs_integracoes_ac")
        .select("id")
        .eq("ar_id", arId)
        .eq("ac_provider", acProvider)
        .maybeSingle();
      const intPayload = { ar_id: arId, ac_provider: acProvider, config: acConfig ?? {}, is_active: true };
      if (existInt?.id) {
        await admin.from("gs_integracoes_ac").update(intPayload).eq("id", existInt.id);
      } else {
        await admin.from("gs_integracoes_ac").insert(intPayload);
      }
    }

    // 3) Provisiona o tenant no RI (best-effort; não bloqueia o sucesso do GS).
    let ri: { ok: boolean; detail?: string } = { ok: false, detail: "RI_PROVISION_URL não configurado" };
    const riBase = process.env.RI_PROVISION_URL;
    if (riBase) {
      try {
        const riRes = await fetch(`${riBase.replace(/\/$/, "")}/api/trpc/tenant.provision`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            ...(process.env.RI_PROVISION_SECRET
              ? { "x-provision-secret": process.env.RI_PROVISION_SECRET }
              : {}),
          },
          body: JSON.stringify({
            "0": {
              json: {
                slug: slug || (nome || "ar").toLowerCase().replace(/[^a-z0-9]+/g, "-"),
                name: nome,
                gsArId: arId,
                branding: branding ?? null,
                acProvider: acProvider ?? null,
                acConfig: acConfig ?? null,
              },
            },
          }),
        });
        const riJson = await riRes.json().catch(() => null);
        ri = riRes.ok
          ? { ok: true, detail: "tenant RI provisionado" }
          : { ok: false, detail: JSON.stringify(riJson) };
      } catch (e: any) {
        ri = { ok: false, detail: e?.message ?? "erro ao chamar RI" };
      }
    }

    return NextResponse.json({ ok: true, arId, ri });
  } catch (e: any) {
    console.error("[gs/provision-ar]", e);
    return NextResponse.json({ error: "Erro interno." }, { status: 500 });
  }
}
