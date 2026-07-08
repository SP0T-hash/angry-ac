# Feature Specification: CORE-AR - Motor de Pagamentos

**Feature Branch**: `007-corear-checkout`

**Created**: 2026-07-07

**Status**: Implemented

**Input**: Motor de checkout e processamento de pagamentos com webhooks

## User Scenarios & Testing

### User Story 1 - Criação de Pedido (Priority: P1)

Um cliente cria um pedido de certificado digital e é redirecionado para o gateway de pagamento.

**Why this priority**: Checkout é o início do fluxo de receita.

**Independent Test**: Criar um pedido e verificar se o idempotency key é gerado.

**Acceptance Scenarios**:

1. **Given** um cliente seleciona um certificado, **When** inicia o checkout, **Then** um pedido é criado com idempotency key
2. **Given** o pedido é criado, **When** o cliente é redirecionado, **Then** gateway de pagamento é exibido
3. **Given** o pagamento é processado, **When** o webhook é recebido, **Then** o pedido é atualizado para "paid"

---

### User Story 2 - Processamento de Webhook (Priority: P1)

O sistema recebe e processa webhooks do gateway de pagamento de forma idempotente.

**Why this priority**: Webhooks são a forma confiável de confirmar pagamentos.

**Independent Test**: Enviar webhook duplicado e verificar se é processado apenas uma vez.

**Acceptance Scenarios**:

1. **Given** um webhook transaction.paid é recebido, **When** a assinatura HMAC é validada, **Then** o evento é processado
2. **Given** um webhook com assinatura inválida é recebido, **When** a validação falha, **Then** erro 401 é retornado
3. **Given** um webhook duplicado é recebido, **When** a idempotência é verificada, **Then** o evento é ignorado

---

### User Story 3 - Idempotência (Priority: P1)

O sistema garante que pagamentos não sejam processados duplicadamente.

**Why this priority**: Dupla cobrança é inaceitável em sistema financeiro.

**Independent Test**: Enviar mesmo webhook duas vezes e verificar se apenas um pagamento é processado.

**Acceptance Scenarios**:

1. **Given** um pagamento é processado, **When** o mesmo webhook é enviado novamente, **Then** o sistema retorna 200 OK sem processar
2. **Given** um pagamento está em processamento, **When** outro webhook chega, **Then** o sistema aguarda a conclusão

---

### Edge Cases

- O que acontece quando o gateway de pagamento está indisponível?
  - Resposta: Pedido fica com status "pending" até confirmação manual
- Como o sistema lida com webhook com payload inválido?
  - Resposta: Erro 400 é retornado e evento é logado

## Requirements

### Functional Requirements

- **FR-001**: Sistema DEVE criar pedidos com idempotency key
- **FR-002**: Sistema DEVE validar assinatura HMAC-SHA256 de webhooks
- **FR-003**: Sistema DEVE implementar idempotência via Redis
- **FR-004**: Sistema DEVE publicar evento OrderPaidEvent no RabbitMQ
- **FR-005**: Sistema DEVE retornar 200 OK para webhooks processados

### Key Entities

- **Order**: Pedido de certificado
  - Atributos: id, idempotencyKey, customerId, productId, status, amount

- **WebhookEvent**: Evento recebido do gateway
  - Atributos: id, type, payload, signature, processedAt

## Success Criteria

### Measurable Outcomes

- **SC-001**: Webhooks são processados em menos de 1 segundo
- **SC-002**: 100% dos webhooks duplicados são ignorados
- **SC-003**: 100% das assinaturas HMAC são validadas

## Stack Técnica

- **Framework**: .NET 8
- **Barramento**: RabbitMQ
- **Cache**: Redis (idempotência)
- **Segurança**: HMAC-SHA256

## Arquivos Implementados

- `gs.vemapi/CoreAr.Checkout/Api/Controllers/WebhookGatewayController.cs`
- `gs.vemapi/CoreAr.Checkout/Application/Behaviors/IdempotencyMiddleware.cs`
- `gs.vemapi/CoreAr.Checkout/Security/WebhookSignatureValidator.cs`
