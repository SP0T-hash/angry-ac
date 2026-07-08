# Especificações SDD - VEMAPI SITE

## Visão Geral

Esta pasta contém as especificações do projeto VEMAPI SITE seguindo a metodologia **Spec-Driven Development (SDD)** do GitHub spec-kit.

## Estrutura

```
specs/
├── README.md                          # Este arquivo
├── 001-landing-page/                  # Página de marketing
├── 002-ac-angry-certification/        # Motor de certificação digital
├── 003-ac-angry-protocol-viewer/      # Interface de protocolos
├── 004-admin-portal/                  # Dashboard administrativo
├── 005-user-portal/                   # Portal do usuário
├── 006-serverless-apis/               # APIs serverless
├── 007-corear-checkout/               # Motor de pagamentos
├── 008-corear-ledger/                 # Livro razão e split
├── 009-corear-billing/                # Billing e fiscal
├── 010-corear-crm/                    # CRM e renovação
├── 011-cyber-security/               # Segurança digital (Planejado)
└── 012-cloud-infrastructure/          # Infraestrutura cloud (Planejado)
```

## Status das Features

| # | Feature | Status | Prioridade |
|---|---------|--------|------------|
| 001 | Landing Page | ✅ Implementado | P1 |
| 002 | AC ANGRY Certification | ✅ Implementado | P1 |
| 003 | Protocol Viewer | ✅ Implementado | P1 |
| 004 | Admin Portal | ✅ Implementado | P1 |
| 005 | User Portal | ✅ Implementado | P2 |
| 006 | Serverless APIs | ✅ Implementado | P1 |
| 007 | CORE-AR Checkout | ✅ Implementado | P1 |
| 008 | CORE-AR Ledger | ✅ Implementado | P1 |
| 009 | CORE-AR Billing | ✅ Implementado | P2 |
| 010 | CORE-AR CRM | ✅ Implementado | P2 |
| 011 | Cyber Security | 📋 Planejado | P1 |
| 012 | Cloud Infrastructure | 📋 Planejado | P1 |

## Como Usar

### Para cada feature, os seguintes arquivos podem existir:

- **spec.md**: Especificação completa com user stories e requisitos
- **plan.md**: Plano de implementação técnica
- **data-model.md**: Modelo de dados
- **research.md**: Pesquisa técnica
- **contracts/**: Contratos de API
- **tasks.md**: Tarefas de implementação

### Fluxo SDD

1. **Spec**: Definir O QUE fazer (user stories, requisitos)
2. **Plan**: Definir COMO fazer (stack, arquitetura)
3. **Tasks**: Quebrar em tarefas executáveis
4. **Implement**: Executar as tarefas
5. **Converge**: Validar implementação contra spec

## Constituição do Projeto

A constituição do projeto está em `.specify/memory/constitution.md` e define os princípios imutáveis de desenvolvimento.

## Referências

- [GitHub spec-kit](https://github.com/github/spec-kit)
- [Spec-Driven Development](https://github.com/github/spec-kit/blob/main/spec-driven.md)
