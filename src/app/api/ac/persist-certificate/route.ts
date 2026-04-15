import { NextRequest, NextResponse } from 'next/server';

// Lazy initialization - cliente criado apenas quando necessário
let supabaseInstance: any = null;

const getSupabaseClient = async () => {
  if (supabaseInstance) return supabaseInstance;
  
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  
  // Se não tiver variáveis, retorna cliente mock
  if (!supabaseUrl || !supabaseKey) {
    console.log('[PERSIST-CERTIFICATE] Usando modo mock');
    supabaseInstance = {
      from: () => ({
        insert: () => Promise.resolve({ data: null, error: null }),
        select: () => ({
          eq: () => Promise.resolve({ data: [], error: null })
        })
      })
    };
    return supabaseInstance;
  }
  
  // Import dinâmico do Supabase
  const { createClient } = await import('@supabase/supabase-js');
  supabaseInstance = createClient(supabaseUrl, supabaseKey);
  return supabaseInstance;
};

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

    const supabase = await getSupabaseClient();
    
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
