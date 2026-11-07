import { afterEach, beforeEach, expect, it, vi } from 'vitest';
import { NextRequest } from 'next/server';
const mocks = vi.hoisted(() => ({ admin: vi.fn(), audit: vi.fn(), fetch: vi.fn() }));
vi.mock('@/lib/ac-angry/api-middleware', () => ({ withAuth: (handler: (req: NextRequest, context: { session: { agrId: string }; ip: string }) => Promise<Response>) => (req: NextRequest) => handler(req, { session: { agrId: 'own-agr' }, ip: '127.0.0.1' }) }));
vi.mock('@/lib/infra/supabase/client', () => ({ getSupabaseAdmin: mocks.admin }));
vi.mock('@/lib/ac-angry/security', () => ({ AuditLogger: { log: mocks.audit }, NonceManager: { validate: vi.fn() } }));
import { POST as update } from '../../protocol/update/route';
import { POST as audit } from '../audit/route';
import { GET as list } from '../route';
import { POST as biometric } from '../../psbio/route';
import { POST as sign } from '../../ac/sign/route';
const request = (body: unknown) => new NextRequest('https://test.invalid/api', { method: 'POST', body: JSON.stringify(body) });
beforeEach(() => vi.resetAllMocks());
afterEach(() => { vi.unstubAllEnvs(); vi.unstubAllGlobals(); });
it.each(['status', 'agr_id', 'holder_cpf', 'approved'])('rejects generic modification of %s', async (field) => {
  expect((await update(request({ id: 'protocol', updates: { [field]: 'forged' } }))).status).toBe(400);
  expect(mocks.admin).not.toHaveBeenCalled();
});
it('binds contact updates to authenticated AGR and hides foreign protocols', async () => {
  const query = { update: vi.fn().mockReturnThis(), eq: vi.fn().mockReturnThis(), select: vi.fn().mockReturnThis(), maybeSingle: vi.fn().mockResolvedValue({ data: null, error: null }) };
  mocks.admin.mockResolvedValue({ from: () => query });
  expect((await update(request({ id: 'foreign', updates: { holder_email: 'test@example.invalid' } }))).status).toBe(404);
  expect(query.eq).toHaveBeenCalledWith('agr_id', 'own-agr');
  expect(mocks.audit).not.toHaveBeenCalled();
});
it('scopes listing to authenticated AGR', async () => {
  const query = { select: vi.fn().mockReturnThis(), eq: vi.fn().mockReturnThis(), order: vi.fn().mockResolvedValue({ data: [], error: null }) };
  mocks.admin.mockResolvedValue({ from: () => query });
  expect((await list(request({}))).status).toBe(200);
  expect(query.eq).toHaveBeenCalledWith('agr_id', 'own-agr');
});
it('does not accept forged authoritative audit events', async () => {
  expect((await audit(request({ protocol_id: 'protocol', action: 'AUTH_SUCCESS' }))).status).toBe(400);
  expect(mocks.admin).not.toHaveBeenCalled();
});
it('does not audit foreign protocols', async () => {
  const query = { select: vi.fn().mockReturnThis(), eq: vi.fn().mockReturnThis(), maybeSingle: vi.fn().mockResolvedValue({ data: null, error: null }) };
  const from = vi.fn().mockReturnValue(query);
  mocks.admin.mockResolvedValue({ from });
  expect((await audit(request({ protocol_id: 'foreign', action: 'UI_PROTOCOL_VIEWED' }))).status).toBe(404);
  expect(query.eq).toHaveBeenCalledWith('agr_id', 'own-agr');
  expect(from).toHaveBeenCalledTimes(1);
});
it('blocks simulated biometrics and CA issuance in production', async () => {
  vi.stubEnv('NODE_ENV', 'production');
  vi.stubEnv('IDWALL_API_KEY', '');
  vi.stubGlobal('fetch', mocks.fetch);
  expect((await biometric(request({ cpf: '00000000000', selfieBase64: 'dummy' }))).status).toBe(503);
  expect((await sign(request({}))).status).toBe(503);
  expect(mocks.fetch).not.toHaveBeenCalled();
  expect(mocks.audit).not.toHaveBeenCalled();
});
