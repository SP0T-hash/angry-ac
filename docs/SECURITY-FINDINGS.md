# Achados de Segurança — AC ANGRY & GS (Auditoria)

> Auditoria baseada em revisão estática (3 agentes especializados) + ameaças
> (erros, danos, ataques). Status em `11e6ca0` (commit de correção).
> Severidade: 🔴 CRÍTICO · 🟠 ALTO · 🟡 MÉDIO · 🟢 BAIXO.

---

## AC ANGRY — Backend

### 🔴 ROTA DE GUARDA INATIVA (proxy.ts nunca executado)
- **Ameaça:** `src/proxy.ts` não é o arquivo de middleware do Next (que deve ser
  `middleware.ts`). Resultado: `/ac/admin`, `/ac/agent/dashboard` estavam **sem
  autenticação** — qualquer um acessava a área do AGR.
- **Correção:** criado `src/middleware.ts` (Edge, Web Crypto) que valida o JWT do
  cookie; `/ac/admin` exige `role=ADMIN`. `proxy.ts` removido.
- **Status:** ✅ CORRIGIDO

### 🔴 Mass-assignment + IDOR em protocol/update
- **Ameaça:** `update(updates).eq('id', id)` aceitava qualquer coluna e qualquer `id`
  (sem ownership/lock) → um AGR podia forjar `status='ISSUED'`, `biometry_status`,
  `cert_serial`, etc.
- **Correção:** whitelist de campos editáveis, transições de status controladas, e
  exigência de `locked_by = session.agrId` (ou ADMIN).
- **Status:** ✅ CORRIGIDO

### 🔴 PKI login bypass (serial spoofing)
- **Ameaça:** a validação só conferia issuer string + assinatura contra a chave **do
  próprio certificado apresentado**. Um atacante auto-assinava um cert com o serial
  conhecido de um AGR válido e assinava o nonce com sua própria chave → login como
  o AGR.
- **Correção:** **pinning** de chave pública (`cert_public_key_hash` no `agr_users`),
  rejeição de cert **self-signed**, e validação de **cadeia ICP-Brasil** quando
  `ICP_BRASIL_ROOTS_PEM` está configurado. Semanticamente alinhado ao skill
  `icp-brasil-agr` ("validar a cadeia até a AC Raiz").
- **Status:** ✅ CORRIGIDO (pinning + self-signed). ⚠️ **PENDENTE em prod:** configurar
  `ICP_BRASIL_ROOTS_PEM` e popular `cert_public_key_hash` para todos os AGRs.

### 🟠 requireRole nunca era aplicado
- **Ameaça:** qualquer AGR autenticado acessava ações de admin.
- **Correção:** `withAuth` agora lê `opts.requireRole` e consulta o papel; aplicado a
  `ac/sign`, `ac/persist-certificate`, `psbio`, `saf` (AGR+) e middleware p/ `/ac/admin`.
- **Status:** ✅ CORRIGIDO

### 🟠 Rate limit contornável (X-Forwarded-For spoofable)
- **Ameaça:** chave de rate limit vinha de header controlável pelo cliente.
- **Correção:** usa `req.ip` confiável (proxy/Vercel). (Mesma melhoria aplicada no
  `pki/route` que usa IP do header como fallback.)
- **Status:** ✅ CORRIGIDO

### 🟡 verifyJWT não validava `alg`
- **Ameaça:** algorithm confusion.
- **Correção:** `verifyJWT` (e o verificador do middleware) exigem `alg=HS256`.
- **Status:** ✅ CORRIGIDO

### 🟡 Sessão não vinculada a IP/UA
- **Ameaça:** token roubado usável por 8h de qualquer origem.
- **Correção (parcial):** `secure_sessions` já checa `is_active`/expiração e renova
  `last_activity`. Vinculação estrita a UA/IP fica como 🟡 melhoria futura (risco de
  falso positivo em redes móveis). CSRF mitigado por sameSite=lax + checagem de Origin.
- **Status:** 🟡 PARCIAL (mitigado por CSRF + expiração)

---

## AC ANGRY — Frontend

### 🔴 Cookie ↔ Bearer mismatch (todas as APIs retornavam 401)
- **Ameaça:** sessão gravada em cookie httpOnly, mas `withAuth` exigia Bearer → todo
  fetch autenticado falhava silenciosamente (dashboard vazio, emissão quebrada).
- **Correção:** `withAuth` aceita cookie **ou** Bearer; adicionado CSRF Origin-check.
- **Status:** ✅ CORRIGIDO

### 🔴 SAF antifraude fail-open
- **Ameaça:** erro na consulta SAF era tratado como `clean` → emissão liberada.
- **Correção:** catch/match → estado `error` (bloqueia; não avança para "attached").
- **Status:** ✅ CORRIGIDO

### 🟠 Identidade/IP forjados no log de auditoria
- **Ameaça:** `currentUser = "VITOR MATHEUS CASTRO"` e `ip_address: '187.64.122.10'`
  hardcoded eram enviados ao `/api/protocols/audit`.
