import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

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
