import { NextRequest, NextResponse } from 'next/server';
import { withAuth } from '@/lib/ac-angry/api-middleware';
import { AuditLogger } from '@/lib/ac-angry/security';
import { getSupabaseAdmin } from '@/lib/infra/supabase/client';

export const GET = withAuth(async (req: NextRequest, { session, ip }) => {
  const { searchParams } = new URL(req.url);
  const cpf = searchParams.get('cpf');

  if (!cpf) {
    return NextResponse.json({ error: 'CPF é obrigatório' }, { status: 400 });
  }

  const cpfDigits = cpf.replace(/\D/g, '');
  if (cpfDigits.length !== 11) {
    return NextResponse.json({ error: 'CPF inválido: deve conter 11 dígitos' }, { status: 400 });
  }

  // Simulação de tempo de resposta de Bureau (KYC)
  await new Promise((resolve) => setTimeout(resolve, 1500));

  const supabase = getSupabaseAdmin();

  // Buscar protocolo existente para este CPF
  const { data: existingProtocol } = await supabase
    .from('protocols')
    .select('holder_nome, holder_cpf, holder_email')
    .eq('holder_cpf', cpfDigits)
    .limit(1)
    .maybeSingle();

  await AuditLogger.log({
    eventType: 'CPF_CONSULTED',
    agrId: session.agrId,
    ipAddress: ip,
    payload: { cpf: cpfDigits.slice(0, 3) + '***' },
    severity: 'INFO',
  });

  const response = {
    found: !!existingProtocol,
    name: existingProtocol?.holder_nome ?? 'NOME CONSULTADO NA RFB',
    situation: 'REGULAR',
    birth_date: '1985-05-20',
    mother_name: 'MARIA DAS DORES SANTOS',
    is_dead: false,
    pep: false,
    gender: 'M',
    origin: 'Receita Federal do Brasil (RFB) via VEMAPI Data Engine',
    last_update: new Date().toISOString(),
  };

  return NextResponse.json(response);
});
