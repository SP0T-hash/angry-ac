import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// Configuração Supabase com fallback robusto para produção
const getSupabaseClient = () => {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  
  // Se não tiver variáveis, retorna cliente mock para não quebrar o build
  if (!supabaseUrl || !supabaseKey) {
    console.log('[AUDIT] Usando modo mock - variáveis Supabase não configuradas');
    return {
      from: () => ({
        insert: () => Promise.resolve({ data: null, error: null })
      }),
      select: () => ({
        eq: () => Promise.resolve({ data: [], error: null })
      })
    };
  }
  
  return createClient(supabaseUrl, supabaseKey);
};

const supabase = getSupabaseClient();

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { protocol_id, action, agent_name, metadata, ip_address } = body;

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
