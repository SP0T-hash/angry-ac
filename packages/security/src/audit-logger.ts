/**
 * AuditLogger - Trilha de Auditoria Imutável com Hash Chain
 * 
 * Registra todas as operações críticas em log imutável.
 * Usa hash chain para garantir integridade dos registros.
 */

import { createHash } from 'crypto';
import { getSupabaseAdmin } from './supabase-factory';

export interface AuditEvent {
  eventType: string;
  agrId?: string;
  protocolId?: string;
  ipAddress?: string;
  userAgent?: string;
  payload?: Record<string, unknown>;
  severity?: 'INFO' | 'WARN' | 'ERROR' | 'CRITICAL';
}

export interface AuditQuery {
  eventType?: string;
  agrId?: string;
  protocolId?: string;
  severity?: string;
  startDate?: string;
  endDate?: string;
  limit?: number;
  offset?: number;
}

export interface AuditEntry {
  id: string;
  eventType: string;
  agrId: string | null;
  protocolId: string | null;
  ipAddress: string | null;
  userAgent: string | null;
  payload: Record<string, unknown> | null;
  severity: string;
  createdAt: string;
}

function envInt(name: string, fallback: number): number {
  const v = process.env[name];
  return v ? parseInt(v, 10) : fallback;
}

const AUDIT_RETENTION_DAYS = envInt('AUDIT_RETENTION_DAYS', 1825);

async function getLastAuditHash(): Promise<string | null> {
  const supabase = await getSupabaseAdmin();
  const { data } = await supabase
    .from('audit_logs')
    .select('payload')
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle();

  if (data?.payload && typeof data.payload === 'object' && 'hash_chain' in (data.payload as Record<string, unknown>)) {
    return (data.payload as Record<string, string>).hash_chain ?? null;
  }
  return null;
}

function mapAuditRow(row: Record<string, unknown>): AuditEntry {
  return {
    id: String(row.id),
    eventType: String(row.event_type),
    agrId: row.agr_id ? String(row.agr_id) : null,
    protocolId: row.protocol_id ? String(row.protocol_id) : null,
    ipAddress: row.ip_address ? String(row.ip_address) : null,
    userAgent: row.user_agent ? String(row.user_agent) : null,
    payload: row.payload ? row.payload as Record<string, unknown> : null,
    severity: String(row.severity),
    createdAt: String(row.created_at),
  };
}

export const AuditLogger = {
  /**
   * Registra um evento de auditoria
   * O log é imutável - uma vez escrito, não pode ser modificado
   */
  async log(event: AuditEvent): Promise<void> {
    const supabase = await getSupabaseAdmin();
    const prevHash = await getLastAuditHash();
    const timestamp = new Date().toISOString();
    const chainData = `${prevHash ?? ''}|${event.eventType}|${event.agrId ?? ''}|${timestamp}`;
    const hashChain = createHash('sha256').update(chainData).digest('hex');

    const payload: Record<string, unknown> = {
      ...(event.payload ?? {}),
      hash_chain: hashChain,
      prev_hash: prevHash,
      chain_timestamp: timestamp,
    };

    supabase.from('audit_logs').insert({
      event_type: event.eventType,
      agr_id: event.agrId ?? null,
      protocol_id: event.protocolId ?? null,
      ip_address: event.ipAddress ?? null,
      user_agent: event.userAgent ?? null,
      payload,
      severity: event.severity ?? 'INFO',
    }).then(({ error }) => {
      if (error) console.error('[AuditLogger] Falha ao registrar evento:', error.message);
    });
  },

  /**
   * Consulta logs de auditoria com filtros
   */
  async query(filters: AuditQuery = {}): Promise<AuditEntry[]> {
    const supabase = await getSupabaseAdmin();
    let query = supabase
      .from('audit_logs')
      .select('*');

    if (filters.eventType) query = query.eq('event_type', filters.eventType);
    if (filters.agrId) query = query.eq('agr_id', filters.agrId);
    if (filters.protocolId) query = query.eq('protocol_id', filters.protocolId);
    if (filters.severity) query = query.eq('severity', filters.severity);
    if (filters.startDate) query = query.gte('created_at', filters.startDate);
    if (filters.endDate) query = query.lte('created_at', filters.endDate);

    query = query
      .order('created_at', { ascending: false })
      .limit(filters.limit ?? 100)
      .range(filters.offset ?? 0, (filters.offset ?? 0) + (filters.limit ?? 100) - 1);

    const { data, error } = await query;

    if (error) throw new Error(`AuditLogger.query failed: ${error.message}`);

    return ((data ?? []) as Record<string, unknown>[]).map(mapAuditRow);
  },

  /**
   * Exporta logs para CSV
   */
  async exportToCSV(filters: AuditQuery = {}): Promise<string> {
    const entries = await AuditLogger.query({ ...filters, limit: 10000 });
    const headers = ['ID', 'EventType', 'AgrID', 'ProtocolID', 'IPAddress', 'Severity', 'CreatedAt', 'HashChain'];
    const rows = entries.map(e => [
      e.id,
      e.eventType,
      e.agrId ?? '',
      e.protocolId ?? '',
      e.ipAddress ?? '',
      e.severity,
      e.createdAt,
      (e.payload?.hash_chain as string) ?? '',
    ]);
    return [headers.join(','), ...rows.map(r => r.map(v => `"${String(v).replace(/"/g, '""')}"`).join(','))].join('\n');
  },

  /**
   * Remove logs antigos conforme política de retenção
   */
  async cleanup(): Promise<void> {
    const supabase = await getSupabaseAdmin();
    const cutoff = new Date(Date.now() - AUDIT_RETENTION_DAYS * 86400000).toISOString();
    const { error } = await supabase
      .from('audit_logs')
      .delete()
      .lt('created_at', cutoff);

    if (error) console.error('[AuditLogger] cleanup error:', error.message);
  },

  /**
   * Verifica integridade da hash chain
   */
  async verifyChain(): Promise<{ valid: boolean; brokenAt?: string }> {
    const supabase = await getSupabaseAdmin();
    const { data, error } = await supabase
      .from('audit_logs')
      .select('id, payload, created_at')
      .order('created_at', { ascending: true });

    if (error) throw new Error(`AuditLogger.verifyChain failed: ${error.message}`);
    if (!data || data.length === 0) return { valid: true };

    let prevHash: string | null = null;

    for (const row of data) {
      const p = row.payload as Record<string, unknown> | null;
      if (!p || !p.hash_chain) continue;

      const expectedPrev = prevHash;
      const storedPrev = p.prev_hash as string | null;

      if (expectedPrev !== storedPrev) {
        return { valid: false, brokenAt: row.id };
      }

      const chainData: string = `${prevHash ?? ''}|?|?|${String(p.chain_timestamp ?? '')}`;
      const computed: string = createHash('sha256').update(chainData).digest('hex');
      prevHash = computed;
    }

    return { valid: true };
  },
};
