import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/ac-angry/supabase-admin";
import { getGSSession } from "@/lib/gs/session";

// Handler genérico de mutação do módulo GS (server-side, service-role).
// Protegido por sessão GS (cookie httpOnly).
// Body: { tabela, id?, data }
const TABELAS_PERMITIDAS = new Set([
  "gs_ars", "gs_unidades", "gs_pontos_atendimento", "gs_clientes",
  "gs_pedidos", "gs_planos", "gs_cobrancas", "gs_tickets",
]);

export async function POST(req: NextRequest) {
  try {
    const sess = await getGSSession();
    if (!sess) {
      return NextResponse.json({ error: "Não autenticado." }, { status: 401 });
    }
    const { tabela, id, data } = await req.json();
    if (!TABELAS_PERMITIDAS.has(tabela)) {
      return NextResponse.json({ error: "Tabela não permitida." }, { status: 403 });
    }
    if (!data || typeof data !== "object") {
      return NextResponse.json({ error: "Dados inválidos." }, { status: 400 });
    }

    const admin = await getSupabaseAdmin();

    if (id) {
      const { error } = await admin.from(tabela).update(data).eq("id", id);
      if (error) return NextResponse.json({ error: error.message }, { status: 400 });
      return NextResponse.json({ ok: true, id });
    } else {
      const { data: inserted, error } = await admin.from(tabela).insert(data).select("id").single();
      if (error) return NextResponse.json({ error: error.message }, { status: 400 });
      return NextResponse.json({ ok: true, id: inserted?.id });
    }
  } catch (e: any) {
    console.error("[gs/mutate]", e);
    return NextResponse.json({ error: "Erro interno." }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const sess = await getGSSession();
    if (!sess) {
      return NextResponse.json({ error: "Não autenticado." }, { status: 401 });
    }
    const { tabela, id } = await req.json();
    if (!TABELAS_PERMITIDAS.has(tabela) || !id) {
      return NextResponse.json({ error: "Requisição inválida." }, { status: 400 });
    }
    const admin = await getSupabaseAdmin();
    const { error } = await admin.from(tabela).delete().eq("id", id);
    if (error) return NextResponse.json({ error: error.message }, { status: 400 });
    return NextResponse.json({ ok: true });
  } catch (e: any) {
    return NextResponse.json({ error: "Erro interno." }, { status: 500 });
  }
}
