# Feature Specification: CORE-AR - Livro Razão e Split

**Feature Branch**: `008-corear-ledger`

**Created**: 2026-07-07

**Status**: Implemented

**Input**: Motor de partidas dobradas com split de comissionamento

## User Scenarios & Testing

### User Story 1 - Registro de Transação (Priority: P1)

Quando um pagamento é confirmado, o sistema registra entradas no livro razão com split entre AGR, parceiro e AR.

**Why this priority**: Core financeiro do sistema.

**Independent Test**: Processar pagamento e verificar se entradas são criadas com conciliação zero.

**Acceptance Scenarios**:

1. **Given** um evento OrderPaidEvent é recebido, **When** o motor de split é executado, **Then** entradas de crédito e débito são criadas
2. **Given** as entradas são criadas, **When** a conciliação é verificada, **Then** créditos - débitos = 0
3. **Given** um split é calculado, **When** os valores são registrados, **Then** apenas `decimal` é usado (nunca float/double)

---

### User Story 2 - Imutabilidade do Ledger (Priority: P1)

O livro razão é imutável—não permite UPDATE ou DELETE.

**Why this priority**: Integridade financeira é não-negociável.

**Independent Test**: Tentar atualizar/excluir uma entrada e verificar se é bloqueado.

**Acceptance Scenarios**:

1. **Given** uma entrada é registrada, **When** tenta-se atualizar, **Then** erro de permissão é retornado
2. **Given** uma entrada é registrada, **When** tenta-se excluir, **Then** erro de permissão é retornado
3. **Given** o PostgreSQL está configurado, **When** REVOKE UPDATE/DELETE é aplicado, **Then** operações são bloqueadas no nível do banco

---

### User Story 3 - Motor de Split (Priority: P1)

O sistema calcula automaticamente a distribuição de receita entre AGR, parceiro e AR.

**Why this priority**: Split de comissão é o diferencial competitivo.

**Independent Test**: Configurar contrato de comissionamento e verificar se o split é calculado corretamente.

**Acceptance Scenarios**:

1. **Given** um contrato de comissionamento existe, **When** pagamento é processado, **Then** split é calculado conforme porcentagens
2. **Given** o split é calculado, **When** valores são distribuídos, **Then** totalizações batem com valor original
3. **Given** há erro no cálculo, **When** conciliação é verificada, **Then** discrepância é sinalizada

---

### Edge Cases

- O que acontece quando o contrato de comissionamento não existe?
  - Resposta: Erro é registrado e pagamento fica pendente de conciliação
- Como o sistema lida com valores negativos?
  - Resposta: Estornos são registrados como entradas negativas

## Requirements

### Functional Requirements

- **FR-001**: Sistema DEVE registrar entradas no livro razão via partidas dobradas
- **FR-002**: Sistema DEVE garantir conciliação zero (créditos - débitos = 0)
- **FR-003**: Sistema DEVE usar apenas decimal para valores monetários
- **FR-004**: Sistema DEVE bloquear UPDATE/DELETE no ledger
- **FR-005**: Sistema DEVE calcular split conforme contratos
- **FR-006**: Sistema DEVE registrar estornos como entradas negativas

### Key Entities

- **LedgerEntry**: Entrada no livro razão
  - Atributos: id, orderId, accountType (CREDIT/DEBIT), amount, currency, description

- **ContratoComissionamento**: Contrato de split
  - Atributos: id, agrId, partnerId, agrPercentage, partnerPercentage, arPercentage

## Success Criteria

### Measurable Outcomes

- **SC-001**: Ledger registra transação em menos de 500ms
- **SC-002**: 100% das transações conciliam em zero
- **SC-003**: 100% das tentativas de UPDATE/DELETE são bloqueadas

## Stack Técnica

- **Framework**: .NET 8
- **Banco**: PostgreSQL 16 (RLS)
- **Moeda**: decimal (C#) / NUMERIC(19,4) (PostgreSQL)

## Arquivos Implementados

- `gs.vemapi/CoreAr.Ledger/Domain/Entities/LedgerEntry.cs`
- `gs.vemapi/CoreAr.Ledger/Domain/Entities/ContratoComissionamento.cs`
- `gs.vemapi/CoreAr.Ledger/Domain/Services/SplitComissionamentoService.cs`
- `gs.vemapi/CoreAr.Ledger/Infrastructure/Data/Migrations/InitLedgerSchema.sql`
- `gs.vemapi/CoreAr.Ledger.Tests/SplitComissionamentoTests.cs`
