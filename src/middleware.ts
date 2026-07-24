/**
 * Route Guard Global — AC Angry 🛡️
 *
 * IMPORTANTE: Em Next.js o middleware DEVE estar em `middleware.ts`/`middleware.js`
 * (na raiz ou em `src/`). O antigo `src/proxy.ts` NUNCA era executado — o guarda
 * de rota estava INATIVO. Este arquivo corrige isso.
 *
 * Bloqueia qualquer rota /ac/* (exceto /ac/auth/login e a API de autenticação)
 * se o visitante não tiver um JWT válido no cookie de sessão.
 *
 * Princípio: acesso NUNCA é liberado sem validação prévia do certificado A3
 * (token físico). O middleware confere a assinatura do JWT emitido por
 * /api/auth/pki após a validação criptográfica real.
 *
 * Usa Web Crypto (crypto.subtle) para ser compatível com o Edge Runtime
 * (node:crypto NÃO está disponível no middleware).
 */

import { NextRequest, NextResponse } from 'next/server';

const SESSION_COOKIE = 'ac_angry_session';

// ---------------------------------------------------------------------------
// JWT HS256 — verificação com Web Crypto (Edge-safe)
// ---------------------------------------------------------------------------

function b64urlToBytes(b64url: string): Uint8Array {
  const b64 = b64url.replace(/-/g, '+').replace(/_/g, '/');
  const pad = b64.length % 4 === 0 ? '' : '='.repeat(4 - (b64.length % 4));
  const bin = atob(b64 + pad);
  const bytes = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
  return bytes;
}

// Web Crypto espera ArrayBuffer (não Uint8Array<ArrayBufferLike> do TS 5.7+)
function toArrayBuffer(bytes: Uint8Array): ArrayBuffer {
  const ab = new ArrayBuffer(bytes.length);
  new Uint8Array(ab).set(bytes);
  return ab;
}

function b64urlDecode(b64url: string): string {
  const b64 = b64url.replace(/-/g, '+').replace(/_/g, '/');
  const pad = b64.length % 4 === 0 ? '' : '='.repeat(4 - (b64.length % 4));
  return atob(b64 + pad);
}

async function verifyJWTHS256(token: string, secret: string): Promise<Record<string, unknown>> {
  const parts = token.split('.');
  if (parts.length !== 3) throw new Error('JWT malformado');
  const [headerB64, payloadB64, signatureB64] = parts;

  // Checagem defensiva do header (alg) antes de verificar a assinatura
  const header = JSON.parse(b64urlDecode(headerB64)) as Record<string, unknown>;
  if (header.alg !== 'HS256') throw new Error('JWT alg não suportado');

  const enc = new TextEncoder();
  const key = await crypto.subtle.importKey(
    'raw',
    enc.encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['verify'],
  );
  const sig = b64urlToBytes(signatureB64);
  const valid = await crypto.subtle.verify(
    'HMAC',
    key,
    toArrayBuffer(sig),
    toArrayBuffer(enc.encode(`${headerB64}.${payloadB64}`)),
  );
  if (!valid) throw new Error('Assinatura de JWT inválida');

  const payload = JSON.parse(b64urlDecode(payloadB64)) as Record<string, unknown>;
  if (typeof payload.exp === 'number' && payload.exp * 1000 < Date.now()) {
    throw new Error('JWT expirado');
  }
  return payload;
}

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // Rotas públicas (login e API de desafio) ficam fora do guard
  const isPublic =
    pathname === '/auth/login' ||
    pathname.startsWith('/api/auth/pki') ||
    pathname.startsWith('/api/auth/psc');

  if (isPublic) return NextResponse.next();

  const token =
    req.cookies.get(SESSION_COOKIE)?.value ??
    req.headers.get('authorization')?.replace('Bearer ', '') ??
    '';

  if (!token) {
    if (!pathname.startsWith('/api/')) {
      const url = req.nextUrl.clone();
      url.pathname = '/auth/login';
      return NextResponse.redirect(url);
    }
    return NextResponse.json({ error: 'Sessão ausente' }, { status: 401 });
  }

  const secret = process.env.AUTH_JWT_SECRET;
  if (!secret) {
    // Falha fechada: sem segredo configurado, ninguém entra.
    if (!pathname.startsWith('/api/')) {
      const url = req.nextUrl.clone();
      url.pathname = '/auth/login';
      return NextResponse.redirect(url);
    }
    return NextResponse.json({ error: 'Sessão inválida ou expirada' }, { status: 401 });
  }

  try {
    const payload = await verifyJWTHS256(token, secret);

    // Proteção de rota administrativa: exige role ADMIN
    if (pathname.startsWith('/ac/admin') && payload.role !== 'ADMIN') {
      if (!pathname.startsWith('/api/')) {
        const url = req.nextUrl.clone();
        url.pathname = '/auth/login';
        return NextResponse.redirect(url);
      }
      return NextResponse.json({ error: 'Acesso negado: perfil ADMIN requerido.' }, { status: 403 });
    }

    return NextResponse.next();
  } catch {
    if (!pathname.startsWith('/api/')) {
      const url = req.nextUrl.clone();
      url.pathname = '/auth/login';
      return NextResponse.redirect(url);
    }
    return NextResponse.json({ error: 'Sessão inválida ou expirada' }, { status: 401 });
  }
}

export const config = {
  matcher: ['/ac/:path*', '/api/ac/:path*', '/api/protocol/:path*', '/api/protocols/:path*'],
};
