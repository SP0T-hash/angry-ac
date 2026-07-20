import { NextRequest, NextResponse } from 'next/server';
import { withAuth } from '@/lib/ac-angry/api-middleware';
import { AuditLogger } from '@/lib/ac-angry/security';
import { getSupabaseAdmin } from '@/lib/infra/supabase/client';

export const POST = withAuth(async (req: NextRequest, { session, ip }) => {
  try {
    const { characteristics } = await req.json();

    const supabase = await getSupabaseAdmin();

    const { data: frauds, error } = await supabase
      .from('fraud_blacklist')
      .select('id, name, fraud_reason, risk_level')
      .contains('traits_array', characteristics || []);

    if (error) {
      if (error.code === '42P01') {
        // Tabela fraud_blacklist não existe ainda
        return NextResponse.json({ match: false, frauds: [] });
      }
      throw error;
    }

    await AuditLogger.log({
      eventType: 'SAF_CHECK',
      agrId: session.agrId,
      ipAddress: ip,
      payload: { match: !!(frauds && frauds.length > 0) },
      severity: frauds && frauds.length > 0 ? 'WARN' : 'INFO',
    });

    if (frauds && frauds.length > 0) {
      return NextResponse.json({
        match: true,
        frauds,
        message:
          'ALERTA TÉCNICO: CPF ou Rosto confere com indivíduo bloqueado na sua base VEMAPI.',
      });
    }

    return NextResponse.json({ match: false, frauds: [] });
  } catch (error) {
    console.error('Erro na API SAF Supabase:', error);
    return NextResponse.json(
      { error: 'Erro interno ao consultar SAF.' },
      { status: 500 },
    );
  }
});
