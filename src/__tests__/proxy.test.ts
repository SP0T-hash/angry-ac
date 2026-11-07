import { beforeEach, expect, it, vi } from 'vitest';
import { NextRequest } from 'next/server';
const mocks = vi.hoisted(() => ({ validate: vi.fn() }));
vi.mock('@/lib/ac-angry/security', () => ({ SessionManager: { validatePageJWT: mocks.validate } }));
import { proxy } from '../proxy';
beforeEach(() => vi.resetAllMocks());
const request = (path: string, cookie = true) => new NextRequest(`https://test.invalid${path}`, { headers: cookie ? { cookie: 'ac_angry_session=fixture-jwt' } : {} });
it.each(['/ac/admin', '/ac/admin/users'])('requires database ADMIN permission for %s', async (path) => {
  mocks.validate.mockResolvedValue({ agrId: 'admin' });
  expect((await proxy(request(path))).status).toBe(200);
  expect(mocks.validate).toHaveBeenCalledWith('fixture-jwt', 'ADMIN');
});
it('validates persisted session for agent pages', async () => {
  mocks.validate.mockResolvedValue({ agrId: 'agent' });
  expect((await proxy(request('/ac/agent/dashboard'))).status).toBe(200);
  expect(mocks.validate).toHaveBeenCalledWith('fixture-jwt', undefined);
});
it('redirects denied or unavailable sessions to login', async () => {
  mocks.validate.mockRejectedValue(new Error('unavailable'));
  const response = await proxy(request('/ac/admin'));
  expect(response.status).toBe(307);
  expect(response.headers.get('location')).toBe('https://test.invalid/auth/login');
});
it('does not query the database for missing credentials', async () => {
  expect((await proxy(request('/ac/admin', false))).status).toBe(307);
  expect(mocks.validate).not.toHaveBeenCalled();
});
