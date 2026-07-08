# Feature Specification: AC ANGRY - Protocol Viewer

**Feature Branch**: `003-ac-angry-protocol-viewer`

**Created**: 2026-07-07

**Status**: Implemented

**Input**: Interface de visualização e gestão de protocolos de atendimento

## User Scenarios & Testing

### User Story 1 - Visualização de Protocolo (Priority: P1)

Um AGR acessa a interface para visualizar os detalhes de um protocolo de atendimento, incluindo identidade do titular, documentos e status.

**Why this priority**: Interface principal para operação do AGR.

**Independent Test**: Acessar um protocolo existente e verificar se todas as abas e dados são exibidos.

**Acceptance Scenarios**:

1. **Given** um AGR seleciona um protocolo, **When** a página carrega, **Then** as abas (Identidade, Documentos, Vídeo, SAF, Auditoria) são exibidas
2. **Given** o protocolo tem dados do titular, **When** o AGR visualiza a aba Identidade, **Then** nome, CPF/CNPJ e email são exibidos
3. **Given** o protocolo tem documentos anexados, **When** o AGR visualiza a aba Documentos, **Then** a lista de documentos é exibida com status

---

### User Story 2 - Gestão de Documentos (Priority: P1)

O AGR pode adicionar, visualizar e gerenciar documentos associados ao protocolo.

**Why this priority**: Documentos são essenciais para o processo de certificação.

**Independent Test**: Adicionar um novo documento e verificar se aparece na lista.

**Acceptance Scenarios**:

1. **Given** o AGR está na aba Documentos, **When** clica em "Novo Documento", **Then** modal de upload é exibido
2. **Given** um documento é selecionado, **When** o upload é concluído, **Then** o documento aparece na lista com status "Pendente"
3. **Given** um documento está pendente, **When** o AGR aprova, **Then** o status muda para "Aprovado"

---

### User Story 3 - Videoconferência (Priority: P2)

O AGR pode iniciar e gerenciar sessões de videoconferência para validação de identidade.

**Why this priority**: Exigência ICP-Brasil para validação presencial/remota.

**Independent Test**: Iniciar uma sessão de videoconferência e verificar se o link é gerado.

**Acceptance Scenarios**:

1. **Given** o AGR está na aba Vídeo, **When** clica em "Iniciar Videoconferência", **Then** uma sala é criada
2. **Given** a sala é criada, **When** o link é gerado, **Then** o AGR pode compartilhar com o titular
3. **Given** a videoconferência é iniciada, **When** o registro é salvo, **Then** o timestamp é armazenado

---

### User Story 4 - Auditoria do Protocolo (Priority: P2)

O AGR pode visualizar o histórico de ações realizadas no protocolo.

**Why this priority**: Transparência e conformidade regulatória.

**Independent Test**: Visualizar o log de auditoria e verificar se todas as ações estão registradas.

**Acceptance Scenarios**:

1. **Given** o AGR está na aba Auditoria, **When** a página carrega, **Then** o histórico de ações é exibido em ordem cronológica
2. **Given** uma ação foi executada, **When** o AGR visualiza o log, **Then** timestamp, ação e responsável são exibidos

---

### Edge Cases

- O que acontece quando o protocolo não tem documentos?
  - Resposta: Mensagem "Nenhum documento encontrado" é exibida
- Como o sistema lida com upload de arquivo inválido?
  - Resposta: Validação de tipo e tamanho impede o upload
- O que acontece quando a videoconferência falha?
  - Resposta: Mensagem de erro e opção de retry

## Requirements

### Functional Requirements

- **FR-001**: Sistema DEVE exibir 5 abas de visualização do protocolo
- **FR-002**: Sistema DEVE permitir upload de documentos
- **FR-003**: Sistema DEVE gerenciar status de documentos
- **FR-004**: Sistema DEVE criar salas de videoconferência
- **FR-005**: Sistema DEVE registrar auditoria de todas ações
- **FR-006**: Sistema DEVE exibir histórico em ordem cronológica

### Key Entities

- **Protocol**: Sessão de atendimento
  - Atributos: id, agrId, titularName, status, createdAt

- **Document**: Documento associado ao protocolo
  - Atributos: id, protocolId, name, type, status, url

- **VideoSession**: Sessão de videoconferência
  - Atributos: id, protocolId, startedAt, endedAt, roomUrl

## Success Criteria

### Measurable Outcomes

- **SC-001**: Interface carrega em menos de 2 segundos
- **SC-002**: Upload de documentos funciona em 100% dos dispositivos
- **SC-003**: Videoconferência inicia em menos de 5 segundos
- **SC-004**: 100% das ações são auditadas

## Stack Técnica

- **Framework**: Next.js 16 (App Router)
- **UI**: Tailwind CSS + Framer Motion
- **Componentes**: shadcn/ui pattern

## Arquivos Implementados

- `src/components/ac-angry/ProtocolViewer.tsx` - Componente principal
- `src/components/ac-angry/protocol-viewer/IdentityTab.tsx` - Aba de identidade
- `src/components/ac-angry/protocol-viewer/DocumentsTab.tsx` - Aba de documentos
- `src/components/ac-angry/protocol-viewer/VideoConferenceTab.tsx` - Aba de videoconferência
- `src/components/ac-angry/protocol-viewer/AuditTab.tsx` - Aba de auditoria
- `src/components/ac-angry/protocol-viewer/SafTab.tsx` - Aba SAF
- `src/components/ac-angry/protocol-viewer/modals/` - Modais
