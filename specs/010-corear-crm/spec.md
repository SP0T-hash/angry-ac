# Feature Specification: CORE-AR - CRM e Renovação

**Feature Branch**: `010-corear-crm`

**Created**: 2026-07-07

**Status**: Implemented

**Input**: Gestão de relacionamento com cliente e renovação de certificados

## User Scenarios & Testing

### User Story 1 - Notificação de Vencimento (Priority: P1)

O sistema notifica clientes sobre certificados próximos ao vencimento (D-30, D-15, D-7).

**Why this priority**: Renovação é essencial para receita recorrente.

**Independent Test**: Criar certificado com vencimento em 30 dias e verificar se notificação é enviada.

**Acceptance Scenarios**:

1. **Given** um certificado vence em 30 dias, **When** o cron worker executa, **Then** notificação D-30 é enviada
2. **Given** um certificado vence em 15 dias, **When** o cron worker executa, **Then** notificação D-15 é enviada
3. **Given** um certificado vence em 7 dias, **When** o cron worker executa, **Then** notificação D-7 é enviada

---

### User Story 2 - Envio de Notificações (Priority: P1)

O sistema envia notificações via WhatsApp e email como fallback.

**Why this priority**: Múltiplos canais garantem entrega.

**Independent Test**: Configurar notificação e verificar se é enviada via WhatsApp e email.

**Acceptance Scenarios**:

1. **Given** uma notificação é programada, **When** o canal WhatsApp está disponível, **Then** mensagem é enviada via WhatsApp
2. **Given** WhatsApp falha, **When** o fallback é executado, **Then** email é enviado
3. **Given** notificação é enviada, **When** o registro é salvo, **Then** timestamp e canal são armazenados

---

### Edge Cases

- O que acontece quando o WhatsApp está indisponível?
  - Resposta: Fallback automático para email
- Como o sistema lida com email inválido?
  - Resposta: Erro é registrado e notificação fica pendente

## Requirements

### Functional Requirements

- **FR-001**: Sistema DEVE executar cron worker D-30/D-15/D-7
- **FR-002**: Sistema DEVE enviar notificações via WhatsApp
- **FR-003**: Sistema DEVE implementar fallback para email
- **FR-004**: Sistema DEVE registrar envios com timestamp

### Key Entities

- **CertificateRenewal**: Renovação de certificado
  - Atributos: id, certificateId, notificationType (D-30/D-15/D-7), sentAt, channel

## Success Criteria

### Measurable Outcomes

- **SC-001**: Notificações são enviadas no horário correto (D-30, D-15, D-7)
- **SC-002**: 90% das notificações são entregues via WhatsApp
- **SC-003**: 99% das notificações são entregues (WhatsApp + email)

## Stack Técnica

- **Framework**: .NET 8
- **Background Service**: BackgroundService (CronWorker)
- **WhatsApp API**: Integração externa
- **Email**: SMTP

## Arquivos Implementados

- `gs.vemapi/CoreAr.Crm/Workers/VencimentoCertificadoCronWorker.cs`
- `gs.vemapi/CoreAr.Crm/Workers/NotificacaoClienteConsumer.cs`
- `gs.vemapi/CoreAr.Crm/Infrastructure/Data/Migrations/InitCrmSchema.sql`
