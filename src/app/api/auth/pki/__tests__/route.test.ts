import { afterEach, expect, it, vi } from 'vitest';
import { NextRequest } from 'next/server';
const mocks = vi.hoisted(() => ({ admin: vi.fn(), nonce: vi.fn(), rate: vi.fn(), session: vi.fn() }));
vi.mock('@/lib/infra/supabase/client', () => ({ getSupabaseAdmin: mocks.admin }));
vi.mock('@/lib/ac-angry/security', () => ({ NonceManager: { generate: mocks.nonce, consume: vi.fn() }, RateLimiter: { check: mocks.rate }, SessionManager: { create: mocks.session }, AuditLogger: { log: vi.fn() } }));
vi.mock('crypto', async (importOriginal) => ({
  ...await importOriginal<typeof import('crypto')>(),
  X509Certificate: class {
    serialNumber = 'fixture'; subject = 'fixture'; issuer = 'ICP-Brasil';
    validFrom = '2020-01-01'; validTo = '2099-01-01'; publicKey = 'fixture';
  },
  createVerify: () => ({ update: vi.fn(), verify: () => true }),
}));
import { GET, POST } from '../route';
afterEach(() => { vi.unstubAllEnvs(); vi.clearAllMocks(); });
it('blocks production PKI before nonce, certificate parsing or session creation', async () => {
  vi.stubEnv('NODE_ENV', 'production');
  expect((await GET()).status).toBe(503);
  expect((await POST(new NextRequest('https://test.invalid/api/auth/pki', { method: 'POST', body: 'invalid' }))).status).toBe(503);
  for (const mock of Object.values(mocks)) expect(mock).not.toHaveBeenCalled();
});

it.each(['query-error', 'exception'])('denies login when revocation lookup fails: %s', async (failure) => {
  vi.stubEnv('NODE_ENV', 'test');
  const query = { select: vi.fn().mockReturnThis(), eq: vi.fn().mockReturnThis(), single: vi.fn().mockResolvedValue({ data: { id: 'agr', is_active: true } }), maybeSingle: failure === 'exception' ? vi.fn().mockRejectedValue(new Error('unavailable')) : vi.fn().mockResolvedValue({ data: null, error: { message: 'unavailable' } }) };
  mocks.admin.mockResolvedValue({ from: () => query });
  const response = await POST(new NextRequest('https://test.invalid/api/auth/pki', { method: 'POST', body: JSON.stringify({ signature: 'YWJj', certificatePem: 'fixture', nonce: 'dummy.signature' }) }));
  expect(response.status).toBe(503);
  expect(mocks.session).not.toHaveBeenCalled();
});
