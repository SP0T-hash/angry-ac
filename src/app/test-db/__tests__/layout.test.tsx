import { afterEach, expect, it, vi } from 'vitest';
const mocks = vi.hoisted(() => ({ notFound: vi.fn(() => { throw new Error('NOT_FOUND'); }) }));
vi.mock('next/navigation', () => ({ notFound: mocks.notFound }));
vi.mock('../../(landing)/layout', () => ({ default: () => null }));
import Layout from '../layout';
afterEach(() => { vi.unstubAllEnvs(); vi.clearAllMocks(); });
it('keeps database diagnostics unavailable in production', () => {
  vi.stubEnv('NODE_ENV', 'production');
  expect(() => Layout({ children: null })).toThrow('NOT_FOUND');
  expect(mocks.notFound).toHaveBeenCalledOnce();
});
