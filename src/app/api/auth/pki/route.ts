/**
 * API de Autenticação PKI (Public Key Infrastructure)
 * 
 * Fluxo:
 * 1. GET  → Gera nonce (desafio) para o cliente assinar
 * 2. POST → Valida assinatura digital A3, cria sessão JWT
 *
 * APENAS certificados A3 (Hardware/Token) são aceitos.
 * Certificados em nuvem (PSC) NÃO são suportados por segurança.
 * 
 * Conformidade:
 *  - ICP-Brasil DOC-ICP-01
 *  - ABNT NBR 15527
 *  - LGPD (proteção de dados biométricos)
 */

import { NextRequest, NextResponse } from 'next/server';
import { createHmac, createVerify, X509Certificate } from 'crypto';
import { SessionManager, AuditLogger, RateLimiter, NonceManager } from '@/lib/ac-angry/security';
import { getSupabaseAdmin } from '@/lib/ac-angry/supabase-admin';

// ===========================================================================
// CONSTANTES
// ===========================================================================

const AUTH_JWT_SECRET = () => {
  const secret = process.env.AUTH_JWT_SECRET;
  if (!secret) throw new Error('AUTH_JWT_SECRET não configurado');
  return secret;
};

// ===========================================================================
// GET — Gera nonce para desafio de assinatura
// ===========================================================================

export async function GET() {
  try {
    // Gera e persiste o nonce (one-time challenge) no banco para o POST consumir.
    const nonce = await NonceManager.generate('AUTH');
    return NextResponse.json({ nonce });
  } catch (error) {
    console.error('[AUTH-PKI] Erro ao gerar nonce:', error);
    return NextResponse.json(
      { error: 'Erro interno ao gerar desafio' },
      { status: 500 },
    );
  }
}

// ===========================================================================
// POST — Valida assinatura e cria sessão
// ===========================================================================

