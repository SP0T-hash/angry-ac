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
npm run build   # gera o build (carrega .env.production)
npm start       # sobe o servidor em http://localhost:3000
```

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

## Notas de segurança
⚠️ Revogar os tokens `ghp_...` (GitHub) e `sbp_...` (Supabase) que foram usados
para configurar este ambiente — eles apareceram em texto durante o setup.
