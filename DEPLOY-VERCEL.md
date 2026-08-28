# Deploy na Vercel — angry-ac (VEMAPI: Landing + GS + AC Angry)

App Next.js (App Router). Nativo da Vercel: basta importar o repositório.

## 1. Importar no Vercel
- New Project → Import `SP0T-hash/angry-ac` (branch `opencode/comercial`).
- Framework: detectado como **Next.js**. `vercel.json` confirma `framework: nextjs`.
- Build Command padrão: `pnpm build` (já exclui a pasta `tools` do build).

## 2. Variáveis de ambiente (Settings → Environment)
Copie de `.env.example`. Marque Production / Preview / Development.

### Obrigatórias (Supabase)
- `NEXT_PUBLIC_SUPABASE_URL` — `https://SEU_PROJETO.supabase.co`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` — anon key (pública)
- `SUPABASE_SERVICE_ROLE_KEY` — **secreta**, só server-side

### App
- `NEXT_PUBLIC_APP_URL` — URL pública (ex.: `https://vemapi.com.br`)
- `NEXT_PUBLIC_API_URL` — URL da API backend (.NET) se houver

### PKI / Segurança (server-side)
- `PKI_NONCE_SECRET`, `AUTH_JWT_SECRET`, `PKI_ENCRYPTION_KEY` — 64 bytes hex
  cada (`openssl rand -hex 64`).
- PSC providers (só se usar emissão real): `VIDAAS_*`, `SYNGULAR_*`, `BIRDID_*`
- `RATE_LIMIT_*`, `AUDIT_RETENTION_DAYS`

## 3. Banco (Supabase)
Antes do primeiro uso, rode no SQL Editor do Supabase (ordem sugerida):
1. `SUPABASE_SCHEMA.sql` (base de segurança/AC Angry)
2. `SUPABASE_SCHEMA_GS.sql`, `SUPABASE_SCHEMA_BILLING.sql`, `SUPABASE_SCHEMA_AGENDA.sql`
3. `SUPABASE_SEED.sql` (dados iniciais, se aplicável)
4. Fixes: `FIX_*.sql` conforme necessário.

## 4. White-label por AR
- O endpoint público `/api/gs/branding?ar=<slug|id>` retorna a marca da AR
  (cor `brand`, logo, nome). A RI consome esse endpoint via `VITE_GS_BRANDING_HOST`.
- Para customizar a marca de uma AR, use o painel GS (`/gs/contadores` e o editor
  de branding de ARs).

## 5. Build local de referência
```
pnpm install
pnpm build      # next build
pnpm test       # vitest (45 testes de segurança)
```

## Observações
- Em `sandbox`/homologação a emissão ICP-Brasil real fica bloqueada por design.
- Os arquivos `gyms-*` e `scripts/` são ferramentas auxiliares e **não** entram
  no deploy (estão fora do commit de roadmap).
