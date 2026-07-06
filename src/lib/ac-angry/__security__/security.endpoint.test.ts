/**
 * security.endpoint.test.ts
 *
 * Testes de penetração contra ENDPOINTS HTTP reais.
 * Requer que o servidor Next.js esteja rodando (local, staging ou produção).
 *
 * Uso:
 *   TARGET_URL=http://localhost:3000 npx vitest run --config vitest.security.config.ts
 *
 * Pulam automaticamente se o servidor não estiver acessível.
 */

import { describe, it, expect, beforeAll } from 'vitest';

const TARGET = process.env.TARGET_URL || 'http://localhost:3000';
const AGR_TOKEN = process.env.AGR_TOKEN || '';

// ─────────────────────────────────────────────────────────────────────────────
// Health check — pula todos os testes se servidor não estiver rodando
// ─────────────────────────────────────────────────────────────────────────────

let serverAvailable = false;

beforeAll(async () => {
  try {
    const response = await fetch(TARGET, {
      signal: AbortSignal.timeout(5000),
      redirect: 'manual',
    });
    serverAvailable = response.status !== 0;
  } catch {
    console.warn(`⚠️  Servidor não disponível em ${TARGET}. Pulando testes de endpoint.`);
    serverAvailable = false;
  }
}, 10000);

function describeIf(condition: boolean) {
  return condition ? describe : describe.skip;
}

const itWhenServer = serverAvailable ? it : it.skip;

// ─────────────────────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────────────────────

async function fetchEndpoint(path: string, options: RequestInit = {}): Promise<Response> {
  const url = `${TARGET}${path}`;
  const response = await fetch(url, {
    redirect: 'manual',
    ...options,
    headers: {
      'User-Agent': 'AR-Pentest/1.0',
      ...(options.headers || {}),
    },
    signal: AbortSignal.timeout(10000),
  });
  return response;
}

function skipIfNoToken() {
  if (!AGR_TOKEN) {
    console.warn('⚠️  AGR_TOKEN não configurado. Pulando testes autenticados.');
    return true;
  }
  return false;
}

// ─────────────────────────────────────────────────────────────────────────────
// Testes — todos pulados se server não disponível
// ─────────────────────────────────────────────────────────────────────────────

describeIf(serverAvailable)('🛡️ Pen Test: Security Headers', () => {
  let response: Response;

  beforeAll(async () => {
    response = await fetchEndpoint('/');
  }, 15000);

  it('deve ter Content-Security-Policy', () => {
    const csp = response.headers.get('content-security-policy');
    expect(csp).toBeTruthy();
    if (csp) console.log(`   CSP: ${csp.slice(0, 80)}...`);
  });

  it('deve ter Strict-Transport-Security (HSTS)', () => {
    const hsts = response.headers.get('strict-transport-security');
    expect(hsts).toBeTruthy();
    if (hsts) {
      expect(hsts).toContain('max-age=');
      expect(hsts).toContain('includeSubDomains');
    }
  });

  it('deve ter X-Frame-Options (DENY ou SAMEORIGIN)', () => {
    const xfo = response.headers.get('x-frame-options');
    expect(xfo).toBeTruthy();
    expect(['DENY', 'SAMEORIGIN']).toContain(xfo);
  });

  it('deve ter X-Content-Type-Options: nosniff', () => {
    expect(response.headers.get('x-content-type-options')).toBe('nosniff');
  });

  it('deve ter Referrer-Policy', () => {
    expect(response.headers.get('referrer-policy')).toBeTruthy();
  });

  it('não deve expor versão detalhada no header Server', () => {
    const server = response.headers.get('server');
    if (server) {
      expect(server).not.toMatch(/\d+\.\d+\.\d+/);
    }
  });
});

describeIf(serverAvailable)('🛡️ Pen Test: CORS Configuration', () => {
  it('não deve permitir origem não autorizada', async () => {
    const response = await fetchEndpoint('/', {
      headers: {
        Origin: 'https://evil.com',
        'Access-Control-Request-Method': 'GET',
      },
    });
    const acao = response.headers.get('access-control-allow-origin');
    if (acao) {
      expect(acao).not.toBe('*');
      expect(acao).not.toContain('evil.com');
    }
  });
});

describeIf(serverAvailable)('🛡️ Pen Test: SQL Injection', () => {
  const sqliPayloads = [
    "' OR '1'='1",
    "'; DROP TABLE protocols; --",
    "' UNION SELECT * FROM agr_users --",
    "' OR 1=1 --",
    "admin'--",
    "' WAITFOR DELAY '0:0:5'--",
  ];

  sqliPayloads.forEach((payload) => {
    it(`deve rejeitar SQLi: ${payload.slice(0, 25)}`, async () => {
      const response = await fetchEndpoint(
        `/api/cpf?cpf=${encodeURIComponent(payload)}`
      );
      expect([400, 401, 403, 404, 422]).toContain(response.status);
    });
  });
});

describeIf(serverAvailable)('🛡️ Pen Test: XSS', () => {
  const xssPayloads = [
    '<script>alert(1)</script>',
    '<img src=x onerror=alert(1)>',
    '"><script>alert(1)</script>',
    '<svg onload=alert(1)>',
  ];

  xssPayloads.forEach((payload) => {
    it(`deve rejeitar XSS: ${payload.slice(0, 25)}`, async () => {
      const response = await fetchEndpoint(
        `/api/cpf?cpf=${encodeURIComponent(payload)}`
      );
      const text = await response.text();
      expect(text).not.toContain('<script>alert');
    });
  });
});

describeIf(serverAvailable)('🛡️ Pen Test: Information Disclosure', () => {
  it('não deve expor .env ou arquivos de configuração', async () => {
    const sensitivePaths = [
      '/.env', '/.env.local', '/.git/config',
      '/package.json', '/tsconfig.json',
    ];
    for (const path of sensitivePaths) {
      const response = await fetchEndpoint(path);
      expect(response.status).toBe(404);
    }
  });
});

describeIf(serverAvailable)('🛡️ Pen Test: Rate Limiting', () => {
  it('deve bloquear após múltiplas requisições rápidas', async () => {
    const requests = Array(10).fill(null).map(() =>
      fetchEndpoint('/api/auth/pki', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type: 'TEST' }),
      })
    );
    const responses = await Promise.all(requests);
    const statuses = responses.map(r => r.status);
    const allOk = statuses.every(s => s === 200);
    expect(allOk).toBe(false); // ao menos uma deve falhar por rate limit
  });
});

describeIf(serverAvailable)('🛡️ Pen Test: Content-Type Validation', () => {
  it('deve rejeitar JSON malformado', async () => {
    const response = await fetchEndpoint('/api/auth/pki', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: '{ malformed json',
    });
    expect(response.status).toBe(400);
  });
});
