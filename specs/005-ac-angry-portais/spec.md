# Feature Specification: Portais AC Angry (Admin + Cliente)

**Feature Branch**: `005-ac-angry-portais`

**Created**: 2026-07-19

**Status**: Draft

**Input**: User description: "Componentes admin (AgenteMonitor, KpiGrid, SecurityAuditTable) e portal de cliente estão órfãos/não implementados. Criar portal admin do agente e portal de cliente titular."

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Portal Admin do Agente (Priority: P1)

Supervisor vê monitor de agentes, KPIs e auditoria de segurança.

**Why this priority**: Componentes `admin/*` já existem mas não são renderizados em nenhuma rota.

**Independent Test**: Acessar `/ac/admin` e ver `AgenteMonitor`, `KpiGrid`, `SecurityAuditTable`
integrados e com dados reais (não órfãos).

**Acceptance Scenarios**:

1. **Given** supervisor logado, **When** abre `/ac/admin`, **Then** vê painel com KPIs e auditoria.
2. **Given** dados, **When** renderiza, **Then** componentes `admin/*` integrados (não órfãos).

---

### User Story 2 - Portal do Cliente Titular (Priority: P2)

Cliente titular acompanha seus certificados, protocolos e boletos.

**Why this priority**: Fechamento do ciclo VEMAPI (landing → certificado → portal do cliente).

**Independent Test**: Cliente loga e vê seus certificados emitidos e protocolos vinculados.

**Acceptance Scenarios**:

1. **Given** cliente logado, **When** abre portal, **Then** lista seus certificados/protocolos.
2. **Given** cobrança, **When** abre, **Then** vê boleto/status (reusa `gs_cobrancas`).

---

### Edge Cases

- `ProtocolViewer.bak.tsx` deve ser removido (backup obsoleto).
- Componentes `admin/*` podem precisar de props/contexto que hoje não têm.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: Portal admin MUST integrar `AgenteMonitor`, `KpiGrid`, `SecurityAuditTable`.
- **FR-002**: Portal cliente MUST listar certificados/protocolos do titular.
- **FR-003**: Ambos MUST usar design system Open Design (accent emerald, 5 estados).
- **FR-004**: Arquivo `ProtocolViewer.bak.tsx` MUST ser removido.

### Key Entities

- **AgenteMonitor/KpiGrid/SecurityAuditTable**: componentes admin órfãos.
- **Cliente Titular**: usuário final do VEMAPI.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: 0 componentes órfãos em `components/ac-angry/admin/`.
- **SC-002**: Portal cliente acessível e funcional para titular.
- **SC-003**: Consistência visual com GS e landing (accent emerald).

## Assumptions

- Auth de cliente titular reusa Supabase auth (como portal existente em `(portal)`).
- Dados de certificados vêm de `issued_certificates`.
