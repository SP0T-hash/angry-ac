# ANGRY-AC — Como rodar os ambientes

## Pré-requisitos
- Node.js 18+ (instalado: v25.8.2)
- Dependências já instaladas via `npm install --legacy-peer-deps`
  (necessário por causa do @tremor/react que pede React 18, mas o projeto usa React 19)

## Ambiente de DESENVOLVIMENTO
```bash
npm run dev
# Carrega .env.development | roda em http://localhost:3001
```

## Ambiente de PRODUÇÃO (local)
```bash
npm run build       # gera o build (carrega .env.production)
npm run start:prod  # sobe o servidor em http://localhost:3000
```

## ⚠️ Áreas independentes (não misturar edições)
O projeto tem 3 frentes que devem evoluir separadamente. Só alterar uma
área quando explicitamente solicitado — nunca aplicar mudanças de uma nas
outras sem ordem.

| Área | Rotas | Onde | Estado |
|------|-------|------|--------|
| **Landing (VEMAPI)** | `/` | `src/app/(landing)/` | 🔒 TRAVADA — `git update-index --assume-unchanged` em `page.tsx` e `layout.tsx`. Não mexer sem pedir. |
| **GS (Gestão Core-AR)** | `/gs/*` | `src/app/gs/`, `src/components/gs/` | ✅ Ativo — reforma de UI aplicada. |
| **AC ANGRY** | `/ac/*`, `(angry)` | `src/app/(angry)/` | ✅ Ativo — separado do GS. |

Para destravar a landing (só quando for mexer nela de propósito):
```bash
git update-index --no-assume-unchanged "src/app/(landing)/page.tsx" "src/app/(landing)/layout.tsx"
```

