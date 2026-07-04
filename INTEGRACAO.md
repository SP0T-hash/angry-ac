# AC ANGRY — Guia de Integração dos Módulos de Segurança 🛡️

## 1. Execute o Schema no Supabase

1. Acesse: https://supabase.com/dashboard → SQL Editor → New Query
2. Cole o conteúdo de `SUPABASE_SCHEMA.sql` e clique em **Run**
3. Verifique no **Table Editor** que as tabelas apareceram:
   - `agr_users`, `protocols`, `security_nonces`, `secure_sessions`, `audit_logs`, `rate_limit_buckets`, `leads`

---

## 2. Adicione as variáveis ao `.env.local`

```env
# Já existentes:
NEXT_PUBLIC_SUPABASE_URL=https://SEU_PROJETO.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...

# NOVOS (obrigatórios para os módulos de segurança):
SUPABASE_SERVICE_ROLE_KEY=eyJ...  # Dashboard → Settings → API → service_role
PKI_NONCE_SECRET=gere_com_openssl_rand_hex_64
AUTH_JWT_SECRET=gere_com_openssl_rand_hex_64
```

> Para gerar os secrets: `openssl rand -hex 64`

---

## 3. Copie os arquivos para o projeto

```
src/lib/ac-angry/
  ├── security.ts          ← NonceManager, SessionManager, RateLimiter, AuditLogger, ProtocolLocker
  └── api-middleware.ts    ← withAuth() HOF para proteger rotas
```

---

## 4. Como usar nas rotas de API

### Exemplo: Rota de emissão protegida

```typescript
// src/app/api/ac/emit/route.ts
import { withAuth } from '@/lib/ac-angry/api-middleware';
import { NonceManager, AuditLogger } from '@/lib/ac-angry/security';
import { NextRequest, NextResponse } from 'next/server';

export const POST = withAuth(async (req, { session, ip }) => {
  const body = await req.json();
  const { protocolId, nonce } = body;

  // Validar nonce one-time para emissão
  await NonceManager.consume(nonce, 'EMIT');

  // ... lógica de emissão ...

  await AuditLogger.log({
    eventType: 'CERT_ISSUED',
    agrId: session.agrId,
    protocolId,
    ipAddress: ip,
    severity: 'INFO',
  });

  return NextResponse.json({ success: true });
}, { rateLimit: 'EMIT' });
```

### Exemplo: Gerar nonce no frontend

```typescript
// Dentro de uma Server Action ou API route
import { NonceManager } from '@/lib/ac-angry/security';

const nonce = await NonceManager.generate('EMIT', protocolId, agr.id);
// Enviar o nonce para o frontend via response
// O frontend inclui o nonce na próxima requisição
```

---

## 5. Fluxo de Segurança Completo

```
AGR faz login (cert A3 / cloud)
    ↓
API valida certificado → cria sessão (SessionManager.create)
    ↓
Frontend armazena session_token (memory/cookie httpOnly)
    ↓
Cada request → withAuth() valida token + rate limit
    ↓
Ações críticas (SIGN, EMIT) → NonceManager.generate + consume
    ↓
Tudo logado em audit_logs automaticamente
```

---

## 6. Checklist de Produção

- [ ] `SUPABASE_SERVICE_ROLE_KEY` configurada (nunca expor no cliente!)
- [ ] `PKI_NONCE_SECRET` gerado com 64 bytes aleatórios
- [ ] Schema SQL executado com sucesso
- [ ] Testar: `POST /api/auth/login` retorna session_token
- [ ] Testar: `POST /api/ac/emit` sem token retorna 401
- [ ] Testar: 6+ logins falhos bloqueiam por 5min (rate limit)
- [ ] Verificar tabela `audit_logs` populando após ações

---

**Próximos módulos a implementar:**
1. `biometry.ts` — FaceAPI.js + liveness detection
2. `pkcs12.ts` — Geração de certificado PFX/P12
3. `chrome-extension/` — Manifest V3 para WebPKI
