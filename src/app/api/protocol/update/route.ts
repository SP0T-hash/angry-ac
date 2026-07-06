import { NextRequest, NextResponse } from 'next/server';
import { withAuth } from '@/lib/ac-angry/api-middleware';
import { AuditLogger } from '@/lib/ac-angry/security';
import { getSupabaseAdmin } from '@/lib/ac-angry/supabase-admin';

export const POST = withAuth(async (req: NextRequest, { session, ip }) => {
  try {
    const body = await req.json();
    const { id, updates } = body;

    if (!id || !updates) {
      return NextResponse.json({ error: 'ID e Dados são obrigatórios' }, { status: 400 });
    }

    const supabase = await getSupabaseAdmin();
    const { error } = await supabase.from('protocols').update(updates).eq('id', id);

    if (error) throw error;

    await AuditLogger.log({
      eventType: 'PROTOCOL_UPDATED',
      agrId: session.agrId,
      protocolId: id,
      ipAddress: ip,
      payload: { updates: Object.keys(updates) },
      severity: 'INFO',
    });

    return NextResponse.json({ success: true, message: 'Protocolo atualizado com sucesso' });
  } catch (error: any) {
    console.error('[PROTOCOL UPDATE]', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
});
