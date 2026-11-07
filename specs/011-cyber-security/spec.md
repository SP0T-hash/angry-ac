# Feature Specification: Cyber Security

**Feature Branch**: `011-cyber-security`

**Created**: 2026-07-07

**Status**: Contenções parciais implementadas; auditoria e homologação pendentes

**Input**: Soluções de segurança digital para proteção do sistema

## User Scenarios & Testing

### User Story 1 - Proteção de Endpoints (Priority: P1)

O sistema deve proteger todos os endpoints contra ataques conhecidos (OWASP Top 10).

**Why this priority**: Segurança é fundamental para sistema de certificação.

**Independent Test**: Executar testes de penetração e verificar se ataques são bloqueados.

**Acceptance Scenarios**:

1. **Given** um ataque de SQL Injection é tentado, **When** a requisição é processada, **Then** o ataque é bloqueado
2. **Given** um ataque de XSS é tentado, **When** a requisição é processada, **Then** o script é sanitizado
3. **Given** um ataque de CSRF é tentado, **When** a requisição é processada, **Then** o token CSRF é validado

---

### User Story 2 - Monitoramento de Ameaças (Priority: P2)

O sistema deve monitorar e alertar sobre atividades suspeitas.

**Why this priority**: Detecção precoce previne danos.

**Independent Test**: Simular ataque e verificar se alerta é gerado.

**Acceptance Scenarios**:

1. **Given** múltiplas tentativas de login falham, **When** o threshold é atingido, **Then** alerta de brute force é gerado
2. **Given** acesso de IP desconhecido é detectado, **When** a análise é executada, **Then** alerta de acesso suspeito é gerado

---

### Edge Cases

- O que acontece quando o sistema de monitoramento falha?
  - Resposta: Logs são persistidos para análise posterior
- Como o sistema lida com falsos positivos?
  - Resposta: Sistema de scoring para priorizar alertas

## Requirements

### Functional Requirements

- **FR-001**: Sistema DEVE proteger contra SQL Injection
- **FR-002**: Sistema DEVE proteger contra XSS
- **FR-003**: Sistema DEVE implementar CSRF protection
- **FR-004**: Sistema DEVE monitorar tentativas de ataque
- **FR-005**: Sistema DEVE gerar alertas para atividades suspeitas

### Key Entities

- **SecurityAlert**: Alerta de segurança
  - Atributos: id, type, severity, sourceIp, timestamp, details

## Success Criteria

### Measurable Outcomes

- **SC-001**: 100% dos ataques OWASP Top 10 são bloqueados
- **SC-002**: Alertas são gerados em menos de 1 minuto
- **SC-003**: Falsos positivos são inferiores a 5%

## Stack Técnica

- **Proteção**: WAF (Web Application Firewall)
- **Monitoramento**: SIEM (Security Information and Event Management)
- **Análise**: Machine Learning para detecção de anomalias

## Status

Esta funcionalidade está em fase de planejamento. Implementação prevista para Q3 2026.

## Requisitos da recuperação de segurança — 2026-11-07
- **FR-006**: Sessões GS revogadas, usuários inativos e falhas de persistência DEVEM negar autenticação. Implementado e testado em `77b686c`.
- **FR-007**: A rota genérica GS DEVE negar gravações de qualquer papel diferente de AC_ADMIN ativo enquanto não houver política por tabela/campo/organização. Implementado; operações dos demais papéis permanecem temporariamente bloqueadas.
- **FR-008**: Eventos enviados pelo navegador NÃO DEVEM ser tratados como prova de autenticação, biometria ou emissão; auditoria de visualização DEVE conferir proprietário e descartar metadados arbitrários. Contenção implementada; compatibilidade da interface pendente.
- **FR-009**: Toda rota administrativa AC DEVE conferir sessão persistida ativa, vínculo entre sujeito JWT e AGR, conta ativa e papel ADMIN no servidor. Implementado para o guard `/ac/*` e a página servidor `/ac/admin`: consulta persistida e papel atual; não confiar no papel do JWT. Revisão das demais rotas administrativas/API permanece pendente.
- **FR-010**: Indisponibilidade do banco de permissões/sessões NÃO DEVE liberar acesso. Não aceitar um JWT apenas porque a assinatura ainda é válida após revogação da sessão.
- **FR-011**: Diagnósticos de banco NÃO DEVEM ser acessíveis em produção. `/test-db` retorna 404; teste e smoke HTTP aprovados em `33e812f`.

Validação disponível: instalação limpa sem legacy-peer-deps, build Webpack/TypeScript e 79 testes aprovados; lint direcionado sem erros. Lint global, testes com provedores reais e análise completa OWASP continuam pendentes. Os percentuais aspiracionais desta spec não são resultados medidos. Ver `CODEX_HANDOFF.md`.

### Critérios de aceitação — cookie JWT e portal administrativo
1. JWT válido com sessão revogada/expirada ou `sub` divergente do `agr_id` DEVE ser negado. Expiração ausente ou inválida no banco também DEVE negar.
2. Conta inativa ou consulta indisponível DEVE negar acesso, mesmo com assinatura e expiração JWT válidas.
3. Alteração de ADMIN para AGR no banco DEVE bloquear o próximo acesso administrativo, independentemente do papel gravado no JWT.
4. A página servidor `/ac/admin` DEVE validar ADMIN antes de renderizar, inclusive quando chamada sem execução do proxy.
5. APIs com Bearer opaque DEVEM continuar validando sessão/papel em `withAuth`; não aceitar JWT como substituto implícito.

Critérios 1–4 cobertos por testes unitários de sessão, proxy e página com banco mockado. Sem homologação de certificado real.
