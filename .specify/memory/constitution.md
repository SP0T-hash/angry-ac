# Constituição do Projeto VEMAPI SITE

## Visão Geral

A VEMAPI é uma plataforma de confiança digital e certificação que opera no ecossistema ICP-Brasil. Esta constituição estabelece os princípios imutáveis que governam todo o desenvolvimento de software.

---

## Artigo I: Princípio da Biblioteca

Toda funcionalidade DEVE começar como uma biblioteca standalone—sem exceções. Isso força um design modular desde o início.

**Aplicação no projeto:**
- Módulos de segurança (NonceManager, RateLimiter, AuditLogger) são bibliotecas independentes
- O motor de certificação (AC ANGRY) é um módulo isolado
- O CORE-AR segue arquitetura de bounded contexts

---

## Artigo II: Mandato de Interface CLI

Toda biblioteca DEVE expor sua funcionalidade através de uma interface de linha de comando.

**Aplicação no projeto:**
- APIs serverless servem como interfaces de texto (JSON input/output)
- Endpoints REST seguem padrões de texto estruturado
- Logs de auditoria são exportáveis em formato texto

---

## Artigo III: Imperativo de Teste Primeiro

**NÃO É NEGOCIÁVEL:** Toda implementação DEVE seguir Desenvolvimento Orientado a Testes (TDD).

**Aplicação no projeto:**
- Testes de segurança em `src/lib/ac-angry/__security__/`
- Testes unitários do motor de split no CORE-AR
- Cobertura mínima de 80% para código crítico

---

## Artigo IV: Governança Definida pelo Projeto

### Segurança e Conformidade
- **ICP-Brasil**: Conformidade com DOC-ICP-01 para certificados digitais
- **LGPD**: Proteção rigorosa de dados pessoais com criptografia em repouso e trânsito
- **ABNT NBR 15527**: Padrões brasileiros para certificados de chave pública

### Padrões de Código
- TypeScript/JavaScript: Strict mode habilitado
- C#: nullable reference types habilitado
- Commits conventional (feat:, fix:, docs:, etc.)

---

## Artigo V: Observabilidade

Toda funcionalidade DEVE ser inspecionável through interfaces de texto.

**Aplicação no projeto:**
- AuditLogger registra cada interação (AGR, IP, Timestamp)
- Logs estruturados em JSON para análise
- Métricas de performance em tempo real

---

## Artigo VI: Versionamento

- APIs seguem versionamento por URL (`/api/v1/...`)
- Breaking changes requerem nova versão maior
- Deprecations com aviso prévio de 6 meses

---

## Artigo VII: Simplicidade

### Estrutura Mínima do Projeto
- Máximo de 3 projetos para implementação inicial
- Projetos adicionais requerem justificativa documentada

### Anti-Abstração
- Usar features do framework diretamente sem wrapping desnecessário
- Representação única de modelo (não duplicar entidades)

**Aplicação no projeto:**
- Next.js App Router para frontend + API
- Supabase como único banco de dados
- .NET 8 monolito modular para CORE-AR

---

## Artigo VIII: Confiança no Framework

- Usar features do framework diretamente em vez de abstrações customizadas
- Next.js Server Components quando possível
- Supabase Auth nativo em vez de wrapper customizado

---

## Artigo IX: Teste de Integração Primeiro

Testes DEVE usar ambientes realistas:
- Preferir bancos de dados reais sobre mocks
- Usar instâncias reais de serviços over stubs
- Contratos de teste obrigatórios antes da implementação

**Aplicação no projeto:**
- Supabase como banco de testes (sandbox)
- Webhooks testados com payloads reais
- Testes de conformidade ICP-Brasil

---

## Processo de Emenda

Modificações a esta constituição requerem:
1. Documentação explícita da rationale para mudança
2. Revisão e aprovação dos maintainers do projeto
3. Avaliação de compatibilidade com versões anteriores

---

*Última atualização: 2026-07-07*
*Status: Ativo*
