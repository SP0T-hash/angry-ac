import { describe, it, expect, vi, beforeEach, beforeAll, afterAll } from 'vitest';
import { createHmac } from 'crypto';

const mockCreateClient = vi.fn();
const mockFrom = vi.fn();

vi.mock('@supabase/supabase-js', () => ({
  createClient: mockCreateClient,
}));

import { NonceManager, SessionManager, RateLimiter, AuditLogger, ProtocolLocker, RateLimitError } from '../security';

function createChain(overrides: Record<string, any> = {}) {
  const c: any = {};
  c.select = vi.fn(() => c);
  c.eq = vi.fn(() => c);
  c.update = vi.fn(() => c);
  c.order = vi.fn(() => c);
  c.limit = vi.fn(() => c);
  c.single = vi.fn().mockResolvedValue({ data: null, error: null });
  c.maybeSingle = vi.fn().mockResolvedValue({ data: null, error: null });
  c.insert = vi.fn().mockResolvedValue({ data: null, error: null });
  c.then = (fn: (v: any) => any) => Promise.resolve({ data: null, error: null }).then(fn);
  return Object.assign(c, overrides);
}

const mockSupabase = { from: mockFrom };

beforeAll(() => {
  process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://test.supabase.co';
  process.env.SUPABASE_SERVICE_ROLE_KEY = 'test-service-role-key';
  process.env.PKI_NONCE_SECRET = 'a'.repeat(128);
  mockCreateClient.mockReturnValue(mockSupabase);
});

afterAll(() => {
  delete process.env.NEXT_PUBLIC_SUPABASE_URL;
  delete process.env.SUPABASE_SERVICE_ROLE_KEY;
  delete process.env.PKI_NONCE_SECRET;
});

beforeEach(() => {
  vi.clearAllMocks();
  mockFrom.mockImplementation(() => createChain());
});

function makeValidNonce(raw: string): string {
  const secret = process.env.PKI_NONCE_SECRET!;
  const signature = createHmac('sha256', secret).update(raw).digest('hex');
  return `${raw}.${signature}`;
}

const FUTURE = new Date(Date.now() + 3600000).toISOString();
const PAST = new Date(Date.now() - 3600000).toISOString();

