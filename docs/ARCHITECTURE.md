# Arquitetura — VEMAPI SITE (CoreAr / AC ANGRY / GS)

> Documento vivo. Gerado após a auditoria de segurança (ver `docs/SECURITY-FINDINGS.md`).
> Stack real implementada: **Next.js 16 (App Router) + React 19 + TypeScript + Tailwind + Supabase (Postgres) + Tremor + Framer Motion**.

---

## 1. Visão Geral

Plataforma de certificação digital ICP-Brasil composta por três domínios que coabitam
no mesmo app Next.js:

| Domínio | Prefixo de rota | Propósito | Segurança |
|---|---|---|---|
| **Landing** | `/` (`(landing)`) | Marketing público | Nenhuma auth |
| **AC ANGRY** | `/ac/*`, `/auth/*` (`(angry)`) | Emissão de certificados A1/A3, biometria, auditoria | JWT A3 (hardware) + middleware + `withAuth` |
| **Portal** | `/portal/*` (`(portal)`) | Área do cliente final | Auth própria |
| **GS (CoreAr)** | `/gs/*`, `/api/gs/*` | ERP de ARs: clientes, pedidos, financeiro, agenda | Sessão GS (cookie) + `mutate` endurecido |

Backend = **Route Handlers** do Next (`src/app/api/**`). Não há serviço .NET separado
no código atual; a integração com ACs externas (Soluti/Vidaas, Syngular, BirdID) é
feita por HTTPS a partir dos Route Handlers.

### Diagrama de alto nível

```
                 ┌─────────────────────────────────────────────┐
                 │              Next.js 16 (Node)               │
                 │                                              │
   Browser ──────┤  (landing)  (angry)  (portal)   gs           │
                 │      │          │          │        │       │
                 │      │     middleware.ts (Edge JWT)        │
                 │      │          │          │        │       │
                 │      ├─ withAuth HOF ─┐      │  getGSSession  │
                 │      │                ▼      │        │       │
                 │      └─ /api/ac/* , /api/protocols/*          │
                 │                     /api/psbio /api/saf ...   │
                 │                               /api/gs/mutate  │
                 └───────────────┬──────────────┬───────────────┘
                                 │              │
                      Service Role│              │ Anon/Service
                                 ▼              ▼
                        ┌──────────────────────────────┐
                        │   Supabase (Postgres + Auth)   │
                        │  RLS ON · tabelas AC + GS      │
                        │  audit_logs (hash-chain)       │
                        │  gs_audit_logs (ERP)            │
                        └──────────────────────────────┘
                                 ▲
                                 │ HTTPS (provedores PSC/AC)
                        ┌────────┴────────┐
                        │ Soluti/Vidaas   │
                        │ Syngular/BirdID │
                        └─────────────────┘
```

---

## 2. Camadas e responsabilidades

### 2.1 Apresentação (`src/app`, `src/components`)
- **`(landry)`** grupo de rota → landing page (Tremor/Charts). *Locked* pela constituição.
- **`(angry)`** → `auth/login` (login A3 WebPKI), `ac/admin` (KPIs + auditoria), `ac/agent/dashboard`.
- **`(portal)`** → portal do cliente.
- **`gs`** → `dashboard`, `ars`, `unidades`, `pontos`, `clientes`, `pedidos`, `financeiro/*`, `tickets`.
  - Observação: `gs` **não** é um route group (`(gs)`), logo `src/app/gs/layout.tsx` não
    deve render `<html>/<body>` (corrigido — hidratação inválida resolvida).

### 2.2 API / Backend (`src/app/api`)
- **AC ANGRY**: `auth/pki` (desafio+validação A3), `ac/sign`, `ac/persist-certificate`,
  `protocol/update`, `protocols`, `protocols/audit`, `psbio`, `saf`, `video`, `cpf`, `cnpj`.
- **GS**: `gs/auth/login`, `gs/auth/logout`, `gs/mutate` (genérico, endurecido).

### 2.3 Domínio / Segurança (`src/lib`)
- `lib/ac-angry/security.ts` — NonceManager, SessionManager, RateLimiter, AuditLogger,
  ProtocolLocker, verificação de cadeia ICP-Brasil.
- `lib/ac-angry/api-middleware.ts` — `withAuth` (cookie+Bearer, CSRF, `requireRole`, IP).
- `lib/ac-angry/pki.ts`, `psc-auth.ts`, `soluti-vidaas.ts`, `video-conference-engine.ts`.
- `lib/gs/session.ts`, `lib/gs/data.ts`, `lib/gs/types.ts`.
- `lib/infra/supabase/client.ts` — **única** fonte de clientes Supabase (anon/server/admin).
  Regra de fronteira: sem mock silencioso; erro explícito se faltar env.

