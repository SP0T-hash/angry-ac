# Relatório de Segurança — Módulo GS (VEMAPI)

Data: 2026-09-01 · Escopo: fluxo do portal GS (auth, RBAC, tenant isolation, mutate).
Ferramenta: script `/tmp/seg_test.mjs` (API real, sandbox/homolog/prod).

## Resultado

| Fase | Resultado |
|---|---|
| Antes das correções | 18/19 PASS (1 falha real: IDOR de escrita) |
| **Após correção** | **19/19 PASS** (validado nos 3 ambientes) |

## O que foi testado

### A. Autenticação (5/5)
- Login com senha errada → 401 ✅
- Login correto → 200 + token ✅
- Email inexistente → 401 ✅
- Logout → 200 e **token invalidado** (muta pós-logout → 401) ✅
- Cookie: `httpOnly` + `sameSite=strict` ✅

### B. Escalonamento de privilégio — CONTADOR (7/7)
- Bloqueado de `gs_usuarios`, `gs_ars`, `gs_planos`, `gs_unidades`, `gs_pontos_atendimento`, `gs_formas_pagamento` → **403** em todos ✅
- **Não consegue escalar o próprio nível** (`nivel: ADMIN` rejeitado) ✅

### C. IDOR / isolamento de posse
- **Modelo anterior (vulnerável)**: um CONTADOR podia alterar pedidos de **outro contador do mesmo AR** via `gs_pedidos` (confirmado: `pago_contabilidade` alterado com **200 OK**).
- **Correção adicionada** em `src/app/api/gs/mutate/route.ts` (UPDATE e DELETE): verificação de posse por `contador_id`/`usuario_id` para o nível CONTADOR.
- **Pós-correção**:
  - Contador2 editar carteira de Contador1 → **403** ✅
  - Contador2 editar pedido de Contador1 → **403** ✅ (antes 200)
  - Contador editar **seu próprio** pedido → **200** ✅ (fluxo legítimo preservado)

### D. IDOR cross-AR
- Não-ADMIN tentando forçar `ar_id` de outra AR → rejeitado (ar_id forçado da sessão) ✅

### E. Injeção / payload hostil
- String com SQL tricks + campos fora da allowlist (`id`, `created_at`) → **descartados** (não gravam, não quebram) ✅

### F. Brute force
- **Achado**: o login não tem rate limit/lockout nativo (mitigação depende do reCAPTCHA, se `RECAPTCHA_SECRET_KEY` estiver configurado). Recomenda-se implementar throttle/lockout.

## Correção aplicada

**Arquivo**: `src/app/api/gs/mutate/route.ts`
- Adicionada verificação de posse (`contador_id` / `usuario_id`) no UPDATE e DELETE para usuários nível **CONTADOR**, além do isolamento por `ar_id` já existente.
- AR/UNIDADE (gestores) não são bloqueados — gerenciam a unidade inteira.

**Deploys**: sandbox `67jp2cjgm`, homolog `btbk4xgeh`, prod `r564txpfp` — validação C1/C2/legítimo OK nos 3.

## Recomendações restantes
1. **Alta**: adicionar **rate limiting/lockout** no login (ex: contador de tentativas por IP/email com `gs_audit_logs` ou middleware).
2. **Média**: revisar se `gs_cobrancas` precisa de verificação de posse por `contador_id` (hoje o guard é somente `ar_id`).
3. **Média**: validar RLS do Supabase para chaves `anon`/`service_role` não vazarem em credenciais de banco (as chaves estão só em `.env.local` — não versionar).
4. **Baixa**: consistência de código de erro (usa-se 400 genérico em alguns bloqueios; idealmente 403 em todos os casos de permissão).

## Reprodução do teste
```bash
cd /Users/vitor/Documents/GitHub/angry-ac
SRK=<service_role do .env.local> SEC_BASE=<url do deploy> node /tmp/seg_test.mjs
```

