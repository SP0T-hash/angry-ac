# Feature Specification: KPIs Reais no Dashboard GS

**Feature Branch**: `002-gs-dashboard-kpis-reais`

**Created**: 2026-07-19

**Status**: Draft

**Input**: User description: "O dashboard do GS mostra KPIs hardcoded (12 ARs, 48 unidades, 326 pedidos, R$84k). Substituir por contadores reais do banco via Supabase."

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Operador vê métricas reais (Priority: P1)

O operador AC_ADMIN/AR abre o dashboard e vê contagens reais das entidades GS.

**Why this priority**: KPIs falsos induzem decisões erradas; é a tela inicial do módulo.

**Independent Test**: Logar como admin e confirmar que os números batem com `COUNT(*)`
das tabelas `gs_ars`, `gs_unidades`, `gs_pedidos` e soma de receita de `gs_cobrancas`.

**Acceptance Scenarios**:

1. **Given** usuário logado, **When** abre `/gs/dashboard`, **Then** KPIs refletem contagens reais do banco.
2. **Given** nenhuma linha, **When** abre dashboard, **Then** KPIs mostram 0 (estado empty, não mock).

---

### User Story 2 - Cards com estados corretos (Priority: P2)

Os cards de KPI respeitam o padrão Open Design (5 estados, accent único).

**Why this priority**: Consistência visual com o resto do GS.

**Acceptance Scenarios**:

1. **Given** falha de fetch, **When** dashboard renderiza, **Then** estado error visível.
2. **Given** dados ok, **When** renderiza, **Then** cards em emerald/indigo semântico (indigo só para status).

---

### Edge Cases

- Tabela inexistente/sem permissão: tratar como 0 e não quebrar o dashboard.
- Usuário AR (não admin): KPIs filtrados por sua AR? (verificar escopo de multi-tenant).

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: Dashboard MUST buscar contagens reais de `gs_ars`, `gs_unidades`, `gs_pedidos`, `gs_clientes`.
- **FR-002**: Receita MUST somar `valor` de `gs_cobrancas` com status pago no mês corrente.
- **FR-003**: Dashboard MUST renderizar estados loading/empty/error.
- **FR-004**: Cliente Supabase MUST ser o admin memoizado (já existe `getSupabaseAdmin`).

### Key Entities

- **KPI**: contagem + meta opcional por entidade GS.
- **gs_cobrancas**: fonte de receita (campo `valor`, `status`, `criado_em`).

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: KPIs do dashboard batem com consulta SQL de auditoria em ±0.
- **SC-002**: Dashboard carrega em < 2s em servidor quente.
- **SC-003**: 100% dos estados (loading/empty/error/populated) cobertos.

## Assumptions

- Multi-tenant: admin vê tudo; AR vê só sua AR (confirmar com usuário).
- `gs_cobrancas.valor` é numérico em centavos ou reais (verificar tipo).
