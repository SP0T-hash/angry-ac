# Ambientes de Desenvolvimento e Produção — VEMAPI Suite

Configuração de ambientes **dev/prod** para cada produto da suíte, com separação clara
e **guarda de emissão bloqueada** por padrão (sandbox/homologação). Nenhum segredo real é
versionado; apenas arquivos `.env.*.example` com placeholders.

## 1. angry-ac (Landing + GS + AC Angry) — Next.js 16

Next.js carrega automaticamente `.env.development` (em `npm run dev`) e `.env.production`
(em `npm run build`/`start`). Foram criados os arquivos **de exemplo**:

- `angry-ac/.env.development.example`
- `angry-ac/.env.production.example`

Variáveis:
- `NEXT_PUBLIC_APP_ENVIRONMENT` — `development|homologation|production|sandbox` (cliente).
- `NEXT_PUBLIC_ENVIRONMENT_LABEL`, `NEXT_PUBLIC_SHOW_ENV_BANNER`, `NEXT_PUBLIC_BRAND_NAME`.
- Server-only: `NEXT_PUBLIC_SUPABASE_URL`, `*_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`,
  `AUTH_JWT_SECRET`, `PKI_NONCE_SECRET`, `AC_INTEGRATION_ENABLED`, `AC_API_URL`.

Módulo de config: `src/lib/env.ts` → `ENVIRONMENT`, `IS_PRODUCTION`, `ISSUANCE_BLOCKED`,
`ENVIRONMENT_LABEL`, `SHOW_ENV_BANNER`, `PRODUCT_NAME`.

Indicador visual: `src/components/EnvironmentBanner.tsx` inserido nos layouts de grupo
`(landing)`, `(portal)`, `(angry)` e `gs`. Em produção aparece discreto; em dev/homologação/
sandbox mostra o estado e "emissão bloqueada".

## 2. ar-eletronica (RI / AR Eletrônica) — Vite + Express + Drizzle

Vite usa `.env`, `.env.development`, `.env.production` (variáveis `VITE_*` expostas ao cliente).
Foram criados:

- `ar-eletronica/.env.development.example`
- `ar-eletronica/.env.production.example`

Módulo de config: `shared/config.ts` → `ENVIRONMENT`, `IS_PRODUCTION`, `ISSUANCE_ENABLED`,
`SHOW_ENV_BANNER`, `ENVIRONMENT_LABEL`, `REGULATORY_STATUS`.

Indicador visual: `client/src/components/EnvironmentBadge.tsx` inserido em `client/src/App.tsx`
(cobre todas as rotas: `/`, `/solucao`, `/operacao`).

Scripts:
- Dev: `pnpm dev` (NODE_ENV=development, `VITE_APP_ENVIRONMENT=development`).
- Prod: `pnpm build && pnpm start` (NODE_ENV=production).

## 3. Matriz de emissão (todos os sistemas)

| Ambiente | Emissão ICP-Brasil | Observação |
|---|---|---|
| development | **BLOQUEADA** | `VITE_AC_INTEGRATION_ENABLED=false` / `AC_INTEGRATION_ENABLED=false` |
| sandbox | **BLOQUEADA** | demonstração sem dados reais |
| homologation | **BLOQUEADA** | até AC/DPC/homologação |
| production | **BLOQUEADA por padrão** | só libera com `=true` + `AC_API_URL` após contrato + credencial + homologação |

Nunca alterar para `true` sem autorização explícita da AC e conclusão da homologação.

## 4. Como usar
1. Copiar `.env.development.example` → `.env.development` (dev) ou `.env.production.example` → `.env.production` (prod).
2. Preencher apenas placeholders; nunca commitar o arquivo real (`.env`, `.env.development`,
   `.env.production` estão no `.gitignore`).
3. Rodar `npm run dev` / `pnpm dev` (dev) ou `build`+`start` (prod).
4. O banner de ambiente confirma visualmente o modo ativo.