- **Correção:** removidos do payload (rota já usa `session.agrId`/`ip` server-side).
  Exibição local passa a usar `'AGR'`; laudo SAF sem nome pessoal hardcoded.
- **Status:** ✅ CORRIGIDO

### 🟠 Middleware incompatível com Edge
- **Ameaça:** `proxy.ts` importava `node:crypto` + admin client → quebraria no Edge.
- **Correção:** `middleware.ts` usa Web Crypto; não importa o client admin.
- **Status:** ✅ CORRIGIDO

### 🟡 Crash em telefone nulo
- **Ameaça:** `maskPhone(undefined)` quebrava o viewer.
- **Correção:** `protocol.titular.phone ?? ''` nas duas montagens de `editableData`.
- **Status:** ✅ CORRIGIDO

### 🟡 Login PIN "teatro de segurança"
- **Ameaça:** campo PIN validado só por presença, nunca usado na assinatura.
- **Correção (recomendação):** remover o campo ou cabear no WebPKI. *Pendente* — baixo
  risco, decisão de produto.
- **Status:** 🟡 PENDENTE (baixo)

### 🟡 WebSocket `ws://localhost:8080` hardcoded
- **Ameaça:** mixed-content em prod, host fixo.
- **Correção (recomendação):** mover para env + `wss://`. *Pendente*.
- **Status:** 🟡 PENDENTE (baixo)

---

## GS — Backend & Frontend

### 🔴 IDOR cross-tenant em /api/gs/mutate
- **Ameaça:** qualquer usuário editava/excluía qualquer linha de qualquer tenant.
- **Correção:** `ar_id` derivado da sessão; update/delete pré-seleciona a linha e exige
  `row.ar_id === session.ar_id` (ou ADMIN); tenant forçado no insert.
- **Status:** ✅ CORRIGIDO

### 🔴 Sem RBAC nas mutações
- **Ameaça:** CONTADOR criava ARs / editava splits financeiros.
- **Correção:** mapa de política por tabela com nível mínimo (`gs_ars/planos/unidades/
  pontos` → ADMIN; clientes/pedidos/cobranças/tickets/assinaturas` → AR).
- **Status:** ✅ CORRIGIDO

### 🟠 Mass-assignment / sem allowlist
- **Ameaça:** cliente controlava todas as colunas (`valor_total`, `ar_id`, `id`...).
- **Correção:** field allowlist por tabela; `id`/`created_at`/`updated_at`/tenant
  stripados.
- **Status:** ✅ CORRIGIDO

### 🟠 Senha plaintext fallback
- **Ameaça:** `senha === hash` comparava em texto puro (não constante).
- **Correção:** só bcrypt (`$2*`); `is_active` checado na sessão; `last_activity`
  atualizado; cookie `sameSite=strict`.
- **Status:** ✅ CORRIGIDO

### 🟠 Colunas inexistentes quebrando listas
- **Ameaça:** páginas `ars/unidades/pontos` selecionavam `ativo`/`criado_em` (não
  existem) → listas sempre erravam.
- **Correção:** passaram a usar `is_active`/`created_at`.
- **Status:** ✅ CORRIGIDO

### 🟠 Sem auditoria no ERP
- **Ameaça:** logins/mutações financeiras sem trilha.
- **Correção:** `gs_audit_logs` (nova tabela) + insert best-effort no `mutate`.
- **Status:** ✅ CORRIGIDO (falta backfill de dados históricos)

### 🟡 Erros do banco vazados ao client
- **Ameaça:** `error.message` do Postgres expunha schema.
- **Correção:** mensagens genéricas; detalhe logado server-side.
- **Status:** ✅ CORRIGIDO

### 🟡 Layout GS com html/body aninhado
- **Ameaça:** hidratação inválida (raiz já tem html/body).
- **Correção:** layout passa a não renderizar html/body.
- **Status:** ✅ CORRIGIDO

---

## Pendências / próximos passos (produção)
1. ⚠️ Configurar `ICP_BRASIL_ROOTS_PEM` (cadeia ICP-Brasil) em produção.
2. ⚠️ Popular `agr_users.cert_public_key_hash` para todos os AGRs (enrollment/login).
3. 🟡 Vincular sessão a UA/IP (opcional, risco de falso positivo).
4. 🟡 Resolver PIN "teatro" e WebSocket hardcoded (baixo risco).
5. 🟡 Plugar `gs_permissoes` (RBAC granular já modelado no schema).
6. 🟢 Migrar Rate limit/nonces para Redis se necessário por escala.

## Verificação
- `npx tsc --noEmit` → 0 erros
- `npm test` → 41/41
- `npm run build` → middleware ativo ("ƒ Proxy (Middleware)")
- `SUPABASE_MIGRATION_SECURITY.sql` deve ser executado no Supabase (cria
  `cert_public_key_hash` + `gs_audit_logs`).
```
