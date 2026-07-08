# Análise de Arquitetura - VEMAPI SITE

## Estado Atual

O projeto é um **monorepo dual-stack** com dois sistemas:

| Sistema | Stack | Função |
|---------|-------|--------|
| Root (VEMAPI) | Next.js 16 + React 19 + Supabase | AC ANGRY - Certificação Digital ICP-Brasil |
| gs.vemapi/CORE-AR | .NET 8 + PostgreSQL + Redis + RabbitMQ | ERP para Autoridades de Registro |

## Arquitetura Atual

```
┌─────────────────────────────────────────────────┐
│              VEMAPI SITE (Monorepo)             │
│                                                 │
│  ┌──────────────────┐  ┌─────────────────────┐ │
│  │  Next.js 16      │  │  gs.vemapi/ .NET 8  │ │
│  │  AC ANGRY Frontend│  │  CORE-AR Backend    │ │
│  │  + API Routes     │  │  Identity/Checkout/ │ │
│  │  Supabase         │  │  Ledger/Billing/CRM │ │
│  └────────┬─────────┘  └────────┬────────────┘ │
│           └─────────┬───────────┘               │
│                     ▼                           │
│             ┌──────────────┐                    │
│             │   Supabase   │                    │
│             │  PostgreSQL  │                    │
│             └──────────────┘                    │
└─────────────────────────────────────────────────┘
```

## Problemas Críticos Encontrados

### 1. DUPLICAÇÃO DE CÓDIGO (CRÍTICO)
- `src/lib/ac-angry/security.ts` (432 linhas) vs `gs.vemapi/frontend/src/lib/ac-angry/security.ts` (908 linhas)
- Versão GS é mais completa e segura (timing-safe comparison, hash chain audit)
- Versão Root tem Atomic nonce consume (melhor)

### 2. SEGURANÇA (CRÍTICO)
- `verifySignature()` em `psc-auth.ts` **SEMPRE retorna true** (linha 194-197)
- Validação A3 **SIMULADA** - apenas verifica se assinatura não é vazia (linha 276-284)
- Validação PSC **SIMULADA** - apenas verifica formato UUID (linha 295-313)
- CSP permite `unsafe-inline` e `unsafe-eval` (next.config.ts linha 8)
- Comparação HMAC usa `!==` em vez de `timingSafeEqual` (security.ts linha 101)
- Chave privada retornada ao cliente no CSR (pki.ts linha 34)

### 3. PADRÕES INCONSISTENTES
- 3 padrões diferentes de cliente Supabase
- 2 sistemas de middleware diferentes
- 2 sistemas de autenticação diferentes (PKI vs Email/Password)
- 2 sistemas de auditoria diferentes (tabelas separadas)
- Tratamento de erros inconsistente

### 4. PERFORMANCE
- Rate limiter faz 2 queries DB por request (select + update)
- Nonce consume faz 3 queries DB
- Session validate faz 2 queries DB
- Sem configuração de connection pooling

### 5. CÓDIGO FALTANTE
- Navbar.tsx usa `useRouter` sem `'use client'` (vai crashar)
- Sem validação de input com schema (zod)
- Sem tipos de resposta de API
- Mock data com CPFs que parecem reais

## Arquitetura Recomendada: BFF com Shared Kernel

```
┌──────────────────────────────────────────────────────────┐
│                    VEMAPI PLATFORM                        │
│                                                          │
│  ┌────────────────────┐    ┌──────────────────────────┐  │
│  │  Next.js 16 (BFF)  │    │    .NET 8 (CORE-AR)      │  │
│  │                    │    │                           │  │
│  │  ┌──────────────┐ │    │  ┌─────────────────────┐  │  │
│  │  │ (angry) AC UI │ │    │  │ Identity (JWT/RBAC) │  │  │
│  │  │ (landing) Web │ │    │  │ Checkout (Payments) │  │  │
│  │  │ (portal) App  │ │    │  │ Ledger (Split)      │  │  │
│  │  └──────────────┘ │    │  │ Billing (NF-e)      │  │  │
│  │                    │    │  │ CRM (Renewals)      │  │  │
│  │  ┌──────────────┐ │    │  └─────────────────────┘  │  │
│  │  │ API Routes   │─┼────┼── RabbitMQ (Events)       │  │
│  │  │ PKI Auth     │ │    │  Redis (Cache/Locks)      │  │
│  │  │ Certificate  │ │    │                           │  │
│  │  │ Video        │ │    └──────────────────────────┘  │
│  │  │ SAF/Fraud    │ │                                   │
│  │  └──────────────┘ │                                   │
│  └─────────┬─────────┘                                   │
│            │                                              │
│            ▼                                              │
│  ┌──────────────────────┐                                │
│  │   packages/security  │  ← Shared Kernel               │
│  │   - NonceManager     │                                │
│  │   - SessionManager   │                                │
│  │   - RateLimiter      │                                │
│  │   - AuditLogger      │                                │
│  │   - DataEncryptor    │                                │
│  │   - CertValidator    │                                │
│  └──────────┬───────────┘                                │
│             ▼                                             │
│  ┌──────────────────────┐                                │
│  │     Supabase         │                                │
│  │  PostgreSQL + RLS    │                                │
│  └──────────────────────┘                                │
└──────────────────────────────────────────────────────────┘
```

## Plano de Ação (Priorizado)

### Fase 1: Corrigir Segurança Crítica (URGENTE)
1. Substituir `verifySignature()` em `psc-auth.ts` por validação real
2. Implementar validação A3 real com `crypto.verify()`
3. Implementar validação PSC real chamando API do provider
4. Usar `timingSafeEqual` para comparação HMAC
5. Remover `unsafe-inline` e `unsafe-eval` do CSP
6. Não retornar chave privada no CSR

### Fase 2: Consolidar Módulos de Segurança
1. Criar `packages/security/` com versão unificada
2. Usar versão GS como base (mais completa)
3. Incorporar Atomic nonce consume do Root
4. Criar factory único de cliente Supabase
5. Atualizar todas as referências

### Fase 3: Padronizar Padrões
1. Adicionar `'use client'` ao Navbar.tsx
2. Criar tipos de resposta de API
3. Adicionar zod para validação de input
4. Unificar sistema de auditoria
5. Unificar sistema de autenticação

### Fase 4: Otimizar Performance
1. Implementar rate limiter com RPC atômico
2. Reduzir queries de nonce/session
3. Configurar connection pooling
4. Adicionar cache para consultas frequentes

### Fase 5: Arquitetura Formal
1. Criar workspace packages/ para código compartilhado
2. Mover gs.vemapi/frontend para workspace ou integrar ao root
3. Documentar arquitetura em docs/ARCHITECTURE.md
4. Configurar CI/CD para validação de dependências

## Conclusão

A arquitetura **BFF com Shared Kernel** é a mais adequada porque:
- Mantém a separação natural entre Next.js (frontend+BFF) e .NET (backend)
- Permite compartilhamento de código de segurança
- Suporta conformidade ICP-Brasil
- Escala horizontalmente
- É pragmática (não requer reescrita completa)

A prioridade imediata é corrigir os problemas de segurança e consolidar os módulos duplicados.
