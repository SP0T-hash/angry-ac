import { NextRequest, NextResponse } from "next/server";
import { withAuth } from "@/lib/ac-angry/api-middleware";
import { AuditLogger } from "@/lib/ac-angry/security";
import { getSupabaseAdmin } from "@/lib/infra/supabase/client";

// GET /api/protocols — lista protocolos (mais recentes primeiro)
export const GET = withAuth(async (_req: NextRequest, { session, ip }) => {
  try {
    const supabase = await getSupabaseAdmin();
    const { data, error } = await supabase
      .from("protocols")
      .select("*")
      .order("created_at", { ascending: false });
    if (error) throw error;
    return NextResponse.json({ protocols: data ?? [] });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
});

// POST /api/protocols — cria novo protocolo a partir do form do agente
export const POST = withAuth(async (req: NextRequest, { session, ip }) => {
  try {
    const body = await req.json();
    const supabase = await getSupabaseAdmin();

    const protocol_number = `PRT-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`;

    const insert = {
      protocol_number,
      status: "PENDING",
      cert_type: body.certType || "PF-A1",
      holder_nome: body.name || "Aguardando",
      holder_cpf: body.cpf || "",
      holder_cnpj: body.isPJ ? body.cnpj : null,
      holder_email: body.email || "aguardando@email.com",
      holder_telefone: body.phone || "",
      agr_id: session.agrId,
      is_presencial: body.attendanceMode === "presencial",
    };

    const { data, error } = await supabase.from("protocols").insert(insert).select().single();
    if (error) throw error;

    await AuditLogger.log({
      eventType: "PROTOCOL_CREATED",
      agrId: session.agrId,
      protocolId: data.id,
      ipAddress: ip,
      payload: { protocol_number },
      severity: "INFO",
    });

    return NextResponse.json({ success: true, protocol: data });
  } catch (error: any) {
    console.error("[PROTOCOL CREATE]", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
});
