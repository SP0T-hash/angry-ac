import { beforeEach, expect, it, vi } from 'vitest';
const mocks = vi.hoisted(() => ({ validate: vi.fn(), cookies: vi.fn(), redirect: vi.fn(() => { throw new Error('REDIRECT'); }) }));
vi.mock('@/lib/ac-angry/security', () => ({ SessionManager: { validatePageJWT: mocks.validate } }));
vi.mock('next/headers', () => ({ cookies: mocks.cookies }));
vi.mock('next/navigation', () => ({ redirect: mocks.redirect }));
import Page from '../page';
beforeEach(() => { vi.resetAllMocks(); mocks.redirect.mockImplementation(() => { throw new Error('REDIRECT'); }); mocks.cookies.mockResolvedValue({ get: () => ({ value: 'fixture-jwt' }) }); });
it('checks ADMIN on the server page independently of proxy execution', async () => {
  mocks.validate.mockResolvedValue({ agrId: 'admin' });
  expect(await Page()).toBeTruthy();
  expect(mocks.validate).toHaveBeenCalledWith('fixture-jwt', 'ADMIN');
});
it('redirects a denied account before rendering the admin portal', async () => {
  mocks.validate.mockRejectedValue(new Error('forbidden'));
  await expect(Page()).rejects.toThrow('REDIRECT');
  expect(mocks.redirect).toHaveBeenCalledWith('/auth/login');
});
it('redirects missing cookies before database access', async () => {
  mocks.cookies.mockResolvedValue({ get: () => undefined });
  await expect(Page()).rejects.toThrow('REDIRECT');
  expect(mocks.validate).not.toHaveBeenCalled();
});
