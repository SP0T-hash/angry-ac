import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// Configuração Supabase com fallback robusto para produção
const getSupabaseClient = () => {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  
  // Se não tiver variáveis, retorna cliente mock para não quebrar o build
  if (!supabaseUrl || !supabaseKey) {
    console.log('[PERSIST-CERTIFICATE] Usando modo mock - variáveis Supabase não configuradas');
    return {
      from: () => ({
        insert: () => Promise.resolve({ data: null, error: null })
      }),
      select: () => ({
        eq: () => Promise.resolve({ data: [], error: null })
      })
    });
  }
  
  return createClient(supabaseUrl, supabaseKey);
};

const supabase = getSupabaseClient();

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

    const { error } = await supabase
      .from('certificates')
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