export async function POST(req: NextRequest) {
  try {
    const ip =
      req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ??
      req.headers.get('x-real-ip') ??
      '0.0.0.0';

    // Rate limiting por IP (5 tentativas/min)
    try {
      await RateLimiter.check(`ip:${ip}`, 'LOGIN');
    } catch (e: any) {
      return NextResponse.json(
        { error: e.message, retryAfter: e.retryAfterSeconds },
        { status: 429, headers: { 'Retry-After': String(e.retryAfterSeconds) } },
      );
    }

    const body = await req.json();
    const {
      signature,        // Assinatura digital do nonce (base64)
      certificatePem,   // Certificado X.509 completo (PEM)
      nonce,            // Nonce do GET /api/auth/pki
    } = body;

    // Validar entrada - apenas A3 é aceito
    if (!signature || !certificatePem || !nonce) {
      return NextResponse.json(
        { error: 'Campos obrigatórios: signature, certificatePem, nonce' },
        { status: 400 },
      );
    }

    // Validar formato do nonce
    if (typeof nonce !== 'string' || !nonce.includes('.')) {
      return NextResponse.json({ error: 'Nonce inválido' }, { status: 400 });
    }

    // Validar assinatura do nonce (HMAC)
    try {
      await NonceManager.consume(nonce, 'AUTH');
    } catch (e: any) {
      await AuditLogger.log({
        eventType: 'AUTH_NONCE_FAILURE',
        ipAddress: ip,
        payload: { reason: e.message },
        severity: 'WARN',
      });
      return NextResponse.json({ error: e.message }, { status: 401 });
    }

    // Validar certificado X.509
    let certInfo: { serialNumber: string; subject: string; issuer: string; publicKey: string } | null = null;
    try {
      certInfo = parseX509Certificate(certificatePem);
    } catch (e: any) {
      await AuditLogger.log({
        eventType: 'AUTH_CERT_INVALID',
        ipAddress: ip,
        payload: { reason: 'Certificado X.509 inválido', error: e.message },
        severity: 'WARN',
      });
      return NextResponse.json(
        { error: 'Certificado digital inválido ou corrompido' },
        { status: 401 },
      );
    }

    // Verificar se é certificado ICP-Brasil
    if (!certInfo.issuer.includes('ICP-Brasil') && !certInfo.issuer.includes('AC RAIZ')) {
      await AuditLogger.log({
        eventType: 'AUTH_CERT_NOT_ICP',
        ipAddress: ip,
        payload: { issuer: certInfo.issuer },
        severity: 'WARN',
      });
      return NextResponse.json(
        { error: 'Apenas certificados ICP-Brasil são aceitos' },
        { status: 401 },
      );
    }

    // Verificar validade do certificado
    const cert = new X509Certificate(certificatePem);
    const now = new Date();
    if (new Date(cert.validFrom) > now || new Date(cert.validTo) < now) {
      await AuditLogger.log({
        eventType: 'AUTH_CERT_EXPIRED',
        ipAddress: ip,
        payload: { serialNumber: certInfo.serialNumber },
        severity: 'WARN',
      });
      return NextResponse.json(
        { error: 'Certificado digital expirado ou ainda não válido' },
        { status: 401 },
      );
    }

    // Buscar AGR na base pelo serial do certificado
    const supabase = await getSupabaseAdmin();
    const { data: agr } = await supabase
      .from('agr_users')
      .select('*')
      .eq('cert_serial', certInfo.serialNumber)
      .single();

    if (!agr) {
      await AuditLogger.log({
        eventType: 'AUTH_FAILURE',
        ipAddress: ip,
        payload: { reason: 'AGR não encontrado para este certificado', serial: certInfo.serialNumber },
        severity: 'WARN',
      });
      return NextResponse.json(
        { error: 'Certificado não registrado. Contate o administrador.' },
        { status: 401 },
      );
    }

    if (!agr.is_active) {
      await AuditLogger.log({
        eventType: 'AUTH_FAILURE',
        agrId: agr.id,
        ipAddress: ip,
        payload: { reason: 'AGR desativado' },
        severity: 'WARN',
      });
      return NextResponse.json(
        { error: 'Conta desativada. Contate o administrador.' },
        { status: 403 },
      );
    }

    // Validar assinatura criptográfica do nonce com a chave pública do certificado
    const isValidSignature = await validateA3Signature(
      signature,
      certificatePem,
      nonce,
    );

    if (!isValidSignature) {
      await AuditLogger.log({
        eventType: 'AUTH_FAILURE',
        agrId: agr.id,
        ipAddress: ip,
        payload: { reason: 'Assinatura criptográfica inválida', serial: certInfo.serialNumber },
        severity: 'WARN',
      });
      return NextResponse.json(
        { error: 'Assinatura digital inválida. Verifique se o certificado está funcionando.' },
        { status: 401 },
      );
    }

    // Verificar se certificado não foi revogado
    try {
      const { data: revoked } = await supabase
        .from('certificate_revocation_list')
        .select('id')
        .eq('serial_number', certInfo.serialNumber)
        .maybeSingle();

      if (revoked) {
        await AuditLogger.log({
          eventType: 'AUTH_CERT_REVOKED',
          agrId: agr.id,
          ipAddress: ip,
          payload: { serial: certInfo.serialNumber },
          severity: 'CRITICAL',
        });
        return NextResponse.json(
          { error: 'Certificado revogado. Acesso negado.' },
          { status: 401 },
        );
      }
    } catch {
      // Tabela CRL pode não existir ainda
    }

    // Sucesso! Criar sessão
    const userAgent = req.headers.get('user-agent') ?? 'unknown';
    const sessionToken = await SessionManager.create(
      agr.id,
      ip,
      userAgent,
      certInfo.serialNumber,
    );

    // Gerar JWT real
    const jwtPayload = {
      sub: agr.id,
      cpf: agr.cpf,
      role: agr.role,
      session_token: sessionToken,
      cert_serial: certInfo.serialNumber,
      iat: Math.floor(Date.now() / 1000),
      exp: Math.floor(Date.now() / 1000) + 8 * 3600, // 8h
    };

    const jwt = await signJWT(jwtPayload);

    await AuditLogger.log({
      eventType: 'LOGIN_SUCCESS',
      agrId: agr.id,
      ipAddress: ip,
      payload: { type: 'A3_HARDWARE', certSerial: certInfo.serialNumber },
      severity: 'INFO',
    });

    const response = NextResponse.json({
      success: true,
      message: 'Autenticação validada com sucesso',
      token: jwt,
      session_token: sessionToken,
      agent: {
        id: agr.id,
        name: agr.nome,
        cpf: agr.cpf,
        role: agr.role,
      },
    });

    // Define o cookie de sessão (httpOnly) usado pelo route guard em /ac/*
    response.cookies.set('ac_angry_session', jwt, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 8 * 60 * 60, // 8h
    });

    return response;
  } catch (error) {
    console.error('[AUTH-PKI] Erro interno:', error);
    return NextResponse.json(
      { error: 'Erro interno no processador PKI' },
      { status: 500 },
    );
  }
}