describe('NonceManager', () => {
  describe('generate', () => {
    it('creates a nonce with raw.signature format (64 hex chars each)', async () => {
      const nonce = await NonceManager.generate('AUTH');
      expect(nonce).toMatch(/^[a-f0-9]{64}\.[a-f0-9]{64}$/);
    });

    it('accepts all 4 scopes', async () => {
      for (const scope of ['AUTH', 'SIGN', 'BIOMETRY', 'EMIT'] as const) {
        const nonce = await NonceManager.generate(scope);
        expect(nonce).toMatch(/^[a-f0-9]{64}\.[a-f0-9]{64}$/);
      }
    });

    it('inserts into security_nonces table with correct data', async () => {
      const insertMock = vi.fn().mockResolvedValue({ data: null, error: null });
      mockFrom.mockImplementation((table: string) => {
        if (table === 'security_nonces') return createChain({ insert: insertMock });
        return createChain();
      });

      await NonceManager.generate('SIGN', 'protocol-1', 'agr-1');

      expect(insertMock).toHaveBeenCalledWith(
        expect.objectContaining({
          scope: 'SIGN',
          protocol_id: 'protocol-1',
          agr_id: 'agr-1',
          expires_at: expect.any(String),
          nonce: expect.any(String),
        }),
      );
    });

    it('throws on insert error', async () => {
      const insertMock = vi.fn().mockResolvedValue({ data: null, error: new Error('DB insert failed') });
      mockFrom.mockImplementation((table: string) => {
        if (table === 'security_nonces') return createChain({ insert: insertMock });
        return createChain();
      });

      await expect(NonceManager.generate('AUTH')).rejects.toThrow('NonceManager.generate failed');
    });
  });

  describe('consume', () => {
    it('throws on malformed nonce (no dot separator)', async () => {
      await expect(NonceManager.consume('invalid', 'AUTH')).rejects.toThrow('Nonce malformado');
    });

    it('throws on invalid HMAC signature', async () => {
      const raw = 'a'.repeat(64);
      const badSig = 'b'.repeat(64);
      await expect(NonceManager.consume(`${raw}.${badSig}`, 'AUTH')).rejects.toThrow('Assinatura de nonce inválida');
    });

    it('throws on already-used nonce', async () => {
      const nonce = makeValidNonce('a'.repeat(64));
      const singleMock = vi.fn().mockResolvedValue({
        data: { id: 'uuid-1', used: true, scope: 'AUTH', expires_at: FUTURE },
        error: null,
      });
      mockFrom.mockImplementation((table: string) => {
        if (table === 'security_nonces') return createChain({ single: singleMock });
        return createChain();
      });

      await expect(NonceManager.consume(nonce, 'AUTH')).rejects.toThrow('Nonce já utilizado');
    });

    it('throws on wrong scope', async () => {
      const nonce = makeValidNonce('b'.repeat(64));
      const singleMock = vi.fn().mockResolvedValue({
        data: { id: 'uuid-2', used: false, scope: 'SIGN', expires_at: FUTURE },
        error: null,
      });
      mockFrom.mockImplementation((table: string) => {
        if (table === 'security_nonces') return createChain({ single: singleMock });
        return createChain();
      });

      await expect(NonceManager.consume(nonce, 'EMIT')).rejects.toThrow('Nonce de escopo inválido');
    });

    it('throws on expired nonce', async () => {
      const nonce = makeValidNonce('c'.repeat(64));
      const singleMock = vi.fn().mockResolvedValue({
        data: { id: 'uuid-3', used: false, scope: 'AUTH', expires_at: PAST },
        error: null,
      });
      mockFrom.mockImplementation((table: string) => {
        if (table === 'security_nonces') return createChain({ single: singleMock });
        return createChain();
      });

      await expect(NonceManager.consume(nonce, 'AUTH')).rejects.toThrow('Nonce expirado');
    });

    it('marks nonce as used in database on successful consume', async () => {
      const nonce = makeValidNonce('d'.repeat(64));
      const nonceId = 'uuid-4';
      const singleMock = vi.fn().mockResolvedValue({
        data: { id: nonceId, used: false, scope: 'AUTH', expires_at: FUTURE },
        error: null,
      });
      const updateSingleMock = vi.fn().mockResolvedValue({
        data: { id: nonceId, used: true },
        error: null,
      });
      const updateMock = vi.fn(() => createChain({ single: updateSingleMock }));
      mockFrom.mockImplementation((table: string) => {
        if (table === 'security_nonces') return createChain({ single: singleMock, update: updateMock });
        return createChain();
      });

      await NonceManager.consume(nonce, 'AUTH');

      expect(updateMock).toHaveBeenCalledWith(
        expect.objectContaining({ used: true, used_at: expect.any(String) }),
      );
    });

    it('throws when nonce is not found in database', async () => {
      const nonce = makeValidNonce('e'.repeat(64));
      const singleMock = vi.fn().mockResolvedValue({ data: null, error: new Error('not found') });
      mockFrom.mockImplementation((table: string) => {
        if (table === 'security_nonces') return createChain({ single: singleMock });
        return createChain();
      });

      await expect(NonceManager.consume(nonce, 'AUTH')).rejects.toThrow('Nonce não encontrado');
    });
  });
});

