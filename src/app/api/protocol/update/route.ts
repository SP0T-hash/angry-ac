import { NextRequest, NextResponse } from 'next/server';
import { withAuth } from '@/lib/ac-angry/api-middleware';
import { AuditLogger } from '@/lib/ac-angry/security';
import { getSupabaseAdminAsync } from '@/lib/infra/supabase/client';

// Campos que um AGR pode alterar em um protocolo (whitelist estrita).
// Campos críticos de emissão (status=ISSUED, cert_serial, cert_issued_at, etc.)
// NÃO estão aqui — são definidos apenas pelo fluxo de emissão assinado.
const AGR_EDITABLE = new Set([
  'holder_nome',
  'holder_email',
  'holder_telefone',
  'holder_cpf',
  'holder_cnpj',
  'biometry_status',
  'face_photo_url',
  'dossie_url',
  'status',
]);

// Transições de status permitidas por AGR (impede pular para ISSUED sem biometria/assinatura).
const ALLOWED_STATUS_TRANSITIONS = new Set([
  'IN_PROGRESS',
  'BIOMETRY_OK',
  'BIOMETRY_FAIL',
  'CANCELLED',
  'ERROR',
]);

export const POST = withAuth(async (req: NextRequest, { session, ip }) => {
  try {
    const body = await req.json();
    const { id, updates } = body;

    if (!id || !updates || typeof updates !== 'object') {
      return NextResponse.json({ error: 'ID e Dados são obrigatórios' }, { status: 400 });
    }

    // 1. Filtrar apenas campos permitidos (mass-assignment protection)
    const clean: Record<string, unknown> = {};
    for (const key of Object.keys(updates)) {
      if (!AGR_EDITABLE.has(key)) {
        return NextResponse.json(
          { error: `Campo não permitido: ${key}` },
          { status: 403 },
        );
      }
      clean[key] = updates[key];
    }

    // 2. Validação de transição de status
    if (clean.status && !ALLOWED_STATUS_TRANSITIONS.has(clean.status as string)) {
      return NextResponse.json(
        { error: `Transição de status inválida: ${clean.status}` },
        { status: 403 },
      );
    }

    const supabase = await getSupabaseAdminAsync();

    // 3. Ownership: só quem travou o protocolo (ou ADMIN) pode alterá-lo
    const { data: proto, error: selErr } = await supabase
      .from('protocols')
      .select('id, locked_by, status')
      .eq('id', id)
      .single();

    if (selErr || !proto) {
      return NextResponse.json({ error: 'Protocolo não encontrado.' }, { status: 404 });
    }

    const isAdmin = session.role === 'ADMIN'; // preenchido se requireRole usado; senão tratar como AGR
    if (!isAdmin && proto.locked_by !== session.agrId) {
      await AuditLogger.log({
        eventType: 'PROTOCOL_UPDATE_DENIED',
        agrId: session.agrId,
        protocolId: id,
        ipAddress: ip,
        payload: { reason: 'not_locked_by_self', locked_by: proto.locked_by },
        severity: 'WARN',
      });
      return NextResponse.json(
        { error: 'Você só pode alterar protocolos sob sua responsabilidade.' },
        { status: 403 },
      );
    }

    const { error } = await supabase.from('protocols').update(clean).eq('id', id);
    if (error) throw error;

    await AuditLogger.log({
      eventType: 'PROTOCOL_UPDATED',
      agrId: session.agrId,
      protocolId: id,
      ipAddress: ip,
      payload: { updates: Object.keys(clean) },
      severity: 'INFO',
    });

    return NextResponse.json({ success: true, message: 'Protocolo atualizado com sucesso' });
  } catch (error: any) {
    console.error('[PROTOCOL UPDATE]', error);
    return NextResponse.json({ error: 'Erro interno ao atualizar protocolo.' }, { status: 500 });
  }
});
