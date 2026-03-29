import { NextResponse } from 'next/server';
import { MOCK_AGENTS } from '@/lib/ac-angry/mockData';

/**
 * API de Autenticação PKI (Public Key Infrastructure)
 * Responsável por validar assinaturas digitais de certificados A3 e Nuvem (PSC).
 */
export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { type, signature, certificate, sessionId, identifier, serial } = body;

    console.log(`[AUTH-PKI] Analisando tentativa de login: ${type} | ID: ${identifier || serial}`);

    // Busca o agente na nossa base "autorizada"
    const agent = MOCK_AGENTS.find(a => 
      (identifier && a.cpf === identifier) || 
      (serial && a.certificate_serial === serial)
    );

    if (!agent) {
      return NextResponse.json({ success: false, error: 'Agente de Registro não localizado na base autorizada' }, { status: 401 });
    }

    if (agent.status !== 'ATIVO') {
      return NextResponse.json({ success: false, error: 'Credenciais desativadas. Contate o administrador.' }, { status: 403 });
    }
    
    // Simulação de Validação Criptográfica (Em produção aqui validamos a assinatura real)
    const isValidSignature = true; 

    if (isValidSignature) {
      return NextResponse.json({ 
        success: true, 
        message: 'Autenticação validada com sucesso',
        agent: {
          name: agent.name,
          cpf: agent.cpf,
          role: agent.role
        }
      });
    } else {
      return NextResponse.json({ success: false, error: 'Assinatura digital inválida' }, { status: 401 });
    }
  } catch (error) {
    return NextResponse.json({ success: false, error: 'Erro interno no processador PKI' }, { status: 500 });
  }
}

// Endpoint para gerar o Nonce (Desafio)
export async function GET() {
  const nonce = `CHALLENGE_${Math.random().toString(36).substring(2, 15)}`;
  return NextResponse.json({ nonce });
}