describe('SessionManager', () => {
  describe('create', () => {
    it('generates a session token', async () => {
      const token = await SessionManager.create('agr-1', '127.0.0.1', 'test-agent');
      expect(token).toMatch(/^[A-Za-z0-9_-]+$/);
      expect(token).toHaveLength(64);
    });

    it('inserts session and logs audit event', async () => {
      const insertMock = vi.fn().mockResolvedValue({ data: null, error: null });
      mockFrom.mockImplementation(() => createChain({ insert: insertMock }));

      await SessionManager.create('agr-1', '127.0.0.1', 'test-agent', 'cert-serial-123');

      expect(mockFrom).toHaveBeenNthCalledWith(1, 'secure_sessions');
      expect(mockFrom).toHaveBeenNthCalledWith(2, 'audit_logs');
      expect(insertMock).toHaveBeenCalledTimes(2);
      expect(insertMock).toHaveBeenNthCalledWith(1,
        expect.objectContaining({
          session_token: expect.any(String),
          agr_id: 'agr-1',
          ip_address: '127.0.0.1',
          user_agent: 'test-agent',
          cert_serial: 'cert-serial-123',
        }),
      );
      expect(insertMock).toHaveBeenNthCalledWith(2,
        expect.objectContaining({ event_type: 'SESSION_CREATED', agr_id: 'agr-1' }),
      );
    });

    it('defaults cert serial to null when not provided', async () => {
      const insertMock = vi.fn().mockResolvedValue({ data: null, error: null });
      mockFrom.mockImplementation(() => createChain({ insert: insertMock }));

      await SessionManager.create('agr-1', '127.0.0.1', 'test-agent');

      expect(insertMock).toHaveBeenCalledWith(
        expect.objectContaining({ cert_serial: null }),
      );
    });
  });

  describe('validate', () => {
    it('returns session data for valid token', async () => {
      const singleMock = vi.fn().mockResolvedValue({
        data: {
          session_token: 'valid-token',
          agr_id: 'agr-1',
          cert_serial: null,
          expires_at: FUTURE,
          is_active: true,
        },
        error: null,
      });
      mockFrom.mockImplementation((table: string) => {
        if (table === 'secure_sessions') return createChain({ single: singleMock });
        return createChain();
      });

      const session = await SessionManager.validate('valid-token');
      expect(session.sessionToken).toBe('valid-token');
      expect(session.agrId).toBe('agr-1');
      expect(session.certSerial).toBeUndefined();
    });

    it('throws for non-existent token', async () => {
      const singleMock = vi.fn().mockResolvedValue({ data: null, error: new Error('not found') });
      mockFrom.mockImplementation((table: string) => {
        if (table === 'secure_sessions') return createChain({ single: singleMock });
        return createChain();
      });

      await expect(SessionManager.validate('invalid-token')).rejects.toThrow('Sessão não encontrada');
    });

    it('throws for inactive session', async () => {
      const singleMock = vi.fn().mockResolvedValue({
        data: {
          session_token: 'inactive-token',
          agr_id: 'agr-1',
          cert_serial: null,
          expires_at: FUTURE,
          is_active: false,
        },
        error: null,
      });
      mockFrom.mockImplementation((table: string) => {
        if (table === 'secure_sessions') return createChain({ single: singleMock });
        return createChain();
      });

      await expect(SessionManager.validate('inactive-token')).rejects.toThrow('Sessão encerrada');
    });

    it('throws for expired session and auto-revokes', async () => {
      const singleMock = vi.fn().mockResolvedValue({
        data: {
          session_token: 'expired-token',
          agr_id: 'agr-1',
          cert_serial: null,
          expires_at: PAST,
          is_active: true,
        },
        error: null,
      });
      const revokeUpdateMock = vi.fn(() => createChain());
      mockFrom.mockImplementation((table: string) => {
        if (table === 'secure_sessions') return createChain({
          single: singleMock,
          update: revokeUpdateMock,
        });
        return createChain();
      });

      await expect(SessionManager.validate('expired-token')).rejects.toThrow('Sessão expirada');
      expect(revokeUpdateMock).toHaveBeenCalledWith(expect.objectContaining({ is_active: false }));
    });

    it('updates last_activity on valid session', async () => {
      const singleMock = vi.fn().mockResolvedValue({
        data: {
          session_token: 'active-token',
          agr_id: 'agr-1',
          cert_serial: null,
          expires_at: FUTURE,
          is_active: true,
        },
        error: null,
      });
      const activityUpdateMock = vi.fn(() => createChain());
      mockFrom.mockImplementation((table: string) => {
        if (table === 'secure_sessions') return createChain({
          single: singleMock,
          update: activityUpdateMock,
        });
        return createChain();
      });

      await SessionManager.validate('active-token');

      expect(activityUpdateMock).toHaveBeenCalledWith(
        expect.objectContaining({ last_activity: expect.any(String) }),
      );
    });
  });

  describe('revoke', () => {
    it('marks session as inactive', async () => {
      const updateMock = vi.fn(() => createChain());
      mockFrom.mockImplementation((table: string) => {
        if (table === 'secure_sessions') return createChain({ update: updateMock });
        return createChain();
      });

      await SessionManager.revoke('token-123');

      expect(updateMock).toHaveBeenCalledWith(expect.objectContaining({ is_active: false }));
    });

    it('can revoke by token', async () => {
      mockFrom.mockImplementation(() => createChain());
      await expect(SessionManager.revoke('any-token')).resolves.toBeUndefined();
    });
  });
});

