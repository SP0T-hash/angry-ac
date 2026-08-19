# Análise — Repositório `angry-ac` (Landing + GS + AC Angry)

Este repositório (clone de `https://github.com/SP0T-hash/angry-ac.git`, branch local
`opencode/security-hardening`) é o **guarda-chuva comercial/operacional** da suíte. Contém
três dos quatro produtos: **Landing/Comercial**, **GS** e **AC Angry**. O quarto (RI/AR
Eletrônica) vive em repositório separado (`ar-eletronica`), analisado em
`analise-ar-eletronica.md`.

## Stack
- **Frontend/App**: Next.js 16 (App Router, TypeScript, Tailwind 3), React 19. Rotas:
  `src/app/(landing)`, `src/app/(portal)`, `src/app/(angry)`, `src/app/gs`, `src/app/api`.
- **Backend**: API Routes do Next + Supabase (Postgres). Schemas SQL em `SUPABASE_SCHEMA*.sql`.
- **Segurança (AC Angry)**: `src/lib/ac-angry/security.ts` (NonceManager, SessionManager,
  RateLimiter, AuditLogger, ProtocolLocker, verifyJWT, PKI helpers). Testado por
  `src/lib/ac-angry/__tests__/security.test.ts` (**41 testes passando**).
- **Adaptadores PSC**: `psc-auth.ts` (BirdID/Vidaas/Syngular), `soluti-vidaas.ts` (OAuth2 nuvem).
- **Testes**: Vitest (`npm run test` → 1 arquivo, 41 testes). `tsc --noEmit` do app: **sem erros**
  (os únicos erros de `tsc` estão em `tools/open-design`, tooling vendorizado à parte).

## Arquitetura por sistema

### Landing / Comercial
- Rotas `(landing)` e portais `(portal)`. Apresentação, aquisição, white-label.
- **Status**: IMPLEMENTED (comercial) · SANDBOX (dados). Sem emissão real.

### GS (Gerenciamento da AR)
- Backoffice em `src/app/gs/*` + `src/app/api/gs/*`. Inspirado em GFCIS/Certifica Minas.
- Modelo em `SUPABASE_SCHEMA_GS.sql` (agentes, ARs, clientes, pedidos, financeiro, tickets,
  contadores, pontos, unidades, usuários, agenda).
- **Status**: IMPLEMENTED · SANDBOX.

### AC Angry (atendimento assistido / fallback)
- Fluxo de videoconferência, revisão e atendimento assistido. `src/app/(angry)/ac`,
  `src/lib/ac-angry`, `src/app/api/{ac,psbio,video,saf,protocol,protocols}`.
- Módulo de segurança robusto: nonces HMAC (one-time, atômicos), sessões AGR, rate limit,
  locker de protocolo atômico (TOCTOU-safe), trilha de auditoria.
- PKI: `verifyJWT` (HS256), fingerprint de chave pública, `verifyCertificateChain` (raízes ICP-Brasil).
- **Status**: IMPLEMENTED · SANDBOX. É fallback da AR Eletrônica, não substituto.

## Pontos fortes (reutilizar na suíte)
- Módulo de segurança bem desenhado e **testado** (41 testes): padrão para RI/GS.
- Nonce HMAC + consumo atômico impede replay (modelo para RI).
- Locker de protocolo com `UPDATE ... WHERE` condicional (sem TOCTOU).
- Adaptadores PSC falham por segurança quando não configurados (após correção do ciclo 1).
- PKI helpers prontos (chain verify, fingerprint).

## Achados de auditoria (priorizados)

### P2 — Race condition no `RateLimiter.check` (path existente)
Em `security.ts`, quando o bucket já existe, o incremento é read-modify-write sem
atomicidade (`select` → `update` sem condição de contagem). Sob concorrência, duas
requisições podem ultrapassar `maxRequests` antes de bloquear. Mitigável via RPC/upsert
atômico no Supabase. **Pendente** (exige DB; documentado, não alterado sem verificação).

### P2 — `psc-auth.ts` usa `secret` como Bearer token
`initiatePush` (Vidaas) envia `Authorization: Bearer ${config.secret}`. O correto para
OAuth2/PSC tipicamente usa Basic auth ou `client_id`+`secret` no body. Sem docs do provedor
(e PENDING_PROVIDER), não alterado — registrado para revisão na contratação.

### P2 — White-label fragmentado entre sistemas
RI usa `VITE_*` (`branding.ts`); Landing/GS/AC Angry usam Tailwind + `.env` próprios.
Risco de divergência visual/marca. Unificar (ver `unificacao.md`).

### P3 — `verifyJWT` compara base64url como UTF-8 (funciona, mas frágil)
`Buffer.from(expectedSig)` e `Buffer.from(signatureB64)` sem encoding interpretam as
strings base64url como UTF-8. Funcionalmente correto (compara os bytes das strings), mas
frágil. Ciclo 2 adiciona **testes de cobertura** (positivo/negativo) para travar o
comportamento; refatoração de decodificação fica para quando houver teste de regressão.

### P3 — Código morto / qualidade
- `base64urlEncode` em `security.ts` está definido mas não usado → removido no ciclo 2.
- 144 erros ESLint em `src` (130 `any`, 57 `unused`, 10 `exhaustive-deps`, 4 `ban-ts-comment`,
  3 `set-state-in-effect`, 1 `immutability`, 1 `incompatible-library`). Maioria qualidade
  (P3), não bugs críticos. `ban-ts-comment` (login) convertido para `@ts-expect-error`.

### P3 — README comercial com claims de conformidade
`README.md` posiciona RSA/ECC/HSM/ABNT/LGPD/ICP-Brasil. Marketing ok, mas deve evitar
afirmar conformidade final sem AC/homologação. Recomendar nota de "sandbox/homologação".

### P3 — Sem `todo.md` local
`ar-eletronica` tem `todo.md` detalhado; `angry-ac` não. Recomendar criar para rastrear
features/integrações da suíte.

## Status regulatório (matriz resumida)
| Requisito | Estado em angry-ac |
|---|---|
| Videoconferência (Art. 2 IN 36/2026) | Fluxo AC Angry implementado (fallback) |
| Termo de Titularidade | Presente em fluxo A3/PKI (ver `api/auth/pki`) |
| Auditoria imutável | Supabase + trigger hash chain (`SUPABASE_SCHEMA*.sql`) — abordagem paralela à do RI |
| Retenção 7 anos | No schema do RI (enforce); no angry-ac depende de política do Supabase |
| Emissão real | PRODUCTION_BLOCKED (sem AC/DPC) |

## Decisão de implementação neste ciclo
- Documentar análise + unificação (`analise-angry-ac.md`, `unificacao.md`).
- Converter `@ts-ignore`→`@ts-expect-error` no login (global `window.lacunaWebPki` não tipado).
- Remover `base64urlEncode` morto.
- Adicionar testes de `verifyJWT` (cobertura, sem mudar comportamento).
- Não alterar RateLimiter/psc-auth (exigem DB/provedor) — registrados como pendências.
