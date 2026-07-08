/**
 * RateLimiter - Proteção contra força bruta
 * 
 * Controla taxa de requisições por chave e ação.
 * Implementa bloqueio exponencial para ataques persistentes.
 */

import { getSupabaseAdmin } from './supabase-factory';

interface RateLimitConfig {
  maxRequests: number;
  windowSeconds: number;
  blockDurationSeconds: number;
}

function envInt(name: string, fallback: number): number {
  const v = process.env[name];
  return v ? parseInt(v, 10) : fallback;
}

const RATE_LIMITS: Record<string, RateLimitConfig> = {
  LOGIN:   { maxRequests: envInt('RATE_LIMIT_MAX_LOGIN', 5),  windowSeconds: envInt('RATE_LIMIT_WINDOW', 60),  blockDurationSeconds: 300 },
  SIGN:    { maxRequests: envInt('RATE_LIMIT_MAX_EMIT', 10),  windowSeconds: envInt('RATE_LIMIT_WINDOW', 60),  blockDurationSeconds: 120 },
  EMIT:    { maxRequests: envInt('RATE_LIMIT_MAX_EMIT', 20),  windowSeconds: envInt('RATE_LIMIT_WINDOW', 300), blockDurationSeconds: 600 },
  DEFAULT: { maxRequests: 30, windowSeconds: 60, blockDurationSeconds: 60 },
};

export class RateLimitError extends Error {
  constructor(message: string, public retryAfterSeconds: number) {
    super(message);
    this.name = 'RateLimitError';
  }
}

export const RateLimiter = {
  /**
   * Verifica se a requisição está dentro do limite
   */
  async check(key: string, action: string): Promise<void> {
    const supabase = await getSupabaseAdmin();
    const cfg = RATE_LIMITS[action] ?? RATE_LIMITS.DEFAULT;
    const bucketKey = `${key}:${action}`;

    const { data } = await supabase
      .from('rate_limit_buckets')
      .select('*')
      .eq('bucket_key', bucketKey)
      .single();

    const now = new Date();

    if (data) {
      // Verificar se está bloqueado
      if (data.blocked_until && new Date(data.blocked_until) > now) {
        const remaining = Math.ceil(
          (new Date(data.blocked_until).getTime() - now.getTime()) / 1000
        );
        throw new RateLimitError(`Muitas tentativas. Tente em ${remaining}s.`, remaining);
      }

      const windowStart = new Date(data.window_start);
      const windowAge = (now.getTime() - windowStart.getTime()) / 1000;

      if (windowAge < cfg.windowSeconds) {
        // Dentro da janela de tempo
        if (data.request_count >= cfg.maxRequests) {
          // Limite atingido - aplicar bloqueio exponencial
          const consecutiveBlocks = data.blocked_until && new Date(data.blocked_until) < now
            ? (data.request_count > cfg.maxRequests ? data.request_count - cfg.maxRequests + 1 : 2)
            : (data.request_count > cfg.maxRequests ? data.request_count - cfg.maxRequests + 1 : 1);

          const blockDuration = cfg.blockDurationSeconds * Math.pow(2, consecutiveBlocks - 1);
          const maxBlock = 86400; // Máximo 24 horas
          const actualDuration = Math.min(blockDuration, maxBlock);

          const blockedUntil = new Date(now.getTime() + actualDuration * 1000);
          await supabase
            .from('rate_limit_buckets')
            .update({
              request_count: cfg.maxRequests + consecutiveBlocks,
              blocked_until: blockedUntil.toISOString(),
              updated_at: now.toISOString(),
            })
            .eq('bucket_key', bucketKey);

          throw new RateLimitError(
            `Rate limit atingido. Bloqueado por ${actualDuration}s.`,
            actualDuration,
          );
        }
        // Incrementar contador
        await supabase
          .from('rate_limit_buckets')
          .update({ request_count: data.request_count + 1, updated_at: now.toISOString() })
          .eq('bucket_key', bucketKey);
      } else {
        // Janela expirada - resetar
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
    } else {
      // Primeira requisição
      await supabase.from('rate_limit_buckets').insert({
        bucket_key: bucketKey,
        action,
        request_count: 1,
        window_start: now.toISOString(),
      });
    }
  },

  /**
   * Retorna tentativas restantes
   */
  async getRemainingAttempts(bucketKey: string, action: string): Promise<number> {
    const supabase = await getSupabaseAdmin();
    const cfg = RATE_LIMITS[action] ?? RATE_LIMITS.DEFAULT;
    const { data } = await supabase
      .from('rate_limit_buckets')
      .select('request_count, blocked_until, window_start')
      .eq('bucket_key', `${bucketKey}:${action}`)
      .single();

    if (!data) return cfg.maxRequests;

    if (data.blocked_until && new Date(data.blocked_until) > new Date()) return 0;

    const windowAge = (Date.now() - new Date(data.window_start).getTime()) / 1000;
    if (windowAge >= cfg.windowSeconds) return cfg.maxRequests;

    const count = data.request_count > cfg.maxRequests ? cfg.maxRequests : data.request_count;
    return Math.max(0, cfg.maxRequests - count);
  },

  /**
   * Reseta o bucket de rate limiting
   */
  async resetBucket(bucketKey: string, action: string): Promise<void> {
    const supabase = await getSupabaseAdmin();
    const { error } = await supabase
      .from('rate_limit_buckets')
      .update({
        request_count: 0,
        blocked_until: null,
        window_start: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq('bucket_key', `${bucketKey}:${action}`);

    if (error) throw new Error(`RateLimiter.resetBucket failed: ${error.message}`);
  },
};
