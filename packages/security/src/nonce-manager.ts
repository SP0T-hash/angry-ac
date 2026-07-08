/**
 * NonceManager - Anti-Replay / CSRF
 * 
 * Gera e valida nonces de uso único com assinatura HMAC-SHA256.
 * Previne ataques de replay em operações críticas.
 */

import { createHmac, randomBytes, timingSafeEqual } from 'crypto';
import { getSupabaseAdmin } from './supabase-factory';

export type NonceScope = 'AUTH' | 'SIGN' | 'BIOMETRY' | 'EMIT';

const ENV_NONCE_TTL = Number(process.env.PKI_NONCE_TTL) || 300000; // ms, default 5min

const NONCE_TTL: Record<NonceScope, number> = {
  AUTH:     Math.floor(ENV_NONCE_TTL / 1000),
  SIGN:     Math.floor((ENV_NONCE_TTL * 0.4) / 1000),
  BIOMETRY: Math.floor((ENV_NONCE_TTL * 0.6) / 1000),
  EMIT:     Math.floor((ENV_NONCE_TTL * 2) / 1000),
};

export const NonceManager = {
  /**
   * Gera um nonce único, assina com HMAC e persiste no Supabase
   */
  async generate(
    scope: NonceScope,
    protocolId?: string,
    agrId?: string,
  ): Promise<string> {
    const supabase = await getSupabaseAdmin();
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
   * Valida e consome (one-time use) um nonce
   * Usa timingSafeEqual para prevenir timing attacks
   * Usa atomic update com eq('used', false) para prevenir race conditions
   */
  async consume(nonce: string, scope: NonceScope): Promise<void> {
    const supabase = await getSupabaseAdmin();
    const [raw, signature] = nonce.split('.');
    if (!raw || !signature) throw new Error('Nonce malformado.');

    const secret = process.env.PKI_NONCE_SECRET!;
    const expected = createHmac('sha256', secret).update(raw).digest('hex');

    // Usar timingSafeEqual para prevenir timing attacks
    const expectedBuf = Buffer.from(expected, 'hex');
    const signatureBuf = Buffer.from(signature, 'hex');
    if (expectedBuf.length !== signatureBuf.length || !timingSafeEqual(expectedBuf, signatureBuf)) {
      throw new Error('Assinatura de nonce inválida.');
    }

    const { data, error } = await supabase
      .from('security_nonces')
      .select('id, used, expires_at, scope')
      .eq('nonce', nonce)
      .single();

    if (error || !data) throw new Error('Nonce não encontrado.');
    if (data.used) throw new Error('Nonce já utilizado (replay detectado).');
    if (data.scope !== scope) throw new Error(`Nonce de escopo inválido: esperado ${scope}.`);
    if (new Date(data.expires_at) < new Date()) throw new Error('Nonce expirado.');

    // Atomic consume - usa eq('used', false) para garantir que apenas uma requisição consome
    const { error: updateError } = await supabase
      .from('security_nonces')
      .update({ used: true, used_at: new Date().toISOString() })
      .eq('id', data.id)
      .eq('used', false); // Atomic: só atualiza se ainda não foi usado

    if (updateError) throw new Error('Nonce já está sendo processado por outra requisição.');
  },

  /**
   * Gera token CSRF para formulários
   */
  generateCSRFToken(): string {
    const raw = randomBytes(32).toString('hex');
    const secret = process.env.PKI_NONCE_SECRET!;
    const signature = createHmac('sha256', secret).update(raw).digest('hex');
    return `${raw}.${signature}`;
  },

  /**
   * Valida token CSRF
   */
  validateCSRFToken(token: string): boolean {
    const [raw, signature] = token.split('.');
    if (!raw || !signature) return false;
    const secret = process.env.PKI_NONCE_SECRET!;
    const expected = createHmac('sha256', secret).update(raw).digest('hex');
    if (expected.length !== signature.length) return false;
    return timingSafeEqual(Buffer.from(expected), Buffer.from(signature));
  },

  /**
   * Gera códigos de backup para recuperação de conta
   */
  generateBackupCodes(): string[] {
    const codes: string[] = [];
    for (let i = 0; i < 8; i++) {
      const code = randomBytes(4).toString('hex').toUpperCase();
      codes.push(`${code.slice(0, 4)}-${code.slice(4, 8)}`);
    }
    return codes;
  },
};