describe('RateLimiter', () => {
  it('allows first request within limits', async () => {
    const maybeSingleMock = vi.fn().mockResolvedValue({ data: null, error: null });
    const insertMock = vi.fn().mockResolvedValue({ data: null, error: null });
    mockFrom.mockImplementation((table: string) => {
      if (table === 'rate_limit_buckets') return createChain({ maybeSingle: maybeSingleMock, insert: insertMock });
      return createChain();
    });

    await expect(RateLimiter.check('ip:test', 'LOGIN')).resolves.toBeUndefined();
    expect(insertMock).toHaveBeenCalledWith(
      expect.objectContaining({ bucket_key: 'ip:test:LOGIN', request_count: 1 }),
    );
  });

  it('throws RateLimitError when limit exceeded', async () => {
    const windowStart = new Date(Date.now() - 30000).toISOString();
    const maybeSingleMock = vi.fn().mockResolvedValue({
      data: {
        bucket_key: 'ip:test:LOGIN',
        action: 'LOGIN',
        request_count: 5,
        window_start: windowStart,
        blocked_until: null,
      },
      error: null,
    });
    const updateMock = vi.fn(() => createChain());
    mockFrom.mockImplementation((table: string) => {
      if (table === 'rate_limit_buckets') return createChain({ maybeSingle: maybeSingleMock, update: updateMock });
      return createChain();
    });

    await expect(RateLimiter.check('ip:test', 'LOGIN')).rejects.toThrow(RateLimitError);
    expect(updateMock).toHaveBeenCalledWith(
      expect.objectContaining({ blocked_until: expect.any(String) }),
    );
  });

  it('throws with correct retryAfter value when blocked', async () => {
    const blockedUntil = new Date(Date.now() + 10000).toISOString();
    const maybeSingleMock = vi.fn().mockResolvedValue({
      data: {
        bucket_key: 'ip:test:LOGIN',
        action: 'LOGIN',
        request_count: 5,
        window_start: new Date(Date.now() - 30000).toISOString(),
        blocked_until: blockedUntil,
      },
      error: null,
    });
    mockFrom.mockImplementation((table: string) => {
      if (table === 'rate_limit_buckets') return createChain({ maybeSingle: maybeSingleMock });
      return createChain();
    });

    const error = await RateLimiter.check('ip:test', 'LOGIN').catch((e) => e);
    expect(error).toBeInstanceOf(RateLimitError);
    expect(error.retryAfterSeconds).toBeGreaterThan(0);
    expect(error.retryAfterSeconds).toBeLessThanOrEqual(15);
  });

  it('resets window after time expires', async () => {
    const windowStart = new Date(Date.now() - 120000).toISOString();
    const maybeSingleMock = vi.fn().mockResolvedValue({
      data: {
        bucket_key: 'ip:test:LOGIN',
        action: 'LOGIN',
        request_count: 5,
        window_start: windowStart,
        blocked_until: null,
      },
      error: null,
    });
    const updateMock = vi.fn(() => createChain());
    mockFrom.mockImplementation((table: string) => {
      if (table === 'rate_limit_buckets') return createChain({ maybeSingle: maybeSingleMock, update: updateMock });
      return createChain();
    });

    await RateLimiter.check('ip:test', 'LOGIN');
    expect(updateMock).toHaveBeenCalledWith(
      expect.objectContaining({ request_count: 1, blocked_until: null }),
    );
  });

  it('LOGIN has max 5 requests per minute', async () => {
    const windowStart = new Date(Date.now() - 10000).toISOString();
    const maybeSingleMock = vi.fn().mockResolvedValue({
      data: {
        bucket_key: 'ip:test:LOGIN',
        action: 'LOGIN',
        request_count: 4,
        window_start: windowStart,
        blocked_until: null,
      },
      error: null,
    });
    const updateMock = vi.fn(() => createChain());
    mockFrom.mockImplementation((table: string) => {
      if (table === 'rate_limit_buckets') return createChain({ maybeSingle: maybeSingleMock, update: updateMock });
      return createChain();
    });

    await RateLimiter.check('ip:test', 'LOGIN');
    expect(updateMock).toHaveBeenCalledWith(
      expect.objectContaining({ request_count: 5 }),
    );
  });

  it('EMIT has max 20 requests per 5 minutes', async () => {
    const windowStart = new Date(Date.now() - 60000).toISOString();
    const maybeSingleMock = vi.fn().mockResolvedValue({
      data: {
        bucket_key: 'ip:test:EMIT',
        action: 'EMIT',
        request_count: 19,
        window_start: windowStart,
        blocked_until: null,
      },
      error: null,
    });
    const updateMock = vi.fn(() => createChain());
    mockFrom.mockImplementation((table: string) => {
      if (table === 'rate_limit_buckets') return createChain({ maybeSingle: maybeSingleMock, update: updateMock });
      return createChain();
    });

    await RateLimiter.check('ip:test', 'EMIT');
    expect(updateMock).toHaveBeenCalledWith(
      expect.objectContaining({ request_count: 20 }),
    );
  });

  it('handles unique violation on concurrent insert gracefully', async () => {
    const maybeSingleMock = vi.fn().mockResolvedValue({ data: null, error: null });
    const insertMock = vi.fn().mockResolvedValue({ data: null, error: { code: '23505', message: 'duplicate' } });
    mockFrom.mockImplementation((table: string) => {
      if (table === 'rate_limit_buckets') return createChain({ maybeSingle: maybeSingleMock, insert: insertMock });
      return createChain();
    });

    await expect(RateLimiter.check('ip:test', 'LOGIN')).resolves.toBeUndefined();
  });
});

