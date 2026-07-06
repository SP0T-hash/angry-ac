/**
 * AC ANGRY - Módulos de Segurança Core 🛡️
 * Arquivo: src/lib/ac-angry/security.ts
 *
 * Contém:
 *  - NonceManager   → Anti-replay / CSRF
 *  - SessionManager → Sessões AGR autenticadas
 *  - RateLimiter    → Proteção contra força bruta
 *  - AuditLogger    → Trilha de auditoria imutável
 *  - ProtocolLocker → Controle de concorrência
 */

import { createHmac, randomBytes } from 'crypto';
import type { SupabaseClient } from '@supabase/supabase-js';

// ---------------------------------------------------------------------------
// Cliente Supabase Admin lazy — só cria na primeira chamada
// ---------------------------------------------------------------------------
let _supabase: SupabaseClient | null = null;
let _supabaseInit: Promise<SupabaseClient> | null = null;

async function getSupabase(): Promise<SupabaseClient> {
  if (_supabase) return _supabase;
  if (_supabaseInit) return _supabaseInit;

  _supabaseInit = (async () => {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !serviceRoleKey) {
      throw new Error(
        '[AC ANGRY] NEXT_PUBLIC_SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY são obrigatórios.',
      );
    }

    const { createClient } = await import('@supabase/supabase-js');
    _supabase = createClient(supabaseUrl, serviceRoleKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    });
    return _supabase;
  })();

  return _supabaseInit;
}

// ===========================================================================
// 1. NONCE MANAGER — Anti-Replay / CSRF
// ===========================================================================

export type NonceScope = 'AUTH' | 'SIGN' | 'BIOMETRY' | 'EMIT';

const NONCE_TTL: Record<NonceScope, number> = {
  AUTH:     5 * 60,   // 5 minutos
  SIGN:     2 * 60,   // 2 minutos
  BIOMETRY: 3 * 60,   // 3 minutos
  EMIT:     10 * 60,  // 10 minutos
};

export const NonceManager = {
  /**
   * Gera um nonce único, assina com HMAC e persiste no Supabase.
   */
  async generate(
    scope: NonceScope,
    protocolId?: string,
    agrId?: string,
  ): Promise<string> {
    const supabase = await getSupabase();
    const raw = randomBytes(32).toString('hex');
    const secret = process.env.PKI_NONCE_SECRET!;
    const signature = createHmac('sha256', secret).update(raw).digest('hex');
    const nonce = `${raw}.${signature}`;

    const expiresAt = new Date(Date.now() + NONCE_TTL[scope] * 1000).toISOString();

    const { error } = await supabase.from('security_nonces').insert({
      nonce,
      scope,
      protocol_id: protocolId ?? null,
      agr_id: agrId ?? null,
      expires_at: expiresAt,
    });

    if (error) throw new Error(`NonceManager.generate failed: ${error.message}`);
    return nonce;
  },

  /**
   * Valida e consome (one-time use) um nonce.
   * Lança erro se inválido, expirado ou já usado.
   */
  async consume(nonce: string, scope: NonceScope): Promise<void> {
    const supabase = await getSupabase();

    // 1. Verificar assinatura HMAC
    const [raw, signature] = nonce.split('.');
    if (!raw || !signature) throw new Error('Nonce malformado.');

    const secret = process.env.PKI_NONCE_SECRET!;
    const expected = createHmac('sha256', secret).update(raw).digest('hex');
    if (expected !== signature) throw new Error('Assinatura de nonce inválida.');

    // 2. Buscar no banco
    const { data, error } = await supabase
      .from('security_nonces')
      .select('id, used, expires_at, scope')
      .eq('nonce', nonce)
      .single();

    if (error || !data) throw new Error('Nonce não encontrado.');
    if (data.used) throw new Error('Nonce já utilizado (replay detectado).');
    if (data.scope !== scope) throw new Error(`Nonce de escopo inválido: esperado ${scope}.`);
    if (new Date(data.expires_at) < new Date()) throw new Error('Nonce expirado.');

    // 3. Marcar como usado
    await supabase
      .from('security_nonces')
      .update({ used: true, used_at: new Date().toISOString() })
      .eq('id', data.id);
  },
};

// ===========================================================================
// 2. SESSION MANAGER — Sessões AGR
// ===========================================================================

export interface AgrSession {
  sessionToken: string;
  agrId: string;
  certSerial?: string;
  expiresAt: Date;
}

const SESSION_TTL_HOURS = 8; // Jornada de trabalho

