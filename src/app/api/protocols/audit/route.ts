import { NextRequest, NextResponse } from 'next/server';
import { withAuth } from '@/lib/ac-angry/api-middleware';
import { getSupabaseAdmin } from '@/lib/infra/supabase/client';

export const POST = withAuth(async (req: NextRequest, { session, ip }) => {
  try {
    const body = await req.json();
    const { protocol_id, action, metadata } = body;
    // Client-reported UI activity is never an authoritative security audit event.
    if (typeof protocol_id !== 'string' || !protocol_id ||
        action !== 'UI_PROTOCOL_VIEWED' ||
        (metadata != null && (typeof metadata !== 'object' || Array.isArray(metadata)))) {
      return NextResponse.json({ error: 'Evento não permitido.' }, { status: 400 });
    }

    const supabase = await getSupabaseAdmin();

    const { data: protocol, error: lookupError } = await supabase.from('protocols')
      .select('id').eq('id', protocol_id).eq('agr_id', session.agrId).maybeSingle();
    if (lookupError) throw lookupError;
    if (!protocol) return NextResponse.json({ error: 'Protocolo não encontrado.' }, { status: 404 });

    const { error } = await supabase.from('audit_logs').insert([
      {
        protocol_id,
        event_type: 'UI_PROTOCOL_VIEWED',
        agr_id: session.agrId,
        ip_address: ip,
        payload: { source: 'client_ui', untrusted: true },
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
