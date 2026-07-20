import { NextRequest, NextResponse } from 'next/server';
import { withAuth } from '@/lib/ac-angry/api-middleware';
import { AuditLogger } from '@/lib/ac-angry/security';
import { getSupabaseAdmin } from '@/lib/ac-angry/supabase-admin';

export const POST = withAuth(async (req: NextRequest, { session, ip }) => {
  try {
    const body = await req.json();
    const {
      serial_number,
      protocol_id,
      titular_name,
      titular_cpf_cnpj,
      pem_content,
      ca_chain_pem,
      expires_at,
      product_type,
    } = body;

    const supabase = await getSupabaseAdmin();

    const { error } = await supabase.from('issued_certificates').insert([
      {
        serial_number,
        protocol_id,
        titular_name,
        titular_cpf_cnpj,
        pem_content,
        ca_chain_pem,
        expires_at,
        product_type,
        issued_at: new Date().toISOString(),
      },
    ]);

    if (error) throw error;

    await AuditLogger.log({
      eventType: 'CERTIFICATE_PERSISTED',
      agrId: session.agrId,
      protocolId: protocol_id,
      ipAddress: ip,
      payload: { serial_number, product_type },
      severity: 'INFO',
    });

    return NextResponse.json({ success: true });
  } catch (err: any) {
    console.error('Certificate Save Error:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
});
