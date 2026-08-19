# Mapa de Produtos — VEMAPI Suite

Caminhos reais verificados em 19/08/2026.

| Sistema | Repo | Caminho em disco | Rotas/Áreas principais | Banco | Estado |
|---|---|---|---|---|---|
| Landing / Comercial | angry-ac | `src/app/(landing)`, `src/app/(portal)/portal`, `src/app/(portal)/admin` | home, solução, preços, contato, portais | Supabase/Postgres | IMPLEMENTED · SANDBOX |
| GS | angry-ac | `src/app/gs/*`, `src/app/api/gs/*` | dashboard, pedidos, agentes, ars, clientes, unidades, financeiro, tickets, contadores, pontos, usuários, agenda | Supabase/Postgres (`SUPABASE_SCHEMA_GS.sql`) | IMPLEMENTED · SANDBOX |
| AC Angry | angry-ac | `src/app/(angry)/ac`, `src/app/(angry)/auth`, `src/lib/ac-angry`, `src/app/api/{ac,psbio,video,saf,protocol,protocols}` | videoconferência, protocolos, biometria, assinatura, revisão | Supabase/Postgres (`SUPABASE_SCHEMA*.sql`) | IMPLEMENTED · SANDBOX |
| RI / AR Eletrônica | ar-eletronica | `/Users/vitor/Documents/GitHub/ar-eletronica` | `client/src/pages/{Home,Solution,Operations}.tsx`, `server/routers.ts`, `shared/ar.ts`, `server/ar-engine.ts`, `server/integrations.ts` | Drizzle/MySQL (`drizzle/schema.ts`) | IMPLEMENTED (motor/dossiê) · PRODUCTION_BLOCKED (emissão) |

## Backend .NET (CoreAr / gs.vemapi)
Referência presente em `specs/` e `docs`, mas **ausente em disco** neste ambiente
(`/Users/vitor/repos/gs.vemapi` vazio). Tratar como PENDING: o GS atual consome
Supabase direto do Next.js; o backend .NET é uma evolução planejada, não ativa aqui.

## Integração entre sistemas (contrato)
- `publicId` (RI) ↔ `protocolId`/`id` (AC Angry/GS) via `correlationId`.
- `idempotencyKey` em criação/avaliação (RI já implementa; AC Angry via nonce).
- Status canônicos: `DRAFT → IN_PROGRESS → APPROVED | REJECTED | FALLBACK → ISSUANCE_BLOCKED`.
- Emissão sempre `PRODUCTION_BLOCKED`.
- Retenção mínima 7 anos (RI enforce; Supabase sem trigger equivalente ainda).

## Próximas ações de unificação (backlog)
- Unificar nomenclatura de status entre RI (`identity_applications`) e AC Angry (`protocols`).
- Centralizar catálogo de provedores (RI tem `shared/provider-catalog.ts`; AC Angry tem `src/lib/ac-angry`).
- Compartilhar tokens white-label: RI usa `branding.ts` (VITE_*); Landing/GS/AC Angry usam Tailwind/`.env` próprios — risco de divergência visual.