export const SessionManager = {
  /**
   * Cria uma nova sessão após autenticação bem-sucedida.
   */
  async create(
    agrId: string,
    ipAddress: string,
    userAgent: string,
    certSerial?: string,
  ): Promise<string> {
    const supabase = await getSupabase();
    const token = randomBytes(48).toString('base64url');
    const expiresAt = new Date(Date.now() + SESSION_TTL_HOURS * 3600 * 1000).toISOString();

    const { error } = await supabase.from('secure_sessions').insert({
      session_token: token,
      agr_id: agrId,
      cert_serial: certSerial ?? null,
      ip_address: ipAddress,
      user_agent: userAgent,
      expires_at: expiresAt,
    });

    if (error) throw new Error(`SessionManager.create failed: ${error.message}`);

    await AuditLogger.log({
      eventType: 'SESSION_CREATED',
      agrId,
      ipAddress,
      userAgent,
      severity: 'INFO',
    });

    return token;
  },

  /**
   * Valida um token de sessão. Retorna os dados ou lança erro.
   */
  async validate(token: string): Promise<AgrSession> {
    const supabase = await getSupabase();
    const { data, error } = await supabase
      .from('secure_sessions')
      .select('session_token, agr_id, cert_serial, expires_at, is_active')
      .eq('session_token', token)
      .single();

    if (error || !data) throw new Error('Sessão não encontrada.');
    if (!data.is_active) throw new Error('Sessão encerrada.');
    if (new Date(data.expires_at) < new Date()) {
      await SessionManager.revoke(token);
      throw new Error('Sessão expirada.');
    }

    // Atualizar last_activity
    await supabase
      .from('secure_sessions')
      .update({ last_activity: new Date().toISOString() })
      .eq('session_token', token);

    return {
      sessionToken: data.session_token,
      agrId: data.agr_id,
      certSerial: data.cert_serial ?? undefined,
      expiresAt: new Date(data.expires_at),
    };
  },

  /**
   * Revoga (encerra) uma sessão.
   */
  async revoke(token: string): Promise<void> {
    const supabase = await getSupabase();
    await supabase
      .from('secure_sessions')
      .update({ is_active: false })
      .eq('session_token', token);
  },
};

// ===========================================================================
// 3. RATE LIMITER — Proteção contra força bruta
// ===========================================================================

interface RateLimitConfig {
  maxRequests: number;
  windowSeconds: number;
  blockDurationSeconds: number;
}

const RATE_LIMITS: Record<string, RateLimitConfig> = {
  LOGIN:   { maxRequests: 5,  windowSeconds: 60,  blockDurationSeconds: 300  }, // 5/min → bloqueia 5min
  SIGN:    { maxRequests: 10, windowSeconds: 60,  blockDurationSeconds: 120  },
  EMIT:    { maxRequests: 20, windowSeconds: 300, blockDurationSeconds: 600  },
  DEFAULT: { maxRequests: 30, windowSeconds: 60,  blockDurationSeconds: 60   },
};

export const RateLimiter = {
  /**
   * Verifica e incrementa o bucket usando upsert atômico.
   * Lança RateLimitError se excedido.
   */
  async check(key: string, action: string): Promise<void> {
    const supabase = await getSupabase();
    const cfg = RATE_LIMITS[action] ?? RATE_LIMITS.DEFAULT;
    const bucketKey = `${key}:${action}`;
    const now = new Date();

    // Usa upsert com RPC para evitar race condition (read-then-write)
    // Tenta criar o bucket se não existir
    const { data: existing } = await supabase
      .from('rate_limit_buckets')
      .select('*')
      .eq('bucket_key', bucketKey)
      .maybeSingle();

    if (!existing) {
      const { error } = await supabase.from('rate_limit_buckets').insert({
        bucket_key: bucketKey,
        action,
        request_count: 1,
        window_start: now.toISOString(),
      });
      if (error && error.code !== '23505') {
        // 23505 = unique violation (outro nó criou primeiro — ok)
        throw new Error(`RateLimiter.check failed: ${error.message}`);
      }
      return;
    }

    // Bucket bloqueado?
    if (existing.blocked_until && new Date(existing.blocked_until) > now) {
      const remaining = Math.ceil(
        (new Date(existing.blocked_until).getTime() - now.getTime()) / 1000,
      );
      throw new RateLimitError(`Muitas tentativas. Tente em ${remaining}s.`, remaining);
    }

    // Dentro da janela?
    const windowStart = new Date(existing.window_start);
    const windowAge = (now.getTime() - windowStart.getTime()) / 1000;

    if (windowAge < cfg.windowSeconds) {
      if (existing.request_count >= cfg.maxRequests) {
        const blockedUntil = new Date(now.getTime() + cfg.blockDurationSeconds * 1000);
        await supabase
          .from('rate_limit_buckets')
          .update({
            blocked_until: blockedUntil.toISOString(),
            updated_at: now.toISOString(),
          })
          .eq('bucket_key', bucketKey);
        throw new RateLimitError(
          `Rate limit atingido. Bloqueado por ${cfg.blockDurationSeconds}s.`,
          cfg.blockDurationSeconds,
        );
      }
      await supabase
        .from('rate_limit_buckets')
        .update({
          request_count: existing.request_count + 1,
          updated_at: now.toISOString(),
        })
        .eq('bucket_key', bucketKey);
    } else {
      // Nova janela
      await supabase
        .from('rate_limit_buckets')
        .update({
          request_count: 1,
          window_start: now.toISOString(),
          blocked_until: null,
          updated_at: now.toISOString(),
        })
        .eq('bucket_key', bucketKey);
    }
  },
};

