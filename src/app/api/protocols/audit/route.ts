import { NextRequest, NextResponse } from 'next/server';
import { withAuth } from '@/lib/ac-angry/api-middleware';
import { getSupabaseAdmin } from '@/lib/infra/supabase/client';

export const POST = withAuth(async (req: NextRequest, { session, ip }) => {
  try {
    const body = await req.json();
    const { protocol_id, action, metadata } = body;

    const supabase = await getSupabaseAdmin();

    const { error } = await supabase.from('audit_logs').insert([
      {
        protocol_id,
        event_type: action,
        agr_id: session.agrId,
        ip_address: ip,
        payload: metadata ?? null,
        severity: 'INFO',
      },
    ]);

    if (error) throw error;

    return NextResponse.json({ success: true });
  } catch (err: any) {
    console.error('Audit Save Error:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
});