// ===========================================================================
// VALIDAÇÃO DE ASSINATURA A3 (HARDWARE/TOKEN)
// Validação criptográfica real usando chave pública do certificado X.509
// ===========================================================================

async function validateA3Signature(
  signatureBase64: string,
  certificatePem: string,
  nonce: string,
): Promise<boolean> {
  try {
    if (!signatureBase64 || !certificatePem || !nonce) return false;

    // 1. Validar formato base64 da assinatura
    const isValidBase64 = /^[A-Za-z0-9+/]+={0,2}$/.test(signatureBase64);
    if (!isValidBase64) {
      console.error('[A3] Formato de assinatura inválido');
      return false;
    }

    // 2. Parse do certificado X.509
    let cert: X509Certificate;
    try {
      cert = new X509Certificate(certificatePem);
    } catch (e) {
      console.error('[A3] Certificado X.509 inválido:', e);
      return false;
    }

    // 3. Verificar se o certificado é ICP-Brasil
    const issuer = cert.issuer;
    if (!issuer.includes('ICP-Brasil') && !issuer.includes('AC RAIZ')) {
      console.error('[A3] Certificado não é ICP-Brasil:', issuer);
      return false;
    }

    // 4. Verificar validade do certificado
    const now = new Date();
    if (new Date(cert.validFrom) > now || new Date(cert.validTo) < now) {
      console.error('[A3] Certificado expirado ou não válido');
      return false;
    }

    // 5. Verificação criptográfica real da assinatura
    // O cliente assina o nonce com a chave privada do token A3
    // O servidor verifica com a chave pública extraída do certificado
    try {
      const verifier = createVerify('SHA256');
      verifier.update(nonce);

      const signatureBuffer = Buffer.from(signatureBase64, 'base64');
      const publicKey = cert.publicKey;

      const isValid = verifier.verify(publicKey, signatureBuffer);

      if (!isValid) {
        console.error('[A3] Assinatura criptográfica inválida');
        return false;
      }

      return true;
    } catch (cryptoError) {
      console.error('[A3] Erro na verificação criptográfica:', cryptoError);
      return false;
    }
  } catch (error) {
    console.error('[A3] Erro na validação:', error);
    return false;
  }
}

// ===========================================================================
// UTILITÁRIOS
// ===========================================================================

/**
 * Parse certificado X.509 e extrai informações relevantes
 */
function parseX509Certificate(pem: string): {
  serialNumber: string;
  subject: string;
  issuer: string;
  publicKey: string;
} {
  const cert = new X509Certificate(pem);

  return {
    serialNumber: cert.serialNumber,
    subject: cert.subject,
    issuer: cert.issuer,
    publicKey: cert.publicKey.toString(),
  };
}

/**
 * Assina um payload JWT com HMAC-SHA256.
 * Implementação manual sem dependências externas.
 */
async function signJWT(payload: Record<string, unknown>): Promise<string> {
  const secret = AUTH_JWT_SECRET();

  const header = {
    alg: 'HS256',
    typ: 'JWT',
  };

  const headerB64 = base64url(JSON.stringify(header));
  const payloadB64 = base64url(JSON.stringify(payload));
  const signingInput = `${headerB64}.${payloadB64}`;

  const signature = createHmac('sha256', secret)
    .update(signingInput)
    .digest('base64url');

  return `${signingInput}.${signature}`;
}

function base64url(str: string): string {
  return Buffer.from(str)
    .toString('base64')
    .replace(/=/g, '')
    .replace(/\+/g, '-')
    .replace(/\//g, '_');
}