## 🌱 Spec-Kit (spec-driven development)
O repositório usa [spec-kit](https://github.com/github/spec-kit) para documentar
features antes de implementar. O CLI `specify` está instalado (via `uv`).

**Comandos disponíveis** (instalados em `.claude/skills/` — lidos/executados
manualmente pelo opencode, já que não usamos Claude):
- `constitution` — princípios do projeto → `.specify/memory/constitution.md` (já criada)
- `specify` — cria spec de feature em `specs/<NNN-nome>/spec.md`
- `plan` / `tasks` / `implement` / `converge` — planejar, quebrar em tarefas, implementar, validar

**Como usar no opencode:** para uma nova feature, peça "crie a spec com
speckit-specify para <feature>" — eu sigo o SKILL.md correspondente e gero os
arquivos em `specs/`. Exemplo já documentado: `specs/001-gs-ui-reform/spec.md`.

**Constituição do projeto:** `.specify/memory/constitution.md` (Princípio I =
separação das áreas; III = design system Open Design; IV = dev/prod).

## 🕸️ Graphify (knowledge graph do código)
Ferramenta de análise (não é dependência do app) que mapeia o projeto em um
grafo de conhecimento via AST local (tree-sitter), sem LLM. Útil para auditar
acoplamento entre as 3 áreas e achar componentes órfãos.

**Uso:**
```bash
graphify . --code-only          # gera graphify-out/ (AST local, sem API key)
graphify cluster-only .         # gera GRAPH_REPORT.md + graph.html
graphify path "A" "B"           # caminho mais curto entre dois arquivos
graphify explain "X"            # explica um nó e vizinhos
```
Skill `/graphify` registrado no opencode (`.config/opencode/skills/graphify`).
`graphify-out/` está no `.gitignore`.

**Descobertas da análise (2026-07-19):**
- GS ↔ AC Angry: **sem arestas** (0 caminho) → áreas bem separadas (Princípio I OK).
- Landing ↔ GS: caminho indireto de 9 hops só via `supabase.ts`/`getSupabaseAdmin`
  (infra de dados compartilhada, não acoplamento de UI — aceitável).
- Componentes órfãos confirmados: `ac-angry/admin/{AgenteMonitor,KpiGrid,SecurityAuditTable}`
  não têm caminho para nenhuma rota (spec 005).

**MCP do Graphify (ativo):** registrado em `~/.config/opencode/opencode.jsonc`
(comando `graphify-mcp --graph graphify-out/graph.json`). Expõe as ferramentas de
query do grafo (path/explain/busca) direto no agente. ⚠️ Após mudanças de código
relevantes, rodar `graphify . --code-only` para atualizar `graphify-out/graph.json`
(sem API key = só AST de código) e reiniciar a sessão do opencode para o MCP
relar o arquivo.

## Validação
```bash
npx tsc --noEmit   # type check
npm run lint       # lint
npm test           # testes (vitest)
```

## Antes de usar de verdade
Edite `.env.development` e `.env.production` e preencha:
- NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_ANON_KEY, SUPABASE_SERVICE_ROLE_KEY
- Rode SUPABASE_SCHEMA.sql no SQL Editor do Supabase
- Para produção, gere NOVOS secrets (PKI_NONCE_SECRET, AUTH_JWT_SECRET, PKI_ENCRYPTION_KEY)
  com: node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"

## Deploy real
Conecte o repositório ao Vercel e adicione as variáveis de `.env.production` no painel.

---

# STATUS DE ENTREGA

## ✅ Landing Page (VEMAPI) — CONCLUÍDA
Rota: `/` (grupo `src/app/(landing)/`)
- Renderiza corretamente em produção (HTTP 200, conteúdo hidratado).
- Layout em `src/app/(landing)/layout.tsx` com fonte Geist Sans (local).
- Envolve `ErrorBoundary` para evitar tela em branco silenciosa.

### Correções críticas aplicadas (commit "fix: landing page e correções de hidratação/CSP")
1. **CSP bloqueava scripts inline do Next.js** → páginas em branco.
   - `next.config.ts`: adicionado `'unsafe-inline'` ao `script-src` e
     `https://grainy-gradients.vercel.app` ao `img-src`.
2. **Build falhava offline** por `next/font/google` (Inter) baixar fonte do Google.
   - Trocado por `geist/font/sans` (fonte local, sem rede) nos 3 layouts.
3. **ErrorBoundary** aplicado em `(landing)`, `(angry)` e `(portal)`.
4. **`pki.ts`**: `node-forge` agora é import dinâmico (não pesa no client).
5. **`.gitignore`**: adicionados `.env.development` e `.env.production`
   (nunca commitar credenciais reais).

### Validação
- `npx tsc --noEmit` → OK
- `npm test` → 41 testes passando
- `npm run build` + `npm start` → todas as rotas 200

## ✅ Módulo GS (Core-AR) — CONCLUÍDO (frontend)
Commit `b3fb09a`. Módulo de Gestão multi-tenant implementado do zero:
- **Auth GS própria**: `gs_usuarios` + sessão httpOnly (`lib/gs/session.ts`) + RBAC por nível (9 níveis).
- **Login**: `/gs/login` · **Logout**: API `/api/gs/auth/logout`
- **Dashboard**: `/gs/dashboard` (KPIs Tremor, paleta Design System v2)
- **Telas**: ARs, Unidades, Pontos de Atendimento, Clientes, Pedidos,
  Financeiro (planos/cobranças/repasses), Suporte/Tickets
- **Componentes**: `GSShell` (navbar+sidebar), `GSTable` (tabela genérica)
- **Helpers**: `lib/gs/{types,session,data,guard}`

### Usuário de teste (banco VEMAPI)
- Email: `admin@acangry.ac.br` · Senha: `Admin@123` (redefinida durante setup)
- Nível: `AC_ADMIN`

### Como rodar o GS
```bash
npm run dev      # http://localhost:3001/gs/login
npm run build && npm start   # http://localhost:3000/gs/login
```

### CRUD (create/edit/delete)
Commit `95c047d`. Todas as entidades têm formulário (modal) de criação/edição:
- **API**: `POST/DELETE /api/gs/mutate` (server, service-role) — protegida por
  sessão GS (cookie httpOnly) + **whitelist de tabelas** (anti SQL injection).
  Body: `{ tabela, id?, data }`.
- **Client**: `lib/gs/mutate-client.ts` (gsMutate/gsDelete) · `GSFormModal` ·
  `GSListClient` (lista + botões Novo/Editar/Excluir).
- Entidades com CRUD: ARs, Unidades, Pontos, Clientes, Pedidos, Planos, Tickets.

### Notas de schema (descobertas no setup)
- Coluna de ativo é **`is_active`** (não `ativo`) em `gs_ars`, `gs_unidades`,
  `gs_pontos_atendimento`, `gs_usuarios`.
- `gs_usuarios.is_active`, nível emumm `USER-DEFINED`.
- `gs_clientes.email` é **NOT NULL** (obrigatório no form).
- `gs_assinaturas.contador_id` referencia `gs_contadores(id)` que **não existe**
  no schema — FK órfã (não quebra o frontend de listagem).

## 🟡 Pendente (opcional)
- Módulo Contador (carteira/scanner/NF) e Notificações (telas dedicadas).
- Backend .NET CORE-AR (`gs.vemapi/` está vazio — specs 007–010).
- Integrações Asaas / Focus NFe (split de pagamento / emissão NFS-e).
- Validação de CPF/CNPJ e máscaras nos forms.

## 🎨 Reforma de UI do módulo GS (antigo "layout bagunçado")
Aplicado padrão visual inspirado em Open Design (tokens únicos de acento,
grid modular, 5 estados obrigatórios, foco visível, sem gradiente "trust"):

- **Sidebar com labels**: nova `src/components/gs/GSLayout.tsx` unifica
  sidebar + header (antes `GSShell` e `GSListClient` duplicavam uma sidebar
  só-ícones de 68px). Itens ativos destacados em `emerald-50`. Item de logout
  visível com texto "Sair".
- **Login reestilizado** (`src/app/gs/login/page.tsx`): fundo plano
  (`--color-surface`), validação de formulário acessível (pristine/touched/
  invalid, `aria-invalid` + `aria-describedby` + `role="alert"`), foco visível
  emerald. Sem gradiente emerald→indigo (anti-pattern).
- **reCAPTCHA v2 invisível** adicionado ao login. Verificação server-side em
  `src/app/api/gs/auth/login/route.ts`. Ativar preenchendo
  `NEXT_PUBLIC_RECAPTCHA_SITE_KEY` + `RECAPTCHA_SECRET_KEY` nos `.env`.
  Se vazio, o login não é bloqueado (compatibilidade dev).
- **Estados de lista**: `GSListClient` aceita `carregando` (skeleton "Carregando…")
  e `erro`. Dashboard corrige `bg-${color}-500/10` (interpolação Tailwind
  quebrava no JIT) por wrapper fixo.
- **Otimização de login** (`src/lib/gs/session.ts`): `randomBytes` nativo
  (removido `require("crypto")` dinâmico). Cliente admin já memoizado.
  Tempo quente ~1.6s (gargalo = latência de rede ao Supabase).

### Índices recomendados (aplicar no Supabase SQL Editor)
```sql
create index if not exists idx_gs_usuarios_email on gs_usuarios(email);
create index if not exists idx_gs_sessoes_token on gs_sessoes(token);
```

## Notas de segurança
⚠️ Revogar os tokens `ghp_...` (GitHub) e `sbp_...` (Supabase) que foram usados
para configurar este ambiente — eles apareceram em texto durante o setup.

---

## 🔐 Auditoria AC Angry — correções P0/P1 (2026-07-20)

Auditoria de segurança do módulo AC Angry (login A3, persistência de certificado,
conformidade ICP-Brasil/ITI). Itens **corrigíveis por código** resolvidos:

| ID | Severidade | Problema | Status | Correção |
|----|-----------|----------|--------|----------|
| P0-01 | Crítico | `GET /api/auth/pki` gerava nonce solto (não persistia) → `POST` falhava "Nonce não encontrado" | ✅ Resolvido | `route.ts` GET agora chama `NonceManager.generate('AUTH')` (persiste em `security_nonces`) |
| P0-02 | Crítico | Client enviava `certificate` (objeto WebPKI); server fazia destructure de `certificatePem` (undefined) | ✅ Resolvido | `src/app/(angry)/auth/login/page.tsx` agora extrai PEM via `pki.getCertificate(thumbprint)` e envia `certificatePem` |
| P1-04 | Alto | `persist-certificate` criava client ad-hoc / import morto de client anon | ✅ Resolvido | Trocado por `getSupabaseAdmin()` (service-role, via `withAuth`) |
| P0-06 | Alto | IP extraído de `x-forwarded-for` spoofável | ⚠️ Mitigado | Mantido padrão "primeiro IP" (correto behind trusted proxy). Documentar: exige proxy confiável que sobrescreva o header na borda. |

### Itens NÃO reproduzíveis no código atual
- **P0-05 (CORS aberto)**: não há `Access-Control-Allow-Origin: *` em nenhuma rota;
  o app router bloqueia cross-origin por padrão. Sem ação necessária.

### ⛔ BLOQUEANTES de conformidade ICP-Brasil/ITI (NÃO corrigíveis por código)
Estes exigem **infraestrutura de AC credenciada pelo ITI**, fora do escopo do repo:
- **C1** — AC Angry é autodeclarada (sem credenciamento ITI). Emitir certificados
  ICP-Brasil válidos exige AC credenciada + cadeia até AC RAIZ.
- **C2** — Sem LCR (CRL) e OCSP publicados em URL estável do ITI/AC.
- **C3** — Sem TSA (carimbo de tempo) credenciado.
- **C4** — Auditoria não é imutável (tabela `audit_logs` editável; falta WORM/HSM).
- **C5** — Chaves privadas de CA sem HSM certificado (FIPS 140-2+).
- **C6** — Sem processo de revogação publicado (ponto de distribuição de CRL).

> O login A3 implementado é **criptograficamente real** (verifica assinatura do
> nonce com a chave pública do certificado, valida ICP-Brasil, revogação, validade,
> nonce one-time via HMAC). O gap é de **credenciamento da AC**, não do código.

### Como validar o login A3 após correções
```bash
npm run build && npm start:prod   # http://localhost:3000/ac/auth/login
# Fluxo: GET /api/auth/pki → nonce → pki.signData → POST com certificatePem + signature
```

