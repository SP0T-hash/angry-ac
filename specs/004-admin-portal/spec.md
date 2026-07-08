# Feature Specification: Portal de Administração

**Feature Branch**: `004-admin-portal`

**Created**: 2026-07-07

**Status**: Implemented

**Input**: Dashboard administrativo para gestão do sistema

## User Scenarios & Testing

### User Story 1 - Dashboard Administrativo (Priority: P1)

Um administrador acessa o dashboard para visualizar métricas do sistema e status operacional.

**Why this priority**: Visão geral do sistema é essencial para gestão.

**Independent Test**: Acessar o dashboard e verificar se os KPIs são exibidos.

**Acceptance Scenarios**:

1. **Given** um administrador autenticado acessa o dashboard, **When** a página carrega, **Then** os KPIs (certificados emitidos, AGRs ativos, receita) são exibidos
2. **Given** o dashboard está carregado, **When** o administrador visualiza o gráfico, **Then** dados dos últimos 30 dias são exibidos
3. **Given** ocorre um erro no sistema, **When** o administrador acessa o dashboard, **Then** alertas são exibidos

---

### User Story 2 - Gestão de AGRs (Priority: P1)

O administrador pode visualizar e gerenciar Agentes de Registro.

**Why this priority**: Controle de AGRs é essencial para operação.

**Independent Test**: Listar AGRs e verificar se os dados são exibidos corretamente.

**Acceptance Scenarios**:

1. **Given** o administrador está na lista de AGRs, **When** a página carrega, **Then** todos os AGRs são exibidos com status
2. **Given** um AGR está com problema, **When** o administrador seleciona, **Then** opções de suspender/reativar são exibidas
3. **Given** um novo AGR precisa ser cadastrado, **When** o administrador preenche o formulário, **Then** o AGR é criado

---

### User Story 3 - Monitoramento de Segurança (Priority: P2)

O administrador pode visualizar eventos de segurança e tentativas de intrusão.

**Why this priority**: Segurança é crítica para sistema de certificação.

**Independent Test**: Visualizar tabela de audit logs e verificar se eventos são exibidos.

**Acceptance Scenarios**:

1. **Given** o administrador está na tabela de segurança, **When** a página carrega, **Then** os últimos 100 eventos são exibidos
2. **Given** um evento crítico ocorreu, **When** o administrador visualiza, **Then** o evento é destacado em vermelho
3. **Given** o administrador quer filtrar eventos, **When** aplica um filtro, **Then** apenas eventos correspondentes são exibidos

---

### Edge Cases

- O que acontece quando o Supabase está indisponível?
  - Resposta: Mensagem de erro é exibida com opção de retry
- Como o sistema lida com muitos dados de auditoria?
  - Resposta: Paginação e lazy loading

## Requirements

### Functional Requirements

- **FR-001**: Sistema DEVE exibir dashboard com KPIs
- **FR-002**: Sistema DEVE listar todos os AGRs
- **FR-003**: Sistema DEVE permitir gerenciar status de AGRs
- **FR-004**: Sistema DEVE exibir tabela de auditoria
- **FR-005**: Sistema DEVE suportar filtros e paginação
- **FR-006**: Sistema DEVE destacar eventos críticos

### Key Entities

- **KPI**: Métrica do sistema
  - Atributos: name, value, trend, period

- **Agent**: Agente de Registro
  - Atributos: id, name, cnpj, status, certificatesCount

- **SecurityEvent**: Evento de segurança
  - Atributos: id, eventType, agrId, ipAddress, severity, timestamp

## Success Criteria

### Measurable Outcomes

- **SC-001**: Dashboard carrega em menos de 3 segundos
- **SC-002**: Lista de AGRs suporta 1000+ registros
- **SC-003**: Tabela de auditoria suporta paginação

## Stack Técnica

- **Framework**: Next.js 16 (App Router)
- **UI**: Tailwind CSS + Tremor (gráficos)
- **Tabelas**: @tanstack/react-table

## Arquivos Implementados

- `src/app/(portal)/admin/dashboard/page.tsx` - Página do dashboard
- `src/components/ac-angry/admin/KpiGrid.tsx` - Grid de KPIs
- `src/components/ac-angry/admin/SecurityAuditTable.tsx` - Tabela de auditoria
- `src/components/ac-angry/admin/AgenteMonitor.tsx` - Monitor de AGRs
