# Feature Specification: Persistência de Protocolos AC Angry

**Feature Branch**: `004-ac-angry-protocolos-persistencia`

**Created**: 2026-07-19

**Status**: Draft

**Input**: User description: "O dashboard do agente AGR usa protocolos mockados (mockData.ts). Persistir protocolos no banco (tabela `protocols`) via Supabase, com fila e visualizador funcionais."

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Fila de Protocolos Real (Priority: P1)

Agente AGR vê fila de protocolos vindos do banco, não de mock.

**Why this priority**: Sem persistência, nada é auditável; é o core do atendimento AGR.

**Independent Test**: Criar protocolo via `NewOrderForm`, recarregar página, confirmar que
persistiu (`api/protocol/update` + tabela `protocols`).

**Acceptance Scenarios**:

1. **Given** agente logado, **When** abre dashboard, **Then** `ProtocolQueue` lista protocolos de `protocols`.
2. **Given** novo pedido, **When** submete, **Then** grava em `protocols` e aparece na fila.

---

### User Story 2 - Visualizador com Dados Reais (Priority: P2)

`ProtocolViewer` (Identity, Documents, SAF, Audit, Video) mostra dados persistidos.

**Why this priority**: Auditoria exige dados reais, não mock.

**Acceptance Scenarios**:

1. **Given** protocolo selecionado, **When** abre viewer, **Then** abas mostram dados do banco.
2. **Given** ação de auditoria, **When** executa, **Then** loga em `audit_logs` (`api/protocols/audit`).

---

### Edge Cases

- `protocols` sem linhas: fila mostra estado empty (não mock "10 protocolos").
- Falha de Supabase: estado error visível, não silencioso.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: Dashboard AGR MUST carregar `ProtocolQueue` de `protocols` (não `MOCK_PROTOCOLS`).
- **FR-002**: `NewOrderForm` MUST persistir via `POST /api/protocol/update`.
- **FR-003**: Ações de viewer MUST registrar em `audit_logs`.
- **FR-004**: Tela MUST respeitar 5 estados (loading/empty/error) do Open Design.

### Key Entities

- **protocols**: tabela já existe (usada por APIs); campo de status/fase.
- **audit_logs**: auditoria das ações do agente.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Protocolo criado persiste após reload (auditável).
- **SC-002**: 100% das ações do agente registradas em auditoria.
- **SC-003**: Fila carrega em < 2s.

## Assumptions

- Tabela `protocols` já existe e é usada por `api/protocol/update`.
- Auth do agente AGR já existe (login A3/Nuvem).
