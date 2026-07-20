# Feature Specification: Reforma de UI do Módulo GS

**Feature Branch**: `001-gs-ui-reform`

**Created**: 2026-07-19

**Status**: Implemented

**Input**: User description: "Aplicar padrão visual Open Design ao módulo GS: sidebar só de ícones está bagunçada, login lento, adicionar reCAPTCHA, telas sem hierarquia clara."

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Navegação com labels legíveis (Priority: P1)

O operador do GS precisa identificar cada seção pelo nome, não apenas por ícone.

**Why this priority**: A sidebar só-ícones (68px) era confusa e violava hierarquia.

**Independent Test**: Acessar `/gs/dashboard` logado e confirmar que a sidebar mostra
labels (Dashboard, ARs, Unidades, Pontos, Clientes, Pedidos, Financeiro, Suporte) e
destaca o item ativo.

**Acceptance Scenarios**:

1. **Given** usuário logado, **When** abre qualquer tela GS, **Then** a sidebar mostra labels legíveis.
2. **Given** usuário em `/gs/clientes`, **When** observa a sidebar, **Then** "Clientes" está destacado em emerald.

---

### User Story 2 - Login seguro e acessível (Priority: P1)

O usuário faz login com email/senha protegido por reCAPTCHA e recebe erros claros.

**Why this priority**: Login é o portão de entrada; lentidão e falta de validação prejudicam.

**Independent Test**: Tentar login com campo vazio ou email inválido e ver erro acessível
(`role="alert"`, `aria-describedby`); login válido redireciona ao dashboard.

**Acceptance Scenarios**:

1. **Given** tela de login, **When** submete email vazio, **Then** erro "Informe o email." aparece com aria.
2. **Given** reCAPTCHA configurado, **When** submete credenciais válidas, **Then** token verificado server-side e redireciona.

---

### User Story 3 - Telas com hierarquia e estados (Priority: P2)

Cada lista GS expõe título, subtítulo e os 5 estados (loading/empty/error/populated/edge).

**Why this priority**: Consistência visual e cobertura de estados evitam telas quebradas.

**Independent Test**: Abrir lista com erro de banco e confirmar banner de erro; listas vazias
mostram estado empty.

**Acceptance Scenarios**:

1. **Given** falha de fetch, **When** tela renderiza, **Then** erro aparece em banner rose.
2. **Given** dados presentes, **When** tela renderiza, **Then** tabela populada com título/classe.

---

### Edge Cases

- reCAPTCHA não configurado (SITE_KEY vazio): login NÃO deve ser bloqueado (dev).
- Login lento por latência de rede: client Supabase memoizado; token via `crypto` nativo.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: Sidebar GS MUST mostrar labels de navegação, não apenas ícones.
- **FR-002**: Login GS MUST validar email/senha client-side com estados acessíveis (pristine/touched/invalid).
- **FR-003**: Login GS MUST incluir reCAPTCHA v2 invisível com verificação server-side.
- **FR-004**: Login GS MUST usar accent emerald único; proibido gradiente "trust" e borda-esquerda colorida.
- **FR-005**: Listas GS MUST expor estados loading/empty/error além de populated.
- **FR-006**: Sessão GS MUST usar cookie httpOnly; client Supabase memoizado para reduzir latência.

### Key Entities

- **GSLayout**: componente unificado de sidebar+header (substitui GSShell e duplicação em GSListClient).
- **Sessão GS**: token em `gs_sessoes`, cookie `gs_session` httpOnly.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Usuário identifica a seção atual em < 1s (labels legíveis).
- **SC-002**: Login válido completa em < 2s em servidor quente.
- **SC-003**: 100% dos erros de formulário expostos via `role="alert"` + `aria-describedby`.
- **SC-004**: Telas GS consistentes em accent/raio/borda (sem gradientes proibidos).

## Assumptions

- reCAPTCHA v2 invisível é aceitável; chaves fornecidas pelo usuário em `.env`.
- Supabase é o backend; latência de rede é o gargalo principal do login.
