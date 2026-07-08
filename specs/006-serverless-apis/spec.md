# Feature Specification: APIs Serverless

**Feature Branch**: `006-serverless-apis`

**Created**: 2026-07-07

**Status**: Implemented

**Input**: APIs serverless para consultas e integrações

## User Scenarios & Testing

### User Story 1 - Consulta CNPJ (Priority: P1)

Um usuário consulta dados de uma empresa通过 CNPJ.

**Why this priority**: Consulta de CNPJ é essencial para validação de pessoas jurídicas.

**Independent Test**: Enviar CNPJ válido e verificar se os dados são retornados.

**Acceptance Scenarios**:

1. **Given** um usuário envia um CNPJ válido, **When** a consulta é executada, **Then** razão social, endereço e situação são retornados
2. **Given** um usuário envia um CNPJ inválido, **When** a consulta é executada, **Then** erro 400 é retornado
3. **Given** a API está indisponível, **When** a consulta é executada, **Then** erro 503 é retornado

---

### User Story 2 - Consulta CPF (Priority: P1)

Um usuário consulta dados de uma pessoa física通过 CPF.

**Why this priority**: Consulta de CPF é essencial para validação de titulares.

**Independent Test**: Enviar CPF válido e verificar se os dados são retornados.

**Acceptance Scenarios**:

1. **Given** um usuário envia um CPF válido, **When** a consulta é executada, **Then** nome e situação são retornados
2. **Given** um usuário envia um CPF inválido, **When** a consulta é executada, **Then** erro 400 é retornado

---

### User Story 3 - API de Biometria (Priority: P2)

Integração com serviço de validação biométrica.

**Why this priority**: Validação biométrica é exigida para certificados A3.

**Independent Test**: Enviar dados biométricos e verificar se a validação é retornada.

**Acceptance Scenarios**:

1. **Given** dados biométricos são enviados, **When** a validação é executada, **Then** resultado (match/nomatch) é retornado
2. **Given** dados biométricos são inválidos, **When** a validação é executada, **Then** erro é retornado

---

### Edge Cases

- O que acontece quando a API externa está indisponível?
  - Resposta: Timeout configurável e retry automático
- Como o sistema lida com rate limiting de APIs externas?
  - Resposta: Fila de requests com backoff exponencial

## Requirements

### Functional Requirements

- **FR-001**: Sistema DEVE consultar CNPJ via API externa
- **FR-002**: Sistema DEVE consultar CPF via API externa
- **FR-003**: Sistema DEVE validar biometria via API externa
- **FR-004**: Sistema DEVE tratar erros de APIs externas
- **FR-005**: Sistema DEVE implementar timeout configurável

### Key Entities

- **CNPJData**: Dados da empresa
  - Atributos: cnpj, razaoSocial, endereco, situacao

- **CPFData**: Dados da pessoa física
  - Atributos: cpf, nome, situacao

- **BiometricResult**: Resultado da validação biométrica
  - Atributos: match, confidence, timestamp

## Success Criteria

### Measurable Outcomes

- **SC-001**: Consulta CNPJ retorna em menos de 2 segundos
- **SC-002**: Consulta CPF retorna em menos de 1 segundo
- **SC-003**: Validação biométrica retorna em menos de 5 segundos

## Stack Técnica

- **Framework**: Next.js 16 (App Router)
- **HTTP Client**: fetch nativo
- **Timeout**: AbortController

## Arquivos Implementados

- `src/app/api/cnpj/route.ts` - API de consulta CNPJ
- `src/app/api/cpf/route.ts` - API de consulta CPF
- `src/app/api/psbio/route.ts` - API de biometria
- `src/app/api/saf/route.ts` - API SAF
- `src/app/api/video/route.ts` - API de videoconferência
- `src/app/api/protocol/update/route.ts` - API de atualização de protocolo
- `src/app/api/protocols/audit/route.ts` - API de auditoria