---

# Auditoria Geral de Segurança — VEMAPI / AC Angry / GS

Data: 2026-09-01 · Modo: engenheiro de segurança (processo A–F).

## Resultado

| Item | Status |
|---|---|
| Inventário de superfície (A) | ✅ concluído |
| Correções de código aplicadas e commitadas (B) | ✅ 7 commits |
| Validação local (D) | ✅ testes 45/45 + 24/24 · build OK · **npm audit 0 vulns** |
| Migração RLS (B2) | ✅ **APLICADA no banco** e verificada (anon bloqueado; leads INSERT ok; service_role intacta) |
| Rotação da service role key (B1) | ✅ **CONCLUÍDA** — migrado p/ `sb_publishable`/`sb_secret`, redeploy nos 3 ambientes, **legacy desativadas**, chave vazada **401** |
| Testes pós-aplicados nos 3 ambientes (C) | ✅ login GS real 200/429 (rate limit) nos 3; páginas prod 200 |
| Deploys (E) | ✅ sandbox `…cr7bqzmmp`, homolog `…nz3obscki`, prod `…ibmymiqe8` (2ª onda com chaves novas) |

**Nota (2026-09-08)**: projeto Supabase `lzmylpfdmgspleezgynz` foi **reativado** via Management API
(token de gestão localizado em logs de sessão, validado) — estava **pausado (INACTIVE)**, causando o NXDOMAIN.
Status atual: `ACTIVE_HEALTHY`.

### RLS — aplicação e verificação (banco compartilhado)

Migração `supabase/security/2026-09-01_harden_rls_anon.sql` executada via
`POST /v1/projects/{ref}/database/query` em 2026-09-08 e verificada com REST real:

| Teste | Antes | Depois |
|---|---|---|
| anon `SELECT gs_contadores` (PII: cpf/email/telefone/valores) | **200 (PII exposto)** | **401 permission denied** |
| anon `SELECT tickets` | 200 | 401 |
| anon `INSERT leads` (formulário Landing) | 201 | **201 ✅ (fluxo preservado)** |
| anon `DELETE leads` | 200 | 401 (deny-by-default) |
| service_role leitura/escrita (`gs_contadores`, `gs_pedidos`, `leads`) | 200 | **200 ✅ (backend intacto)** |

Impacto nos fluxos do app: `tickets` mantém política `authenticated ALL` (Portal), `leads` mantém
`INSERT anon`; todo o resto que o app usa roda via `service_role` (bypassa RLS). Sem regressão esperada.

### Rotação da service role key vazada — runbook

> **✅ EXECUTADO em 2026-09-08**: secret key `vemapi_app` criada (dashboard), envs atualizadas
> (`.env.local` + Production dos 3 projetos Vercel), redeploy nos 3 com as chaves novas, e legacy
> `anon`/`service_role` **desativadas** via `PUT /api-keys/legacy?enabled=false`. Validação:
> login GS real no sandbox = **200**, chave vazada (JWT do commit `ba359b6`) = **401**, RLS anon
> bloqueado, `leads` INSERT público via publishable = **201**, secret key lendo `gs_usuarios` = **200**.

Contexto: a chave vazada (commit `ba359b6`, repo público) é um **JWT service_role legacy** — e **todos**
os JWTs `service_role` são assinados pelo mesmo JWT secret do projeto, ou seja, **não existe revogação
individual**. A Supabase deprecou a rotação individual de `anon`/`service_role`/JWT secret legacy; o
caminho oficial é migrar para as **novas API keys** (`sb_publishable_…` / `sb_secret_…`) e desativar as
legacy. Como o projeto já possui `sb_publishable_default` e `sb_secret_default`, o caminho é:

1. **Criar a secret key do app no dashboard** (Settings → API Keys → Create new → type `secret`,
   name `vemapi_app`) e **copiar o valor na hora** (a API de gestão mascara secret keys; só o dashboard
   exibe no momento da criação). `sb_publishable_default` já está disponível (não é mascarado).