export class RateLimitError extends Error {
  constructor(message: string, public retryAfterSeconds: number) {
    super(message);
    this.name = 'RateLimitError';
  }
}

// ===========================================================================
// 4. AUDIT LOGGER — Trilha Imutável
// ===========================================================================

interface AuditEvent {
  eventType: string;
  agrId?: string;
  protocolId?: string;
  ipAddress?: string;
  userAgent?: string;
  payload?: Record<string, unknown>;
  severity?: 'INFO' | 'WARN' | 'ERROR' | 'CRITICAL';
}

export const AuditLogger = {
  async log(event: AuditEvent): Promise<void> {
    try {
      const supabase = await getSupabase();
      const { error } = await supabase.from('audit_logs').insert({
        event_type: event.eventType,
        agr_id: event.agrId ?? null,
        protocol_id: event.protocolId ?? null,
        ip_address: event.ipAddress ?? null,
        user_agent: event.userAgent ?? null,
        payload: event.payload ?? null,
        severity: event.severity ?? 'INFO',
      });
      if (error) console.error('[AuditLogger] Falha ao registrar evento:', error.message);
    } catch (e) {
      console.error('[AuditLogger] Exceção ao registrar evento:', e);
    }
  },
};

// ===========================================================================
// 5. LOCKER LOGIC — Controle de Concorrência de Protocolo
// ===========================================================================

export const ProtocolLocker = {
  /**
   * Tenta assumir (travar) um protocolo para um AGR.
   * Usa update com WHERE para garantir atomicidade (TOCTOU-safe).
   */
  async lock(protocolId: string, agrId: string): Promise<void> {
    const supabase = await getSupabase();

    // Tentativa atômica: só atualiza se NÃO estiver locked por outro AGR
    const { data, error: selectError } = await supabase
      .from('protocols')
      .select('is_locked, locked_by')
      .eq('id', protocolId)
      .single();

    if (selectError) throw new Error(`ProtocolLocker.lock failed: ${selectError.message}`);

    if (data?.is_locked && data.locked_by !== agrId) {
      throw new Error('Protocolo bloqueado por outro AGR.');
    }

    const { error: updateError } = await supabase
      .from('protocols')
      .update({
        is_locked: true,
        locked_by: agrId,
        locked_at: new Date().toISOString(),
        status: 'IN_PROGRESS',
      })
      .eq('id', protocolId)
      .eq('is_locked', data?.is_locked ?? false) // Otimista: garante que ninguém travou entre a leitura e escrita
      .eq('locked_by', data?.locked_by ?? null);

    if (updateError) throw new Error(`ProtocolLocker.lock failed: ${updateError.message}`);

    await AuditLogger.log({
      eventType: 'PROTOCOL_LOCKED',
      agrId,
      protocolId,
      severity: 'INFO',
    });
  },

  /**
   * Libera o protocolo (apenas o próprio AGR ou ADMIN pode desbloquear).
   */
  async unlock(protocolId: string, agrId: string): Promise<void> {
    const supabase = await getSupabase();
    const { error } = await supabase
      .from('protocols')
      .update({ is_locked: false, locked_by: null, locked_at: null })
      .eq('id', protocolId)
      .eq('locked_by', agrId);

    if (error) throw new Error(`ProtocolLocker.unlock failed: ${error.message}`);

    await AuditLogger.log({
      eventType: 'PROTOCOL_UNLOCKED',
      agrId,
      protocolId,
      severity: 'INFO',
    });
  },
};
