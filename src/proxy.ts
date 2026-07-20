/**
 * Route Guard Global — AC Angry 🛡️
 *
 * Bloqueia qualquer rota /ac/* (exceto /ac/auth/login e a própria API de
 * autenticação) se o visitante não tiver um JWT válido no cookie de sessão.
 *
 * Princípio de segurança: acesso NUNCA é liberado sem validação prévia do
 * certificado A3 (token físico). O middleware apenas confere a assinatura do
 * JWT emitido por /api/auth/pki após a validação criptográfica real.
 */

import { NextRequest, NextResponse } from 'next/server';
import { verifyJWT } from '@/lib/ac-angry/security';

const SESSION_COOKIE = 'ac_angry_session';

export function proxy(req: NextRequest) {
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
    // Redireciona para o login A3 se for navegação de página
    if (!pathname.startsWith('/api/')) {
      const url = req.nextUrl.clone();
      url.pathname = '/auth/login';
      return NextResponse.redirect(url);
    }
    return NextResponse.json({ error: 'Sessão ausente' }, { status: 401 });
  }

  try {
    verifyJWT(token);
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
  matcher: ['/ac/:path*'],
};