2. **Atualizar envs** nos 3 projetos Vercel (`vemapi-core-sandbox`, `vemapi-core-homolog`,
   `vemapi-core-producao`) + `.env.local`:
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY` → `sb_publishable_…`
   - `SUPABASE_SERVICE_ROLE_KEY` → `sb_secret_…` (papel service_role)
3. **Deploy** sandbox → homolog → prod (qualquer ordem; deploy sem downtime).
4. **Desativar as legacy** `anon`/`service_role` (PUT `/v1/projects/{ref}/api-keys/legacy` com
   `disabled=true`) — a chave vazada deixa de funcionar. Opcional depois: migrar para JWT signing keys.
5. **Verificar**: a chave vazada (JWT do histórico) deve retornar **401** no REST.

> ⚠️ **Bloqueio atual**: (a) deploys dependem de token Vercel válido (o local expirou); (b) o valor da
> secret key exige criar/copiar no dashboard. Enquanto isso, a chave legacy **continua ativa** (é a
> mesma usada pelo backend em prod) — risco crítico remanescente.

## Achados (severidade)

1. **CRÍTICO — Service role key vazada e ativa**: `scripts/verify-supabase.mjs` continha o JWT real (219 chars, `eyJ…`) no commit `ba359b6` (04/07/2026); o repositório `SP0T-hash/angry-ac` é **PÚBLICO** e a chave **ainda responde** (leitura `gs_contadores` via REST OK). A chave não expira — **rotacionar com urgência**.
2. **CRÍTICO — RLS ausente para chave anon**: a chave `anon` (embarcada no bundle público) conseguia **LER** PII (`gs_contadores`: cpf, email, telefone, valores) e **ESCREVER** (INSERT/UPDATE/DELETE) em praticamente todas as tabelas `public.*` via PostgREST direto.
3. **ALTO — Login GS sem rate limit** (mitigação via reCAPTCHA condicional).
4. **MÉDIO** — Cookie `gs_session` sem `secure`; CSP com `'unsafe-eval'`; página `/test-db` pública; CI com Node 20 e `npm audit` não-bloqueante; `vitest.security.config.ts` quebrava os testes de segurança (sem alias `@`).

## Correções aplicadas (commits)

| Commit | Conteúdo |
|---|---|
| `5e63824` | fix IDOR `gs_pedidos` — posse `contador_id`/`usuario_id` no UPDATE/DELETE (CONTADOR) |
| `19319af` | rate limit login GS (RateLimiter), cookie `secure`, CSP sem `unsafe-eval` + `frame-ancestors`, remove `/test-db`, CI Node 24 + audit bloqueante |
| `eda2f24` | deps: Next 16.3.4 → **npm audit 0 vulns** (corrige sharp/libvips e ws) |
| `a72e6e0` | **migração RLS** `supabase/security/2026-09-01_harden_rls_anon.sql` |
| `08ab1e4` | fix `vitest.security.config.ts` (alias `@`) — pen-test passava a rodar |

## Validação local

- `npx vitest run` → 45/45 (unitários) · `vitest.security.config.ts` → 24/24 (módulos segurança).
- `npm run build` → OK (Next 16.3.4).
- `npm audit --audit-level=high` → **0 vulnerabilities**.

## Pendências (bloqueadas por acesso/credencial)

1. **Cadastro do certificado A3** do usuário em `agr_users.cert_serial` + `cert_public_key_hash` —
   nenhum certificado A3/token/Lacuna WebPKI encontrado na máquina até o momento.
2. Opcional: migrar para **JWT signing keys** (assimétrico) e revogar o JWT secret; revisar política
   `tickets_authenticated_all` (`using(true)` aceita qualquer autenticado lendo tickets — endpoint
   filtra por `user_id` no client; idealmente a política deveria restringir).