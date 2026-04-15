import { NextRequest, NextResponse } from 'next/server';

// Lazy initialization - cliente criado apenas quando necessário
let supabaseInstance: any = null;

const getSupabaseClient = async () => {
  if (supabaseInstance) return supabaseInstance;
  
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  
  // Se não tiver variáveis, retorna cliente mock
  if (!supabaseUrl || !supabaseKey) {
    console.log('[AUDIT] Usando modo mock');
    supabaseInstance = {
      from: () => ({
        insert: () => Promise.resolve({ data: null, error: null })
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
    const { protocol_id, action, agent_name, metadata, ip_address } = body;

    const supabase = await getSupabaseClient();
    
    const { error } = await supabase
      .from('audit_logs')
      .insert([
        { 
          protocol_id, 
          action, 
          agent_name, 
          metadata, 
          ip_address,
          timestamp: new Date().toISOString()
        }
      ]);

    if (error) throw error;

    return NextResponse.json({ success: true });
  } catch (err: any) {
    console.error('Audit Save Error:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
