/**
 * AC ANGRY - Middleware de API 🛡️
 * Arquivo: src/lib/ac-angry/api-middleware.ts
 *
 * Uso:
 *   import { withAuth } from '@/lib/ac-angry/api-middleware';
 *
 *   export const POST = withAuth(async (req, ctx) => {
 *     const { session } = ctx;  // sessão validada disponível aqui
 *     ...
 *   }, { rateLimit: 'EMIT' });
 */

import { NextRequest, NextResponse } from 'next/server';
import { SessionManager, RateLimiter, RateLimitError, AuditLogger } from './security';
import { getSupabaseAdminAsync } from '@/lib/infra/supabase/client';

interface AuthContext {
  session: Awaited<ReturnType<typeof SessionManager.validate>>;
  ip: string;
}

type AuthHandler = (req: NextRequest, ctx: AuthContext) => Promise<NextResponse>;

type Role = 'AGR' | 'SUPERVISOR' | 'ADMIN';
const ROLE_RANK: Record<Role, number> = { AGR: 1, SUPERVISOR: 2, ADMIN: 3 };

interface MiddlewareOptions {
  rateLimit?: string; // ação para rate limiting (LOGIN, SIGN, EMIT...)
  requireRole?: Role;
}

const SESSION_COOKIE = 'ac_angry_session';

/** IP confiável: usa headers de proxy (x-forwarded-for / x-real-ip). */
function clientIp(req: NextRequest): string {
  return (
    req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ??
    req.headers.get('x-real-ip') ??
    '0.0.0.0'
  );
}

/** CSRF defense-in-depth: estado mutante exige Origin igual à origem do app. */
function csrfCheck(req: NextRequest): boolean {
  const method = req.method.toUpperCase();
  if (!['POST', 'PUT', 'DELETE', 'PATCH'].includes(method)) return true;

  const origin = req.headers.get('origin');
  if (!origin) return false; // sem Origin em mutação = suspeito

  const expected =
    process.env.NEXT_PUBLIC_APP_URL?.replace(/\/$/, '') ??
    new URL(req.url).origin;
  return origin.replace(/\/$/, '') === expected;
}

/**
 * HOF que envolve um handler de API com:
 * 1. Rate Limiting (por IP confiável)
 * 2. Validação de sessão (Bearer OU cookie httpOnly — ambos aceitos)
 * 3. Checagem de role (requireRole)
 * 4. Proteção CSRF (Origin check em mutações)
 * 5. Log de auditoria automático
 */
export function withAuth(handler: AuthHandler, opts: MiddlewareOptions = {}) {
  return async (req: NextRequest): Promise<NextResponse> => {
    const ip = clientIp(req);

    // 1. Rate Limiting
    if (opts.rateLimit) {
      try {
        await RateLimiter.check(`ip:${ip}`, opts.rateLimit);
      } catch (e) {
        if (e instanceof RateLimitError) {
          return NextResponse.json(
            { error: e.message, retryAfter: e.retryAfterSeconds },
            { status: 429, headers: { 'Retry-After': String(e.retryAfterSeconds) } },
          );
        }
        console.error('[withAuth] RateLimiter error:', e);
        return NextResponse.json(
          { error: 'Erro interno no controle de acesso.' },
          { status: 500 },
        );
      }
    }

    // 2. Validar sessão (cookie OU Bearer)
    const authHeader = req.headers.get('authorization');
    const token =
      authHeader?.startsWith('Bearer ') ? authHeader.slice(7) : req.cookies.get(SESSION_COOKIE)?.value;

    if (!token) {
      return NextResponse.json({ error: 'Token de sessão ausente.' }, { status: 401 });
    }

    let session: Awaited<ReturnType<typeof SessionManager.validate>>;
    try {
      session = await SessionManager.validate(token);
    } catch (e) {
      await AuditLogger.log({
        eventType: 'AUTH_FAILURE',
        ipAddress: ip,
        payload: { reason: e instanceof Error ? e.message : 'unknown' },
        severity: 'WARN',
      });
      return NextResponse.json(
        { error: e instanceof Error ? e.message : 'Sessão inválida.' },
        { status: 401 },
      );
    }

    // 3. Checagem de role
    if (opts.requireRole) {
      try {
        const supabase = await getSupabaseAdminAsync();
        const { data: agr } = await supabase
          .from('agr_users')
          .select('role')
          .eq('id', session.agrId)
          .single();
        const userRole = (agr?.role as Role) ?? 'AGR';
        if ((ROLE_RANK[userRole] ?? 0) < ROLE_RANK[opts.requireRole]) {
          await AuditLogger.log({
            eventType: 'AUTHZ_DENIED',
            agrId: session.agrId,
            ipAddress: ip,
            payload: { required: opts.requireRole, actual: userRole },
            severity: 'WARN',
          });
          return NextResponse.json(
            { error: 'Acesso negado: perfil insuficiente.' },
            { status: 403 },
          );
        }
      } catch (e) {
        console.error('[withAuth] role check error:', e);
        return NextResponse.json({ error: 'Erro interno de autorização.' }, { status: 500 });
      }
    }

    // 4. CSRF (mutações)
    if (!csrfCheck(req)) {
      await AuditLogger.log({
        eventType: 'CSRF_SUSPECT',
        agrId: session.agrId,
        ipAddress: ip,
        payload: { origin: req.headers.get('origin') },
        severity: 'WARN',
      });
      return NextResponse.json({ error: 'Requisição bloqueada (Origin inválido).' }, { status: 403 });
    }

    // 5. Executar handler
    try {
      return await handler(req, { session, ip });
    } catch (e) {
      await AuditLogger.log({
        eventType: 'API_ERROR',
        agrId: session.agrId,
        ipAddress: ip,
        payload: { error: e instanceof Error ? e.message : 'unknown', path: req.nextUrl.pathname },
        severity: 'ERROR',
      });
      return NextResponse.json({ error: 'Erro interno do servidor.' }, { status: 500 });
    }
  };
}

/**
 * Utilitário: extrai IP da request
 */
export function getClientIp(req: NextRequest): string {
  return (
    req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ??
    req.headers.get('x-real-ip') ??
    '0.0.0.0'
  );
}
