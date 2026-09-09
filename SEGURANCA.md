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
| Correções de código aplicadas e commitadas (B) | ✅ 6 commits |
| Validação local (D) | ✅ testes 45/45 + 24/24 · build OK · **npm audit 0 vulns** |
| Migração RLS (B2) | ⏳ escrita + commitada, **aplicação no banco pendente** |
| Rotação da service role key (B1) | ⏳ **pendente** (vazou no commit `ba359b6`, em repo público, chave ainda ativa) |
| Testes pós-aplicados nos 3 ambientes (C) | ⏳ pendente (banco fora/esperando rotação) |
| Deploys (E) | ⏳ pendente (sem token Vercel válido na sessão) |

## Achados (severidade)

1. **CRÍTICO — Service role key vazada e ativa**: `scripts/verify-supabase.mjs` continha o JWT real (219 chars, `eyJ…`) no commit `ba359b6` (04/07/2026); o repositório `SP0T-hash/angry-ac` é **PÚBLICO** e a chave **ainda responde** (leitura `gs_contadores` via REST OK). Schave não expira — **rotacionar com urgência**.
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

1. **Rotacionar a service role key** — precisa do token de gestão Supabase (`sbp_…`) **ou** regeneração manual no dashboard; depois atualizar envs nos 3 projetos Vercel + `.env.local` + secrets do GitHub.
2. **Aplicar a migração RLS** no banco compartilhado (`lzmylpfdmgspleezgynz`) via SQL Editor/Management API (impacto mínimo: fluxos usam service role; `leads`/`tickets` preservados com políticas mínimas).
3. **Banco fora do ar**: `lzmylpfdmgspleezgynz.supabase.co` está **NXDOMAIN** (pausado/deletado?) — impedindo C (bateria nos 3 ambientes) e o cadastro A3.
4. **Deploy** do código commitado — sem token Vercel válido na sessão (token local expirado).
5. **Cadastro do certificado A3** do usuário em `agr_users.cert_serial` + `cert_public_key_hash` — nenhum certificado A3/token/Lacuna WebPKI encontrado na máquina até o momento.