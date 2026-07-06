import { NextRequest, NextResponse } from 'next/server';
import { withAuth } from '@/lib/ac-angry/api-middleware';
import { AuditLogger } from '@/lib/ac-angry/security';
import { supabase } from '@/lib/supabase';

// Cliente mock para build sem variáveis
const createMockClient = () => ({
  from: () => ({
    insert: () => Promise.resolve({ data: null, error: null }),
    select: () => ({
      eq: () => Promise.resolve({ data: [], error: null }),
    }),
  }),
});

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

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    let client;

    if (!supabaseUrl || !supabaseKey) {
      console.log('[PERSIST-CERTIFICATE] Modo mock - sem variáveis Supabase');
      client = createMockClient();
    } else {
      const { createClient } = await import('@supabase/supabase-js');
      client = createClient(supabaseUrl, supabaseKey);
    }

    const { error } = await client.from('issued_certificates').insert([
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