describe('AuditLogger', () => {
  it('inserts event into audit_logs table', async () => {
    const insertMock = vi.fn().mockResolvedValue({ data: null, error: null });
    mockFrom.mockImplementation(() => createChain({ insert: insertMock }));

    await AuditLogger.log({
      eventType: 'TEST_EVENT',
      agrId: 'agr-1',
      severity: 'INFO',
    });

    expect(mockFrom).toHaveBeenCalledWith('audit_logs');
    expect(insertMock).toHaveBeenCalledWith(expect.objectContaining({
      event_type: 'TEST_EVENT',
      agr_id: 'agr-1',
      severity: 'INFO',
    }));
  });

  it('handles missing optional fields gracefully', async () => {
    const insertMock = vi.fn().mockResolvedValue({ data: null, error: null });
    mockFrom.mockImplementation(() => createChain({ insert: insertMock }));

    await AuditLogger.log({ eventType: 'MINIMAL' });

    expect(insertMock).toHaveBeenCalledWith({
      event_type: 'MINIMAL',
      agr_id: null,
      protocol_id: null,
      ip_address: null,
      user_agent: null,
      payload: null,
      severity: 'INFO',
    });
  });

  it('works with all severity levels', async () => {
    const insertMock = vi.fn().mockResolvedValue({ data: null, error: null });
    mockFrom.mockImplementation(() => createChain({ insert: insertMock }));

    for (const severity of ['INFO', 'WARN', 'ERROR', 'CRITICAL'] as const) {
      await AuditLogger.log({ eventType: 'TEST', severity });
    }

    expect(insertMock).toHaveBeenCalledTimes(4);
    expect(insertMock).toHaveBeenNthCalledWith(1, expect.objectContaining({ severity: 'INFO' }));
    expect(insertMock).toHaveBeenNthCalledWith(2, expect.objectContaining({ severity: 'WARN' }));
    expect(insertMock).toHaveBeenNthCalledWith(3, expect.objectContaining({ severity: 'ERROR' }));
    expect(insertMock).toHaveBeenNthCalledWith(4, expect.objectContaining({ severity: 'CRITICAL' }));
  });

  it('uses INFO severity by default', async () => {
    const insertMock = vi.fn().mockResolvedValue({ data: null, error: null });
    mockFrom.mockImplementation(() => createChain({ insert: insertMock }));

    await AuditLogger.log({ eventType: 'DEFAULT_SEVERITY' });

    expect(insertMock).toHaveBeenCalledWith(expect.objectContaining({ severity: 'INFO' }));
  });

  it('catches errors internally and does not throw', async () => {
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    const insertMock = vi.fn().mockResolvedValue({ data: null, error: new Error('DB error') });
    mockFrom.mockImplementation(() => createChain({ insert: insertMock }));

    await expect(AuditLogger.log({ eventType: 'FAIL_TEST', severity: 'ERROR' })).resolves.toBeUndefined();
    expect(consoleSpy).toHaveBeenCalled();

    consoleSpy.mockRestore();
  });

  it('includes payload when provided', async () => {
    const insertMock = vi.fn().mockResolvedValue({ data: null, error: null });
    mockFrom.mockImplementation(() => createChain({ insert: insertMock }));

    const payload = { key: 'value', nested: { num: 42 } };
    await AuditLogger.log({ eventType: 'WITH_PAYLOAD', payload });

    expect(insertMock).toHaveBeenCalledWith(expect.objectContaining({ payload }));
  });
});

