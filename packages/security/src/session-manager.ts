/**
 * SessionManager - Sessões AGR Autenticadas
 * 
 * Gerencia criação, validação e revogação de sessões
 * para Agentes de Registro (AGRs).
 */

import { randomBytes } from 'crypto';
import { getSupabaseAdmin } from './supabase-factory';
import { AuditLogger } from './audit-logger';

export interface AgrSession {
  sessionToken: string;
  agrId: string;
  certSerial?: string;
  expiresAt: Date;
}

export interface SecureSession {
  id: string;
  session_token: string;
  agr_id: string;
  cert_serial: string | null;
  ip_address: string | null;
  user_agent: string | null;
  is_active: boolean;
  expires_at: string;
  last_activity: string;
  created_at: string;
}

const SESSION_TTL_HOURS = 8;

export const SessionManager = {
  /**
   * Cria uma nova sessão autenticada
   */
  async create(
    agrId: string,
    ipAddress: string,
    userAgent: string,
    certSerial?: string,
  ): Promise<string> {
    const supabase = await getSupabaseAdmin();
    await SessionManager.cleanupExpired();

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
   * Valida uma sessão existente
   */
  async validate(token: string): Promise<AgrSession> {
    const supabase = await getSupabaseAdmin();
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
   * Revoga uma sessão
   */
  async revoke(token: string): Promise<void> {
    const supabase = await getSupabaseAdmin();
    await supabase
      .from('secure_sessions')
      .update({ is_active: false })
      .eq('session_token', token);
  },

  /**
   * Rotaciona token de sessão (refresh)
   */
  async rotateToken(oldToken: string): Promise<string> {
    const supabase = await getSupabaseAdmin();
    const session = await SessionManager.validate(oldToken);
    const newToken = randomBytes(48).toString('base64url');
    const expiresAt = new Date(Date.now() + SESSION_TTL_HOURS * 3600 * 1000).toISOString();

    const { error } = await supabase
      .from('secure_sessions')
      .update({ session_token: newToken, expires_at: expiresAt, last_activity: new Date().toISOString() })
      .eq('session_token', oldToken);

    if (error) throw new Error(`SessionManager.rotateToken failed: ${error.message}`);

    await AuditLogger.log({
      eventType: 'SESSION_ROTATED',
      agrId: session.agrId,
      severity: 'INFO',
    });

    return newToken;
  },

  /**
   * Retorna sessões ativas de um AGR
   */
  async getActiveSessions(agrId: string): Promise<SecureSession[]> {
    const supabase = await getSupabaseAdmin();
    const { data, error } = await supabase
      .from('secure_sessions')
      .select('*')
      .eq('agr_id', agrId)
      .eq('is_active', true)
      .gte('expires_at', new Date().toISOString());

    if (error) throw new Error(`SessionManager.getActiveSessions failed: ${error.message}`);
    return (data ?? []) as SecureSession[];
  },

  /**
   * Encerra todas as outras sessões (exceto a atual)
   */
  async terminateOtherSessions(agrId: string, currentToken: string): Promise<void> {
    const supabase = await getSupabaseAdmin();
    const { error } = await supabase
      .from('secure_sessions')
      .update({ is_active: false })
      .eq('agr_id', agrId)
      .neq('session_token', currentToken);

    if (error) throw new Error(`SessionManager.terminateOtherSessions failed: ${error.message}`);

    await AuditLogger.log({
      eventType: 'SESSIONS_TERMINATED',
      agrId,
      severity: 'INFO',
    });
  },

  /**
   * Remove sessões expiradas
   */
  async cleanupExpired(): Promise<void> {
    const supabase = await getSupabaseAdmin();
    const { error } = await supabase
      .from('secure_sessions')
      .update({ is_active: false })
      .lt('expires_at', new Date().toISOString())
      .eq('is_active', true);

    if (error) console.error('[SessionManager] cleanupExpired error:', error.message);
  },
};
