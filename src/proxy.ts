/** Guard de páginas AC: JWT vinculado à sessão persistida e conta ativa. */

import { NextRequest, NextResponse } from 'next/server';
import { SessionManager } from '@/lib/ac-angry/security';

const SESSION_COOKIE = 'ac_angry_session';

export async function proxy(req: NextRequest) {
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
    const adminRoute = pathname === '/ac/admin' || pathname.startsWith('/ac/admin/');
    await SessionManager.validatePageJWT(token, adminRoute ? 'ADMIN' : undefined);
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
