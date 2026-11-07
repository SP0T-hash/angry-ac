import { NextRequest, NextResponse } from 'next/server';
import { withAuth } from '@/lib/ac-angry/api-middleware';
import { AuditLogger } from '@/lib/ac-angry/security';
import { getSupabaseAdmin } from '@/lib/infra/supabase/client';

export const POST = withAuth(async (req: NextRequest, { session, ip }) => {
  try {
    const body = await req.json();
    const { id, updates } = body;
    // Restrict this generic endpoint to non-decisional fields only.
    // Status, identity, approvals and issuance require dedicated authorized workflows.
    const allowedFields = new Set(['holder_telefone', 'holder_email']);
    if (!updates || typeof updates !== 'object' || Array.isArray(updates) ||
        Object.keys(updates).length === 0 ||
        Object.keys(updates).some(key => !allowedFields.has(key)) ||
        Object.values(updates).some(value => typeof value !== 'string')) {
      return NextResponse.json({ error: 'Campos de atualização não permitidos.' }, { status: 400 });
    }

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
