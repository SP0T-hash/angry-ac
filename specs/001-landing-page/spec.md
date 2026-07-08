# Feature Specification: Landing Page VEMAPI

**Feature Branch**: `001-landing-page`

**Created**: 2026-07-07

**Status**: Implemented

**Input**: Página de marketing institucional da VEMAPI

## User Scenarios & Testing

### User Story 1 - Visualização da Landing Page (Priority: P1)

Um visitante acessa o site da VEMAPI e visualiza a página principal com informações sobre a empresa, serviços e planos.

**Why this priority**: É a primeira impressão da empresa e ponto de entrada principal para geração de leads.

**Independent Test**: Acessar a URL raiz do site e verificar se todos os elementos visuais estão presentes e funcionais.

**Acceptance Scenarios**:

1. **Given** um visitante acessa a página principal, **When** a página carrega, **Then** o hero section com a logo VEMAPI e slogan "TRANSFORMAMOS IDEIAS EM [ANIMAÇÃO]" é exibido
2. **Given** o visitante rola a página, **When** chega à seção de serviços, **Then** os 4 cards de serviços (Suporte N2, Certificados Digitais, Cyber Security, Infraestrutura Cloud) são exibidos com efeito spotlight
3. **Given** o visitante clica no seletor de certificados, **When** alterna entre e-CPF e e-CNPJ, **Then** as opções de certificados são filtradas e exibidas corretamente
4. **Given** o visitante expande uma pergunta no FAQ, **When** clica no botão de expandir, **Then** a resposta é exibida com animação suave

---

### User Story 2 - Formulário de Contato (Priority: P1)

Um visitante interessado preenche o formulário de contato para solicitar uma proposta comercial.

**Why this priority**: Geração de leads é o objetivo principal da landing page.

**Independent Test**: Preencher o formulário com dados válidos e verificar se o lead é registrado no Supabase.

**Acceptance Scenarios**:

1. **Given** o visitante preenche nome, email e projeto, **When** clica em "ENVIAR PROPOSTA", **Then** o status muda para "PROCESSANDO..."
2. **Given** o formulário é enviado com sucesso, **When** a inserção no Supabase é concluída, **Then** o status muda para "SOLICITAÇÃO RECEBIDA"
3. **Given** o formulário é enviado com erro de conexão, **When** a inserção falha, **Then** um alerta de erro é exibido

---

### User Story 3 - Troca de Tema (Priority: P2)

O visitante pode alternar entre tema claro e escuro manualmente, ou o tema segue a preferência do sistema.

**Why this priority**: Melhora a experiência do usuário e acessibilidade.

**Independent Test**: Clicar no botão de tema e verificar a alternância visual.

**Acceptance Scenarios**:

1. **Given** o visitante está no tema claro, **When** clica no botão de tema, **Then** o tema muda para escuro
2. **Given** o visitante está no tema escuro, **When** clica no botão de tema, **Then** o tema muda para claro
3. **Given** o visitante recarrega a página, **When** o navegador detecta preferência do sistema, **Then** o tema é aplicado automaticamente

---

### User Story 4 - Animações e Efeitos Visuais (Priority: P2)

A página deve ter animações suaves e efeitos visuais premium.

**Why this priority**: Melhora a percepção de qualidade profissional.

**Independent Test**: Verificar se as animações de scroll, hover e transições funcionam corretamente.

**Acceptance Scenarios**:

1. **Given** o visitante rola a página, **When** elementos entram no viewport, **Then** animações de reveal são ativadas
2. **Given** o visitante passa o mouse sobre um card de serviço, **When** o cursor se move, **Then** efeito spotlight segue o mouse
3. **Given** o visitante alterna entre abas de certificados, **When** a aba muda, **Then** transição animada é exibida

---

### Edge Cases

- O que acontece quando o Supabase está indisponível durante o envio do formulário?
  - Resposta: Exibe alerta de erro de conexão
- Como o sistema lida com formulário enviado com campos obrigatórios vazios?
  - Resposta: Validação nativa do HTML5 impede o envio
- O que acontece quando o JavaScript está desabilitado?
  - Resposta: A página exibe conteúdo estático sem animações

## Requirements

### Functional Requirements

- **FR-001**: Sistema DEVE exibir hero section com logo VEMAPI e slogan animado
- **FR-002**: Sistema DEVE exibir 4 cards de serviços com efeito spotlight
- **FR-003**: Sistema DEVE permitir seleção entre certificados e-CPF e e-CNPJ
- **FR-004**: Sistema DEVE exibir 5 perguntas frequentes com expansão animada
- **FR-005**: Sistema DEVE capturar leads via formulário de contato
- **FR-006**: Sistema DEVE inserir leads no Supabase tabela `leads`
- **FR-007**: Sistema DEVE suportar temas claro e escuro
- **FR-008**: Sistema DEVE detectar preferência de tema do sistema operacional
- **FR-009**: Sistema DEVE exibir animações de scroll reveal
- **FR-010**: Sistema DEVE exibir marquee de tecnologias

### Key Entities

- **Lead**: Representa um contato interessado
  - Atributos: nome, startup (projeto), email
  - Relacionamento: Armazenado no Supabase

- **Certificate**: Representa um tipo de certificado digital
  - Atributos: id, name, type, hasToken, recommended, category
  - Categorias: cpf, cnpj

## Success Criteria

### Measurable Outcomes

- **SC-001**: Página carrega em menos de 3 segundos em conexão 4G
- **SC-002**: 100% dos elementos visuais são exibidos corretamente
- **SC-003**: Formulário de contato funciona em 100% dos dispositivos
- **SC-004**: Tema claro/escuro funciona sem flicker

## Assumptions

- Usuários possuem conexão estável com internet
- Suporte a JavaScript habilitado no navegador
- Supabase está configurado e acessível
- O formulário de leads é o objetivo principal da página

## Stack Técnica

- **Framework**: Next.js 16 (App Router)
- **UI**: Tailwind CSS + Framer Motion
- **Banco de Dados**: Supabase (PostgreSQL)
- **Deploy**: Vercel
- **Idioma**: TypeScript

## Arquivos Implementados

- `src/app/(landing)/page.tsx` - Página principal
- `src/app/(landing)/layout.tsx` - Layout da landing page
- `src/lib/supabase.ts` - Cliente Supabase
