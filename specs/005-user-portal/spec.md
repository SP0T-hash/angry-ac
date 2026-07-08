# Feature Specification: Portal do Usuário

**Feature Branch**: `005-user-portal`

**Created**: 2026-07-07

**Status**: Implemented

**Input**: Portal para gestão de certificados e pedidos pelo titular

## User Scenarios & Testing

### User Story 1 - Login do Usuário (Priority: P1)

Um titular acessa o portal e se autentica para visualizar seus certificados.

**Why this priority**: Autenticação é o gateway para todas funcionalidades.

**Independent Test**: Realizar login com credenciais válidas e verificar se o redirecionamento funciona.

**Acceptance Scenarios**:

1. **Given** um titular acessa a página de login, **When** insere credenciais válidas, **Then** é redirecionado para o dashboard
2. **Given** um titular insere credenciais inválidas, **When** tenta fazer login, **Then** mensagem de erro é exibida
3. **Given** um titular esqueceu a senha, **When** clica em "Esqueci a senha", **Then** fluxo de recuperação é iniciado

---

### User Story 2 - Dashboard do Usuário (Priority: P1)

O titular visualiza seus certificados, status e ações disponíveis.

**Why this priority**: Dashboard é a tela principal do usuário.

**Independent Test**: Acessar o dashboard e verificar se os certificados são exibidos.

**Acceptance Scenarios**:

1. **Given** o titular está autenticado, **When** acessa o dashboard, **Then** lista de certificados é exibida
2. **Given** o titular tem certificados ativos, **When** visualiza a lista, **Then** status "Ativo" é exibido em verde
3. **Given** o titular tem certificados expirados, **When** visualiza a lista, **Then** status "Expirado" é exibido em vermelho

---

### User Story 3 - Detalhes do Certificado (Priority: P2)

O titular pode visualizar detalhes completos de um certificado específico.

**Why this priority**: Detalhes são necessários para uso do certificado.

**Independent Test**: Selecionar um certificado e verificar se todos os dados são exibidos.

**Acceptance Scenarios**:

1. **Given** o titular seleciona um certificado, **When** a página carrega, **Then** serial number, validade e status são exibidos
2. **Given** o certificado está ativo, **When** o titular visualiza, **Then** opção de download do PEM é exibida
3. **Given** o certificado está expirado, **When** o titular visualiza, **Then** opção de renovação é exibida

---

### Edge Cases

- O que acontece quando o titular não tem certificados?
  - Resposta: Mensagem "Nenhum certificado encontrado" é exibida
- Como o sistema lida com certificado revogado?
  - Resposta: Status "Revogado" é exibido em amarelo

## Requirements

### Functional Requirements

- **FR-001**: Sistema DEVE permitir autenticação do titular
- **FR-002**: Sistema DEVE exibir lista de certificados do titular
- **FR-003**: Sistema DEVE exibir detalhes de cada certificado
- **FR-004**: Sistema DEVE permitir download do PEM
- **FR-005**: Sistema DEVE indicar status de cada certificado

### Key Entities

- **UserCertificate**: Certificado do titular
  - Atributos: id, serialNumber, product, status, validUntil

## Success Criteria

### Measurable Outcomes

- **SC-001**: Login funciona em menos de 2 segundos
- **SC-002**: Dashboard carrega certificados em menos de 1 segundo
- **SC-003**: Download do PEM inicia imediatamente

## Stack Técnica

- **Framework**: Next.js 16 (App Router)
- **Auth**: Supabase Auth
- **UI**: Tailwind CSS

## Arquivos Implementados

- `src/app/(portal)/portal/login/page.tsx` - Página de login
- `src/app/(portal)/portal/dashboard/page.tsx` - Dashboard do usuário
- `src/app/(portal)/layout.tsx` - Layout do portal