describe('ProtocolLocker', () => {
  describe('lock', () => {
    it('acquires lock on unlocked protocol', async () => {
      const singleMock = vi.fn().mockResolvedValue({
        data: { is_locked: false, locked_by: null },
        error: null,
      });
      const updateMock = vi.fn(() => createChain());
      mockFrom.mockImplementation((table: string) => {
        if (table === 'protocols') return createChain({ single: singleMock, update: updateMock });
        return createChain();
      });

      await ProtocolLocker.lock('protocol-1', 'agr-1');

      expect(updateMock).toHaveBeenCalledWith(
        expect.objectContaining({ is_locked: true, locked_by: 'agr-1' }),
      );
    });

    it('throws if already locked by another AGR', async () => {
      const singleMock = vi.fn().mockResolvedValue({
        data: { is_locked: true, locked_by: 'other-agr' },
        error: null,
      });
      mockFrom.mockImplementation((table: string) => {
        if (table === 'protocols') return createChain({ single: singleMock });
        return createChain();
      });

      await expect(ProtocolLocker.lock('protocol-1', 'agr-1')).rejects.toThrow('Protocolo bloqueado por outro AGR');
    });

    it('allows re-entrant lock by same AGR', async () => {
      const singleMock = vi.fn().mockResolvedValue({
        data: { is_locked: true, locked_by: 'agr-1' },
        error: null,
      });
      const updateMock = vi.fn(() => createChain());
      mockFrom.mockImplementation((table: string) => {
        if (table === 'protocols') return createChain({ single: singleMock, update: updateMock });
        return createChain();
      });

      await ProtocolLocker.lock('protocol-1', 'agr-1');

      expect(updateMock).toHaveBeenCalled();
    });

    it('logs audit event on successful lock', async () => {
      const singleMock = vi.fn().mockResolvedValue({
        data: { is_locked: false, locked_by: null },
        error: null,
      });
      mockFrom.mockImplementation((table: string) => {
        if (table === 'protocols') return createChain({ single: singleMock });
        return createChain();
      });

      await ProtocolLocker.lock('protocol-1', 'agr-1');

      expect(mockFrom).toHaveBeenCalledWith('audit_logs');
    });
  });

  describe('unlock', () => {
    it('releases the lock', async () => {
      const updateMock = vi.fn(() => createChain());
      mockFrom.mockImplementation((table: string) => {
        if (table === 'protocols') return createChain({ update: updateMock });
        return createChain();
      });

      await ProtocolLocker.unlock('protocol-1', 'agr-1');

      expect(updateMock).toHaveBeenCalledWith(
        expect.objectContaining({ is_locked: false, locked_by: null, locked_at: null }),
      );
    });

    it('logs audit event on successful unlock', async () => {
      mockFrom.mockImplementation(() => createChain());

      await ProtocolLocker.unlock('protocol-1', 'agr-1');

      expect(mockFrom).toHaveBeenCalledWith('audit_logs');
    });

    it('does not throw if the wrong AGR tries to unlock', async () => {
      mockFrom.mockImplementation(() => createChain());

      await expect(ProtocolLocker.unlock('protocol-1', 'wrong-agr')).resolves.toBeUndefined();
    });
  });
});
