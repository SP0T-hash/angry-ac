import { beforeEach, expect, it, vi } from 'vitest';
import { NextRequest } from 'next/server';
const mocks = vi.hoisted(() => ({ session: vi.fn(), admin: vi.fn() }));
vi.mock('@/lib/gs/session', () => ({ getGSSession: mocks.session }));
vi.mock('@/lib/infra/supabase/client', () => ({ getSupabaseAdmin: mocks.admin }));
import { POST, DELETE } from '../route';
beforeEach(() => vi.resetAllMocks());
const request = () => new NextRequest('https://test.invalid/api/gs/mutate', { method: 'POST', body: JSON.stringify({ tabela: 'gs_clientes', id: 'other-ar-client', data: { ar_id: 'other-ar' } }) });
it.each(['AC_SUPORTE', 'AR_ADMIN', 'AR_FINANCEIRO', 'AR_SUPORTE', 'UNIDADE_ADMIN', 'UNIDADE_AGR', 'UNIDADE_VENDAS', 'CONTADOR'])('denies %s cross-organization mutations before service-role access', async (nivel) => {
  mocks.session.mockResolvedValue({ usuario: { nivel, ativo: true, ar_id: 'own-ar' } });
  expect((await POST(request())).status).toBe(403);
  expect((await DELETE(request())).status).toBe(403);
  expect(mocks.admin).not.toHaveBeenCalled();
});
it('rejects unauthenticated callers', async () => {
  mocks.session.mockResolvedValue(null);
  expect((await POST(request())).status).toBe(401);
  expect((await DELETE(request())).status).toBe(401);
  expect(mocks.admin).not.toHaveBeenCalled();
});
it('rejects inactive administrators', async () => {
  mocks.session.mockResolvedValue({ usuario: { nivel: 'AC_ADMIN', ativo: false } });
  expect((await POST(request())).status).toBe(403);
  expect((await DELETE(request())).status).toBe(403);
  expect(mocks.admin).not.toHaveBeenCalled();
});
it('preserves the active AC administrator update', async () => {
  mocks.session.mockResolvedValue({ usuario: { nivel: 'AC_ADMIN', ativo: true } });
  const eq = vi.fn().mockResolvedValue({ error: null });
  const update = vi.fn().mockReturnValue({ eq });
  mocks.admin.mockResolvedValue({ from: () => ({ update }) });
  expect((await POST(request())).status).toBe(200);
  expect(eq).toHaveBeenCalledWith('id', 'other-ar-client');
});
