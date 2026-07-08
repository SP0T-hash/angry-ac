/**
 * ProtocolLocker - Controle de Concorrência de Protocolo
 * 
 * Gerencia locks de protocolo para evitar edições simultâneas.
 * Implementa expiração automática de locks (30 minutos).
 */

import { getSupabaseAdmin } from './supabase-factory';
import { AuditLogger } from './audit-logger';

const LOCK_EXPIRY_MS = 30 * 60 * 1000; // 30 minutos

export const ProtocolLocker = {
  /**
   * Bloqueia um protocolo para edição exclusiva
   */
  async lock(protocolId: string, agrId: string): Promise<void> {
    const supabase = await getSupabaseAdmin();
    const { data } = await supabase
      .from('protocols')
      .select('is_locked, locked_by, locked_at')
      .eq('id', protocolId)
      .single();

    if (data?.is_locked && data.locked_by !== agrId) {
      if (data.locked_at && Date.now() - new Date(data.locked_at).getTime() > LOCK_EXPIRY_MS) {
        await ProtocolLocker.forceUnlock(protocolId, agrId);
      } else {
        throw new Error('Protocolo bloqueado por outro AGR.');
      }
    }

    const { error } = await supabase
      .from('protocols')
      .update({
        is_locked: true,
        locked_by: agrId,
        locked_at: new Date().toISOString(),
        status: 'IN_PROGRESS',
      })
      .eq('id', protocolId);

    if (error) throw new Error(`ProtocolLocker.lock failed: ${error.message}`);

    await AuditLogger.log({
      eventType: 'PROTOCOL_LOCKED',
      agrId,
      protocolId,
      severity: 'INFO',
    });
  },

  /**
   * Desbloqueia um protocolo
   */
  async unlock(protocolId: string, agrId: string): Promise<void> {
    const supabase = await getSupabaseAdmin();
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

  /**
   * Retorna status do lock
   */
  async getLockStatus(protocolId: string): Promise<{ locked: boolean; lockedBy: string | null; lockedAt: string | null }> {
    const supabase = await getSupabaseAdmin();
    const { data, error } = await supabase
      .from('protocols')
      .select('is_locked, locked_by, locked_at')
      .eq('id', protocolId)
      .single();

    if (error || !data) throw new Error('Protocolo não encontrado.');
    return {
      locked: data.is_locked,
      lockedBy: data.locked_by,
      lockedAt: data.locked_at,
    };
  },

  /**
   * Força desbloqueio (quando lock expirou)
   */
  async forceUnlock(protocolId: string, agrId: string): Promise<void> {
    const supabase = await getSupabaseAdmin();
    const { error } = await supabase
      .from('protocols')
      .update({ is_locked: false, locked_by: null, locked_at: null })
      .eq('id', protocolId);

    if (error) throw new Error(`ProtocolLocker.forceUnlock failed: ${error.message}`);

    await AuditLogger.log({
      eventType: 'PROTOCOL_FORCE_UNLOCKED',
      agrId,
      protocolId,
      severity: 'WARN',
    });
  },

  /**
   * Verifica se o lock expirou
   */
  async isLockExpired(protocolId: string): Promise<boolean> {
    const supabase = await getSupabaseAdmin();
    const { data, error } = await supabase
      .from('protocols')
      .select('locked_at')
      .eq('id', protocolId)
      .single();

    if (error || !data) throw new Error('Protocolo não encontrado.');
    if (!data.locked_at) return false;

    return Date.now() - new Date(data.locked_at).getTime() > LOCK_EXPIRY_MS;
  },
};
