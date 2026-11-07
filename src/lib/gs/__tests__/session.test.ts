import { beforeEach, describe, expect, it, vi } from 'vitest';
const mocks = vi.hoisted(() => ({ admin: vi.fn(), cookies: vi.fn(), compare: vi.fn() }));
vi.mock('@/lib/infra/supabase/client', () => ({ getSupabaseAdmin: mocks.admin }));
vi.mock('next/headers', () => ({ cookies: mocks.cookies }));
vi.mock('bcryptjs', () => ({ compareSync: mocks.compare }));
import { getGSSession, gsLogin } from '../session';

describe('GS session boundaries', () => {
  beforeEach(() => { vi.resetAllMocks(); mocks.cookies.mockResolvedValue({ get: () => ({ value: 'test-token' }) }); });
  it.each([false, null, undefined])('rejects revoked or unknown session status %s', async (active) => {
    const query = { select: vi.fn().mockReturnThis(), eq: vi.fn().mockReturnThis(), gte: vi.fn().mockReturnThis(), maybeSingle: vi.fn().mockResolvedValue({ data: { is_active: active, usuario: { is_active: true } }, error: null }) };
    mocks.admin.mockResolvedValue({ from: () => query });
    expect(await getGSSession()).toBeNull();
  });
  it.each([true, false])('requires active user even with active session (user %s)', async (active) => {
    const query = { select: vi.fn().mockReturnThis(), eq: vi.fn().mockReturnThis(), gte: vi.fn().mockReturnThis(), maybeSingle: vi.fn().mockResolvedValue({ data: { is_active: true, usuario: { id: 'user', is_active: active }, expires_at: 'future' }, error: null }) };
    mocks.admin.mockResolvedValue({ from: () => query });
    expect(Boolean(await getGSSession())).toBe(active);
  });
  it.each([null, { message: 'database unavailable' }])('returns login only after session persistence: %j', async (error) => {
    const query = { select: vi.fn().mockReturnThis(), eq: vi.fn().mockReturnThis(), maybeSingle: vi.fn().mockResolvedValue({ data: { id: 'user', password_hash: '$2-test', is_active: true }, error: null }) };
    const insert = vi.fn().mockResolvedValue({ error });
    mocks.admin.mockResolvedValue({ from: (table: string) => table === 'gs_usuarios' ? query : { insert } });
    mocks.compare.mockReturnValue(true);
    expect(Boolean(await gsLogin('test@example.invalid', 'dummy'))).toBe(!error);
    expect(insert).toHaveBeenCalledOnce();
  });
});