### 2.4 Dados (Supabase Postgres)
- AC ANGRY: `agr_users`, `protocols`, `security_nonces`, `secure_sessions`, `audit_logs`,
  `rate_limit_buckets`, `leads`, `certificates`, `fraud_blacklist`.
- GS: `gs_ars`, `gs_unidades`, `gs_pontos_atendimento`, `gs_usuarios`, `gs_clientes`,
  `gs_pedidos`, `gs_faturas`, `gs_cobrancas`, `gs_assinaturas`, `gs_planos`, `gs_taxas`,
  `gs_comissoes`, `gs_notas_fiscais`, `gs_agenda`, `gs_tickets`, `gs_sessoes`,
  `gs_audit_logs` (nova), `gs_permissoes` (RBAC granular, ainda a plugar).

**RLS**: todas as tabelas têm RLS `ENABLED`. O cliente **anon** só enxerga `leads`
(insert público). Todo acesso real usa **service_role** (server-only), que bypassa RLS —
por isso a autorização deve ser feita no app (middleware + `withAuth` + `mutate`), nunca
confiando só em RLS.

---

## 3. Modelo de segurança (pós-auditoria)

| Controle | Onde | Estado |
|---|---|---|
| Guarda de rota de página | `src/middleware.ts` (Edge, Web Crypto) | ✅ ativo (era `proxy.ts` inativo) |
| Proteção de rota admin | `middleware` + `requireRole` | ✅ `/ac/admin` exige `ADMIN` |
| Auth de API | `withAuth` (cookie `ac_angry_session` OU Bearer) | ✅ corrigido 401 |
| CSRF | `withAuth` checa `Origin` em mutações | ✅ |
| RBAC | `requireRole` + `gs/mutate` policy | ✅ |
| Anti-replay | `NonceManager` (one-time, TTL) | ✅ |
| Rate limit | `RateLimiter` (DB) por IP | ✅ (usar `req.ip` confiável) |
| Auditoria AC | `audit_logs` (hash-chain) | ✅ |
| Auditoria GS | `gs_audit_logs` | ✅ (nova) |
| PKI A3 | assinatura + **pinning** de chave + cadeia ICP-Brasil | ✅ pinning; ⚠️ cadeia exige `ICP_BRASIL_ROOTS_PEM` |
| SAF antifraude | `ProtocolViewer` + `/api/saf` | ✅ fail-CLOSED |

### Fluxo de login A3 (crítico)
1. `GET /api/auth/pki` → nonce (desafio) persistido.
2. Cliente assina o nonce com o token A3 (WebPKI).
3. `POST /api/auth/pki` → valida assinatura, **serial**, **self-signed**, **pinning**
   (`cert_public_key_hash`), e **cadeia** (se roots configuradas). Cria sessão +
   JWT no cookie `ac_angry_session` (httpOnly, secure em prod, sameSite=lax).
4. Middleware valida o JWT (Web Crypto) em `/ac/*`.

---

## 4. Ambiente de DESENVOLVIMENTO

### 4.1 Requisitos
- Node.js ≥ 22 (gerenciado via `nvm`; o projeto usa `npm install --legacy-peer-deps`
  por causa do `@tremor/react` vs React 19).
- Conta Supabase (projeto já linkado: **VEMAPI** `lzmylpfdmgspleezgynz`).
- Supabase CLI (`supabase` global) — opcional p/ migrações locais.

### 4.2 Variáveis (`.env.local`)
- `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`.
- `AUTH_JWT_SECRET`, `PKI_NONCE_SECRET`, `PKI_ENCRYPTION_KEY` (64 bytes hex cada).
- `NEXT_PUBLIC_APP_URL=http://localhost:3001` (usado no CSRF Origin-check).
- `AR_SCANNER_TYPE=MOCK`, provedores PSC vazios (dev).
- `ICP_BRASIL_ROOTS_PEM` / `ICP_BRASIL_ROOTS_PATH` → **vazio em dev** (PKI roda em modo
  degradado: pinning + checagens estruturais; alerta CRITICAL por login).

### 4.3 Comandos
```bash
nvm use 22
npm install --legacy-peer-deps
npm run dev          # http://localhost:3001
npm test             # vitest (41 testes em src/lib/ac-angry)
npx tsc --noEmit     # type-check
npm run build        # produção local
```

