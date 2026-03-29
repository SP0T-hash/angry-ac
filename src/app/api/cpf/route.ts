import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const cpf = searchParams.get('cpf');

  if (!cpf) {
    return NextResponse.json({ error: 'CPF é obrigatório' }, { status: 400 });
  }

  // Simulação de tempo de resposta de Bureau (KYC)
  await new Promise(resolve => setTimeout(resolve, 1500));

  /**
   * ARQUITETURA OURO VEMAPI:
   * Aqui integramos com Bureau de Crédito ou Receita Federal via parceiro (ex: BigDataCorp ou IDWall)
   * if (process.env.KYC_API_KEY) { 
   *    const res = await fetch(`https://api.partner.com/query/${cpf}`); 
   *    return res.json();
   * }
   */

  // Resposta Mock Estruturada para Desenvolvimento (ICP-Brasil Compliance)
  // BUG FIX: Buscar o nome real nos mocks para evitar o nome fixo "MARCELO"
  const { MOCK_PROTOCOLS } = require('@/lib/ac-angry/mockData');
  const existingProtocol = MOCK_PROTOCOLS.find((p: any) => p.titular.cpf.replace(/\D/g, '') === cpf.replace(/\D/g, ''));

  const mockResponse = {
    found: true,
    name: existingProtocol ? existingProtocol.titular.name : "NOME CONSULTADO NA RFB",
    situation: "REGULAR",
    birth_date: existingProtocol ? existingProtocol.titular.birthdate : "1985-05-20",
    mother_name: "MARIA DAS DORES SANTOS",
    is_dead: false,
    pep: false, 
    gender: "M",
    origin: "Receita Federal do Brasil (RFB) via VEMAPI Data Engine",
    last_update: new Date().toISOString()
  };

  return NextResponse.json(mockResponse);
}
