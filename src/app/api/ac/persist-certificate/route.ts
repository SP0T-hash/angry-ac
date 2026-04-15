import { NextRequest, NextResponse } from 'next/server';

// Cliente mock para build sem variáveis
const createMockClient = () => ({
  from: () => ({
    insert: () => Promise.resolve({ data: null, error: null }),
    select: () => ({
      eq: () => Promise.resolve({ data: [], error: null })
    })
  })
});

export async function POST(req: NextRequest) {
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
      product_type 
    } = body;

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    
    let supabase;
    
    if (!supabaseUrl || !supabaseKey) {
      console.log('[PERSIST-CERTIFICATE] Modo mock - sem variáveis Supabase');
      supabase = createMockClient();
    } else {
      // Dynamic import only when needed at runtime
      const { createClient } = await import('@supabase/supabase-js');
      supabase = createClient(supabaseUrl, supabaseKey);
    }

    const { error } = await supabase
      .from('issued_certificates')
      .insert([
        { 
          serial_number, 
          protocol_id, 
          titular_name, 
          titular_cpf_cnpj, 
          pem_content, 
          ca_chain_pem, 
          expires_at, 
          product_type,
          issued_at: new Date().toISOString()
        }
      ]);

    if (error) throw error;

    return NextResponse.json({ success: true });
  } catch (err: any) {
    console.error('Certificate Save Error:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
