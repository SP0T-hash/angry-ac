# Feature Specification: AC ANGRY - Motor de Certificação Digital

**Feature Branch**: `002-ac-angry-certification`

**Created**: 2026-07-07

**Status**: Implemented

**Input**: Motor de emissão e gestão de certificados digitais ICP-Brasil

## User Scenarios & Testing

### User Story 1 - Emissão de Certificado Digital (Priority: P1)

Um Agente de Registro (AGR) solicita a emissão de um certificado digital para um titular, passando por validação de identidade e assinatura criptográfica.

**Why this priority**: É a funcionalidade principal do sistema e razão de existir da plataforma.

**Independent Test**: Simular fluxo completo de emissão com CSR válido e verificar se o certificado é gerado corretamente.

**Acceptance Scenarios**:

1. **Given** um AGR está autenticado, **When** envia um CSR (Certificate Signing Request) válido, **Then** o sistema valida a assinatura do CSR e emite o certificado
2. **Given** o CSR é válido, **When** o certificado é emitido, **Then** o serial number é gerado aleatoriamente e a validade é calculada (1 ano A1, 3 anos A3)
3. **Given** o certificado é emitido, **When** a resposta é retornada, **Then** o PEM do certificado, CA chain e metadados são retornados
4. **Given** ocorre um erro na emissão, **When** o erro é capturado, **Then** o erro é registrado no audit log com severidade ERROR

---

### User Story 2 - Validação de Nonce Anti-Replay (Priority: P1)

O sistema valida nonces de uso único para prevenir ataques de replay em operações críticas.

**Why this priority**: Segurança é fundamental para certificados digitais com validade jurídica.

**Independent Test**: Tentar reutilizar um nonce já consumido e verificar se a requisição é rejeitada.

**Acceptance Scenarios**:

1. **Given** um nonce é gerado para operação SIGN, **When** a operação é executada, **Then** o nonce é consumido e não pode ser reutilizado
2. **Given** um nonce expirado é enviado, **When** o sistema valida, **Then** erro de nonce expirado é retornado
3. **Given** um nonce com assinatura HMAC inválida é enviado, **When** o sistema valida, **Then** erro de nonce malformado é retornado

---

### User Story 3 - Rate Limiting (Priority: P1)

O sistema controla a taxa de requisições para prevenir ataques de força bruta.

**Why this priority**: Protege o sistema contra abuso e garante disponibilidade.

**Independent Test**: Enviar múltiplas requisições acima do limite e verificar se são bloqueadas.

**Acceptance Scenarios**:

1. **Given** um usuário envia requisições dentro do limite, **When** as requisições são processadas, **Then** todas são aceitas
2. **Given** um usuário excede o limite de requisições, **When** tenta enviar outra requisição, **Then** erro 429 (Too Many Requests) é retornado
3. **Given** o limite é atingido, **When** o tempo de janela expira, **Then** o contador é resetado

---

### User Story 4 - Trilha de Auditoria (Priority: P1)

Todas as operações críticas são registradas em log imutável para conformidade regulatória.

**Why this priority**: Exigência legal para certificados digitais (ICP-Brasil, LGPD).

**Independent Test**: Executar operações e verificar se os logs são gerados corretamente.

**Acceptance Scenarios**:

1. **Given** uma operação é executada, **When** a operação é concluída, **Then** um log de auditoria é gerado com timestamp, AGR ID, IP e payload
2. **Given** ocorre um erro, **When** o erro é capturado, **Then** o log é registrado com severidade ERROR
3. **Given** um log é gerado, **When** tenta-se modificar o log, **Then** o sistema impede a modificação (imutabilidade)

---

### User Story 5 - Gestão de Sessões AGR (Priority: P2)

O sistema gerencia sessões autenticadas para Agentes de Registro com controle de concorrência.

**Why this priority**: Controle de acesso é essencial para operações de certificação.

**Independent Test**: Autenticar um AGR e verificar se a sessão é criada e gerenciada corretamente.

**Acceptance Scenarios**:

