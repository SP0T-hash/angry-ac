# Feature Specification: CORE-AR - Billing e Fiscal

**Feature Branch**: `009-corear-billing`

**Created**: 2026-07-07

**Status**: Implemented

**Input**: Motor de emissão de notas fiscais e cobrança

## User Scenarios & Testing

### User Story 1 - Emissão de NFS-e (Priority: P1)

Quando um serviço é prestado, o sistema emite automaticamente uma Nota Fiscal de Serviço Eletrônica.

**Why this priority**: Emissão fiscal é obrigação legal.

**Independent Test**: Processar pagamento de serviço e verificar se NFS-e é emitida.

**Acceptance Scenarios**:

1. **Given** um pagamento de serviço é confirmado, **When** o evento é processado, **Then** NFS-e é emitida via Focus NFe
2. **Given** a NFS-e é emitida, **When** o número é retornado, **Then** o pedido é atualizado com número da nota
3. **Given** ocorre erro na emissão, **When** o erro é capturado, **Then** o evento é enfileirado para retry

---

### User Story 2 - Emissão de NF-e (Priority: P1)

Quando um produto é vendido, o sistema emite automaticamente uma Nota Fiscal de Produto Eletrônica.

**Why this priority**: Emissão fiscal é obrigação legal.

**Independent Test**: Processar venda de produto e verificar se NF-e é emitida.

**Acceptance Scenarios**:

1. **Given** uma venda de produto é confirmada, **When** o evento é processado, **Then** NF-e é emitida via Focus NFe
2. **Given** a NF-e é emitida, **When** o número é retornado, **Then** o pedido é atualizado

---

### Edge Cases

- O que acontece quando a Focus NFe está indisponível?
  - Resposta: Evento é enfileirado para retry com backoff exponencial
- Como o sistema lida com erro de validação fiscal?
  - Resposta: Erro é registrado e Nota Fiscal fica pendente

## Requirements

### Functional Requirements

- **FR-001**: Sistema DEVE emitir NFS-e via Focus NFe para serviços
- **FR-002**: Sistema DEVE emitir NF-e via Focus NFe para produtos
- **FR-003**: Sistema DEVE implementar retry com backoff exponencial
- **FR-004**: Sistema DEVE registrar erros de emissão

### Key Entities

- **NotaFiscal**: Nota fiscal emitida
  - Atributos: id, orderId, type (NF-e/NFS-e), number, status, issuedAt

## Success Criteria

### Measurable Outcomes

- **SC-001**: NFS-e é emitida em menos de 10 segundos
- **SC-002**: 100% dos erros são retentados automaticamente
- **SC-003**: 100% das notas são validadas fiscalmente

## Stack Técnica

- **Framework**: .NET 8
- **Barramento**: RabbitMQ
- **API Fiscal**: Focus NFe

## Arquivos Implementados

- `gs.vemapi/CoreAr.Billing/Workers/EmitirNotasFiscaisConsumer.cs`
