# Implementation Plan: Roadmap ANGRY-AC (consolidação spec-driven)

**Branch**: `000-roadmap` | **Date**: 2026-07-19 | **Spec**: specs/001..005

**Input**: Mapeamento do projeto + specs 001-005 criadas a partir da constituição
(`.specify/memory/constitution.md`, Princípio I = separação de áreas, III = Open Design).

## Summary

O projeto tem 3 áreas desalinhadas: Landing (estática, travada), GS (maduro em CRUD,
incompleto em dashboard/financeiro), AC Angry (protótipo AGR mockado, sem persistência
nem portais). Este plan consolida as specs 002-005 em fases por prioridade, respeitando
a separação de áreas e o design system.

## Technical Context

**Language/Version**: TypeScript / Next.js 16 (App Router), React 19
**Primary Dependencies**: Supabase (service-role admin memoizado), Tailwind 3, Tremor, Framer Motion (landing)
**Storage**: PostgreSQL via Supabase (`gs_*`, `protocols`, `audit_logs`, `issued_certificates`, `leads`)
**Testing**: vitest (configurado); typecheck `tsc --noEmit`; lint eslint
**Target Platform**: Web (SSR/CSR)
**Performance Goals**: telas < 2s servidor quente; login < 2s
**Constraints**: não mexer em Landing sem ordem (🔒 travada); secrets em `.env.*`
**Scale/Scope**: 3 áreas, ~20 telas

## Constitution Check

- [x] Princípio I (separação): cada spec afeta só sua área (GS=002/003, AC=004/005).
- [x] Princípio III (Open Design): todos os specs exigem 5 estados + accent emerald.
- [x] Princípio IV (dev/prod): specs testáveis em dev (3001) antes de prod (3000).
- [x] Princípio II (spec-driven): specs 001-005 criadas antes de implementar.

## Fases (por prioridade)

### Fase 0 — GS Dashboard KPIs Reais (spec 002) [P1]
- Substituir `kpis` hardcoded em `GSDashboardClient.tsx` por `COUNT(*)` reais.
- Adicionar estados loading/empty/error.
- Tabelas: `gs_ars`, `gs_unidades`, `gs_pedidos`, soma `gs_cobrancas`.

### Fase 1 — AC Angry Persistência (spec 004) [P1]
- `ProtocolQueue` ler de `protocols` (hoje `MOCK_PROTOCOLS`).
- `NewOrderForm` → `POST /api/protocol/update`.
- Remover dependência de `lib/ac-angry/mockData.ts` na UI.

### Fase 2 — GS Financeiro Completo (spec 003) [P2]
- CRUD de `gs_cobrancas` + `gs_assinaturas` no `/api/gs/mutate` whitelist.
- Tela de assinaturas + split Asaas opcional.
- Resolver FK órfã `gs_contadores`.

### Fase 3 — AC Angry Portais (spec 005) [P2/P3]
- Integrar `admin/*` órfãos em `/ac/admin`.
- Portal cliente titular (`/ac/cliente`).
- Remover `ProtocolViewer.bak.tsx`.

## Project Structure (afetada)

```text
src/app/gs/dashboard/GSDashboardClient.tsx   # spec 002
src/app/gs/financeiro/page.tsx               # spec 003
src/app/(angry)/ac/agent/dashboard/         # spec 004 (des-mock)
src/app/(angry)/ac/admin/                    # spec 005 (novo)
src/components/ac-angry/admin/               # spec 005 (integrar)
specs/002..005/                              # specs criadas
```

## Next

Executar `/speckit-tasks` por spec para gerar `tasks.md` acionáveis antes de implementar.