1. **Given** um AGR se autentica, **When** a sessão é criada, **Then** um token de sessão é gerado com TTL configurável
2. **Given** um AGR está com sessão ativa, **When** executa operações, **Then** a sessão é validada em cada requisição
3. **Given** a sessão expira, **When** o AGR tenta acessar, **Then** é necessário re-autenticar

---

### Edge Cases

- O que acontece quando o Supabase está indisponível durante a geração de nonce?
  - Resposta: Erro 500 é retornado e operação é bloqueada
- Como o sistema lida com CSR com chave pública inválida?
  - Resposta: Erro "Assinatura do CSR inválida" é retornado
- O que acontece quando a CA raiz não está inicializada?
  - Resposta: Inicialização lazy é executada na primeira requisição
- Como o sistema lida com concorrência de emissão simultânea?
  - Resposta: ProtocolLocker controla acesso exclusivo

## Requirements

### Functional Requirements

- **FR-001**: Sistema DEVE validar assinatura de CSR antes de emitir certificado
- **FR-002**: Sistema DEVE gerar serial number aleatório para cada certificado
- **FR-003**: Sistema DEVE calcular validade baseada no produto (A1=1 ano, A3=3 anos)
- **FR-004**: Sistema DEVE assinar certificado com chave privada da CA
- **FR-005**: Sistema DEVE retornar PEM do certificado e CA chain
- **FR-006**: Sistema DEVE validar nonces HMAC com TTL configurável
- **FR-007**: Sistema DEVE consumir nonces (one-time use)
- **FR-008**: Sistema DEVE controlar taxa de requisições por scope
- **FR-009**: Sistema DEVE registrar logs de auditoria para todas operações
- **FR-010**: Sistema DEVE manter imutabilidade dos logs
- **FR-011**: Sistema DEVE inicializar CA de forma lazy
- **FR-012**: Sistema DEVE suportar RSA 2048/4096 bits
- **FR-013**: Sistema DEVE usar SHA-256 para hashing

### Key Entities

- **Certificate**: Certificado digital emitido
  - Atributos: serialNumber, publicKey, validity (notBefore, notAfter), subject, issuer
  - Relacionamento: Emitido por CA, assinado por AGR

- **Nonce**: Token de uso único anti-replay
  - Atributos: nonce, scope, protocolId, agrId, expiresAt
  - Scopes: AUTH, SIGN, BIOMETRY, EMIT

- **AuditLog**: Registro imutável de operação
  - Atributos: eventType, agrId, protocolId, ipAddress, payload, severity, timestamp

- **Session**: Sessão autenticada do AGR
  - Atributos: agrId, token, expiresAt, ipAddress

## Success Criteria

### Measurable Outcomes

- **SC-001**: Certificado é emitido em menos de 5 segundos
- **SC-002**: 100% dos nonces expirados são rejeitados
- **SC-003**: Rate limiting bloqueia 100% das requisições acima do limite
- **SC-004**: 100% das operações críticas são auditadas
- **SC-005**: CA raiz é inicializada em menos de 2 segundos

## Assumptions

- A CA raiz é gerada em memória (não persistida em produção)
- Supabase está configurado com service role key
- Chave HMAC para nonces está em variável de ambiente
- Em produção, CA deve estar em HSM

## Stack Técnica

- **Framework**: Next.js 16 (App Router)
- **Criptografia**: node-forge (RSA, SHA-256)
- **Banco de Dados**: Supabase (PostgreSQL)
- **Segurança**: HMAC-SHA256, Rate Limiting, Audit Trail

## Arquivos Implementados

- `src/app/api/ac/sign/route.ts` - API de assinatura de certificados
- `src/app/api/ac/persist-certificate/route.ts` - Persistência de certificados
- `src/lib/ac-angry/security.ts` - Módulos de segurança (NonceManager, SessionManager, RateLimiter, AuditLogger)
- `src/lib/ac-angry/pki.ts` - Operações PKI
- `src/lib/ac-angry/api-middleware.ts` - Middleware de autenticação
- `src/lib/ac-angry/supabase-admin.ts` - Cliente Supabase admin
