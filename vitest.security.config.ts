import { defineConfig } from 'vitest/config';

/**
 * Configuração específica para testes de segurança (penetration test).
 *
 * Uso:
 *   TARGET_URL=https://staging.vemapi.com.br npx vitest run --config vitest.security.config.ts
 *
 * Variáveis de ambiente:
 *   TARGET_URL   — URL base do alvo (ex: https://staging.vemapi.com.br)
 *   AGR_TOKEN    — Token JWT para testes autenticados (opcional)
 */
export default defineConfig({
  test: {
    name: 'security',
    include: ['src/lib/ac-angry/__security__/**/*.test.ts'],
    environment: 'node',
    testTimeout: 30_000,
    hookTimeout: 30_000,
    reporters: ['verbose', 'json'],
    outputFile: {
      json: './security-report/results.json',
    },
    env: {
      // Valores mock para testes modulares (sem dependência externa)
      NEXT_PUBLIC_SUPABASE_URL: 'https://mock.supabase.co',
      SUPABASE_SERVICE_ROLE_KEY: 'mock-service-role-key',
      PKI_NONCE_SECRET: 'a'.repeat(128),
      AUTH_JWT_SECRET: 'b'.repeat(128),
    },
  },
});
