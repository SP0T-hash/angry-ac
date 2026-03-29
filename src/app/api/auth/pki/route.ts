import { NextResponse } from 'next/server';
import { MOCK_AGENTS } from '@/lib/ac-angry/mockData';
import { createHash, verify } from 'crypto';

/**
 * API de Autenticação PKI (Public Key Infrastructure)
 * Responsável por validar assinaturas digitais de certificados A3 e Nuvem (PSC).
 */
export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { type, signature, certificate, nonce, sessionId, identifier, serial } = body;

    console.log(`[AUTH-PKI] Analisando tentativa de login: ${type} | ID: ${identifier || serial}`);

    // Validação do nonce (prevenir replay attacks)
    if (!nonce || typeof nonce !== 'string') {
      return NextResponse.json({ success: false, error: 'Nonce inválido' }, { status: 400 });
    }

    // Busca o agente na nossa base "autorizada"
    const agent = MOCK_AGENTS.find(a => 
      (identifier && a.cpf === identifier) || 
      (serial && a.certificate_serial === serial) ||
      (certificate && certificate.subjectName && a.cpf === extractCPFFromSubject(certificate.subjectName))
    );

    if (!agent) {
      return NextResponse.json({ success: false, error: 'Agente de Registro não localizado na base autorizada' }, { status: 401 });
    }

    if (agent.status !== 'ATIVO') {
      return NextResponse.json({ success: false, error: 'Credenciais desativadas. Contate o administrador.' }, { status: 403 });
    }
    
    // Validação específica por tipo
    let isValidSignature = false;
    
    if (type === 'A3_HARDWARE') {
      // Validação de assinatura A3 Hardware
      isValidSignature = await validateA3Signature(signature, certificate, nonce);
    } else if (type === 'PSC_CLOUD') {
      // Validação de assinatura via PSC (Nuvem)
      isValidSignature = await validatePSCSignature(sessionId, signature);
    }

    if (isValidSignature) {
      // Registrar tentativa bem-sucedida para auditoria
      console.log(`[AUTH-PKI] Sucesso: ${agent.name} (${agent.cpf}) autenticado via ${type}`);
      
      return NextResponse.json({ 
        success: true, 
        message: 'Autenticação validada com sucesso',
        agent: {
          id: agent.id,
          name: agent.name,
          cpf: agent.cpf,
          role: agent.role,
          provider: agent.provider
        },
        token: generateSessionToken(agent)
      });
    } else {
      console.log(`[AUTH-PKI] Falha na validação de assinatura para ${agent.cpf}`);
      return NextResponse.json({ success: false, error: 'Assinatura digital inválida' }, { status: 401 });
    }
  } catch (error) {
    console.error('[AUTH-PKI] Erro interno:', error);
    return NextResponse.json({ success: false, error: 'Erro interno no processador PKI' }, { status: 500 });
  }
}

// Validação de assinatura A3 (simulação - em produção usar crypto real)
async function validateA3Signature(signature: string, certificate: any, nonce: string): Promise<boolean> {
  try {
    // Em produção, aqui faríamos:
    // 1. Extrair chave pública do certificado
    // 2. Verificar assinatura com a chave pública
    // 3. Validar cadeia de certificação ICP-Brasil
    // 4. Verificar revogação (CRL/OCSP)
    
    // Por ora, validação simulada com checks básicos
    if (!signature || !certificate || !nonce) {
      return false;
    }
    
    // Verificar formato da assinatura (base64)
    const isValidBase64 = /^[A-Za-z0-9+/]+={0,2}$/.test(signature);
    if (!isValidBase64) {
      return false;
    }
    
    // Verificar validade do certificado
    if (!certificate.validity) {
      return false;
    }
    
    const now = new Date();
    const notBefore = new Date(certificate.validity.notBefore);
    const notAfter = new Date(certificate.validity.notAfter);
    
    if (now < notBefore || now > notAfter) {
      return false;
    }
    
    // Verificar se é certificado ICP-Brasil (contém "ICP-Brasil" no issuer)
    if (!certificate.issuerName || !certificate.issuerName.includes('ICP-Brasil')) {
      return false;
    }
    
    // Simulação de verificação criptográfica
    const hash = createHash('sha256').update(nonce).digest('base64');
    const signatureHash = createHash('sha256').update(signature).digest('hex');
    
    // Em produção, verificaríamos: verify(signature, hash, publicKey)
    return signatureHash.length > 0; // Simulação básica
  } catch (error) {
    console.error('Erro na validação A3:', error);
    return false;
  }
}

// Validação de assinatura PSC (Nuvem)
async function validatePSCSignature(sessionId: string, signature: string): Promise<boolean> {
  // Em produção, verificaríamos com o PSC correspondente
  return true; // Simulação
}

// Extrair CPF do subject do certificado
function extractCPFFromSubject(subjectName: string): string | null {
  // Pattern típico: CN=NOME:CPF, OU=...
  const match = subjectName.match(/:([0-9]{3}\.[0-9]{3}\.[0-9]{3}-[0-9]{2})/);
  return match ? match[1] : null;
}

// Gerar token de sessão
function generateSessionToken(agent: any): string {
  const payload = {
    id: agent.id,
    cpf: agent.cpf,
    role: agent.role,
    exp: Math.floor(Date.now() / 1000) + (8 * 60 * 60), // 8 horas
    iat: Math.floor(Date.now() / 1000)
  };
  
  // Em produção, usar JWT real
  return Buffer.from(JSON.stringify(payload)).toString('base64');
}

// Endpoint para gerar o Nonce (Desafio)
export async function GET() {
  const nonce = `CHALLENGE_${Math.random().toString(36).substring(2, 15)}`;
  return NextResponse.json({ nonce });
}
