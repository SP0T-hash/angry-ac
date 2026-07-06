import { NextRequest, NextResponse } from 'next/server';
import { withAuth } from '@/lib/ac-angry/api-middleware';
import { AuditLogger } from '@/lib/ac-angry/security';

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

  // Buscar em protocolos mock
  const { MOCK_PROTOCOLS } = await import('@/lib/ac-angry/mockData');
  const existingProtocol = MOCK_PROTOCOLS.find(
    (p: any) => p.titular.cpf.replace(/\D/g, '') === cpfDigits,
  );

  const mockResponse = {
    found: true,
    name: existingProtocol ? existingProtocol.titular.name : 'NOME CONSULTADO NA RFB',
    situation: 'REGULAR',
    birth_date: existingProtocol ? existingProtocol.titular.birthdate : '1985-05-20',
    mother_name: 'MARIA DAS DORES SANTOS',
    is_dead: false,
    pep: false,
    gender: 'M',
    origin: 'Receita Federal do Brasil (RFB) via VEMAPI Data Engine',
    last_update: new Date().toISOString(),
  };

  await AuditLogger.log({
    eventType: 'CPF_CONSULTED',
    agrId: session.agrId,
    ipAddress: ip,
    payload: { cpf: cpfDigits.slice(0, 3) + '***' },
    severity: 'INFO',
  });

  return NextResponse.json(mockResponse);
});
