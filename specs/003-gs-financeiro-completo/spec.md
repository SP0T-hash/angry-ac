# Feature Specification: Módulo Financeiro GS Completo

**Feature Branch**: `003-gs-financeiro-completo`

**Created**: 2026-07-19

**Status**: Draft

**Input**: User description: "Financeiro do GS só tem CRUD de Planos e lista read-only de Cobranças. Falta CRUD de cobranças/faturas/assinaturas e integração Asaas de billing/split."

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Gestão de Cobranças (Priority: P1)

Operador financeiro cria/edita/exclui cobranças (`gs_cobranças`) vinculadas a clientes/assinaturas.

**Why this priority**: Hoje cobranças são read-only; não dá para registrar pagamentos.

**Independent Test**: Abrir `/gs/financeiro`, criar uma cobrança, editar valor, excluir; confirmar
persistência via `/api/gs/mutate`.

**Acceptance Scenarios**:

1. **Given** tela financeiro, **When** clica "Novo" em Cobranças, **Then** modal cria registro em `gs_cobrancas`.
2. **Given** cobrança existente, **When** marca como paga, **Then** status atualiza e receita do dashboard reflete.

---

### User Story 2 - Assinaturas e Split Asaas (Priority: P2)

Clientes têm assinaturas (`gs_assinaturas`) com split de pagamento GS/AR via Asaas.

**Why this priority**: Tipos já têm `asaas_subscription_id`, `split_percent_gs/ar` mas sem código.

**Independent Test**: Criar assinatura via Asaas (se `ASAAS_API_KEY` configurada) e registrar split.

**Acceptance Scenarios**:

1. **Given** `ASAAS_API_KEY` presente, **When** cria assinatura, **Then** chamada Asaas retorna id persistido.
2. **Given** sem key, **When** cria assinatura, **Then** modo mock não bloqueia (como reCAPTCHA).

---

### User Story 3 - Módulo Contador (Priority: P3)

Nível CONTADOR (`contador_id` em `gs_assinaturas`) tem carteira/visor próprio.

**Why this priority**: Definido em tipos mas sem rota; escopo futuro.

**Acceptance Scenarios**:

1. **Given** usuário nível CONTADOR, **When** acessa `/gs/contador`, **Then** vê suas assinaturas/cobranças.

---

### Edge Cases

- `gs_assinaturas.contador_id` referencia `gs_contadores(id)` que NÃO EXISTE no schema (FK órfã).
- Asaas ausente: não quebrar fluxo de cobrança local.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: Financeiro MUST permitir CRUD de `gs_cobrancas` (hoje read-only).
- **FR-002**: Financeiro MUST permitir CRUD de `gs_assinaturas` (nova tela).
- **FR-003**: Integração Asaas MUST ser opcional (key em `.env`); ausente → mock.
- **FR-004**: Tabela `gs_cobrancas` MUST entrar na whitelist de `/api/gs/mutate`.
- **FR-005**: FK `gs_contadores` MUST ser criada ou `contador_id` tornado opcional.

### Key Entities

- **gs_cobrancas**: valor, status, cliente_id, assinatura_id, vencimento.
- **gs_assinaturas**: cliente, plano, split_percent_gs/ar, asaas_subscription_id.
- **gs_contadores**: (ausente) carteira do contador.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Operador consegue registrar pagamento de cobrança em < 30s.
- **SC-002**: 100% das telas financeiras com os 5 estados (Open Design).
- **SC-003**: Split Asaas funcional quando key presente (testável via sandbox).

## Assumptions

- Asaas em sandbox (`ASAAS_ENV=sandbox`) para dev.
- `gs_cobrancas` já existe no schema; só falta UI de mutação.