### 4.4 Banco
- Use o projeto Supabase cloud linkado (`supabase link --project-ref lzmylpfdmgspleezgynz`).
- Execute `SUPABASE_SCHEMA*.sql` + `SUPABASE_MIGRATION_SECURITY.sql` no SQL Editor.
- Em dev, o RLS é bypassado pelo service_role; não dependa dele para testar auth.

---

## 5. Ambiente de PRODUÇÃO

### 5.1 Hospedagem
- **Vercel** (recomendado p/ Next.js) ou container Node. `npm run build && npm start`
  (porta `3000`).
- Middleware roda no **Edge** da Vercel → por isso `src/middleware.ts` USA Web Crypto
  (sem `node:crypto`). ✅

### 5.2 Variáveis (` .env.production`)
- Idem dev, porém:
  - `ICP_BRASIL_ROOTS_PEM` **OBRIGATÓRIO** (bundle das raízes ICP-Brasil do ITI).
    Sem isso a validação de cadeia fica degradada — risco crítico.
  - Cookies `secure: true` (já condicionado a `NODE_ENV==='production'`).
  - `AR_SCANNER_TYPE=REAL` (ou provedor real), chaves PSC preenchidas.
  - Secrets gerados por `openssl rand -hex 64` e guardados em cofre (não no repo).

### 5.3 Checklist de produção (INTEGRACAO.md + auditoria)
- [ ] `SUPABASE_SERVICE_ROLE_KEY` nunca exposta no client.
- [ ] `ICP_BRASIL_ROOTS_PEM` configurado (validação de cadeia ativa).
- [ ] `cert_public_key_hash` preenchido para todos os AGRs (pinning).
- [ ] Senhas GS em bcrypt (`$2*`) — sem fallback plaintext (já removido no código).
- [ ] Rate limit por IP + tentativas de login bloqueadas após 5/min.
- [ ] `audit_logs` e `gs_audit_logs` populando.
- [ ] RLS mantido `ENABLED`; confirar que o anon só enxerga `leads`.
- [ ] HTTPS obrigatório; HSTS; cabeçalhos de segurança.

### 5.4 Infra planejada (ainda não cabeada no código)
O brief original cita **Redis** e **RabbitMQ**. Atualmente:
- Rate limit e nonces usam tabelas Postgres (`rate_limit_buckets`, `security_nonces`).
- Filas assíncronas (RabbitMQ) e cache (Redis) são **oportunos** para escala, mas não
  bloqueiam o MVP. Se adicionados, manter o mesmo padrão: credenciais em env, client
  server-only.

---

## 6. Ferramentas de suporte (instaladas/clonadas)

| Ferramenta | Local | Uso |
|---|---|---|
| `icp-brasil-agr` (skill) | `.opencode/skills/icp-brasil-agr` | Conhecimento ICP-Brasil/ITI p/ auditoria e conformidade |
| `self-learning` (skill) | `.opencode/skills/self-learning` | Gera skill de nova tecnologia via `/learn <topic>` |
| `graphify` (plugin + repo) | `.opencode/plugins/graphify.js` + `tools/graphify` | Knowledge graph do código → `graphify-out/` |
| `specify` (spec-kit, repo) | `tools/spec-kit` | Spec-Driven Development (`specify init`) |
| `open-design` (repo) | `tools/open-design` | Referência de design system / UI consistency |

> **Nota de instalação:** `graphify` (PyPI `graphifyy`) e `specify-cli` exigem
> **Python ≥ 3.11**. O Python do sistema é 3.9.6. Para ativá-los:
> ```bash
> # com pyenv ou instalador oficial do python.org:
> python3.11 -m venv .venv && source .venv/bin/activate
> pip install tools/graphify tools/spec-kit
> graphify install && graphify .      # gera graphify-out/{graph.html,GRAPH_REPORT.md,graph.json}
> specify init                        # bootstrap SDD
> ```
> O plugin `graphify.js` já está configurado em `.opencode/opencode.json` e dispara
> quando `graphify-out/graph.json` existir.

---

## 7. Glossário de arquivos-chave
- `src/middleware.ts` — guarda de rota (Edge). **Substitui o antigo `proxy.ts` inativo.**
- `src/lib/ac-angry/api-middleware.ts` — `withAuth` (auth/CSRF/RBAC).
- `src/lib/ac-angry/security.ts` — primitivas de segurança + PKI helpers.
- `src/app/api/auth/pki/route.ts` — login A3 + pinning + cadeia.
- `src/app/api/gs/mutate/route.ts` — mutação GS endurecida (tenant/RBAC/allowlist).
- `src/lib/infra/supabase/client.ts` — clientes Supabase centralizados.
- `SUPABASE_MIGRATION_SECURITY.sql` — `cert_public_key_hash` + `gs_audit_logs`.
```
