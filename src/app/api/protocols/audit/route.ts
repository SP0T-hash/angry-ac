import { NextRequest, NextResponse } from 'next/server';

// Cliente mock para build sem variáveis
const createMockClient = () => ({
  from: () => ({
    insert: () => Promise.resolve({ data: null, error: null })
  })
});

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { protocol_id, action, agent_name, metadata, ip_address } = body;

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    
    let supabase;
    
    if (!supabaseUrl || !supabaseKey) {
      console.log('[AUDIT] Modo mock - sem variáveis Supabase');
      supabase = createMockClient();
    } else {
      // Dynamic import only when needed at runtime
      const { createClient } = await import('@supabase/supabase-js');
      supabase = createClient(supabaseUrl, supabaseKey);
    }

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
