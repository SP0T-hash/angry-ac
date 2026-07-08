# Implementation Plan: AC ANGRY - Motor de Certificação Digital

**Branch**: `002-ac-angry-certification` | **Date**: 2026-07-07 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `/specs/002-ac-angry-certification/spec.md`

## Summary

Motor de emissão e gestão de certificados digitais ICP-Brasil com conformidade a DOC-ICP-01, LGPD e ABNT NBR 15527. Inclui API de assinatura RSA, validação de nonces anti-replay, rate limiting, trilha de auditoria e gestão de sessões AGR.

## Technical Context

**Language/Version**: TypeScript (Next.js 16)
**Primary Dependencies**: node-forge (RSA/SHA-256), Supabase (PostgreSQL)
**Storage**: Supabase (PostgreSQL) com RLS
**Testing**: Vitest
**Target Platform**: Serverless (Vercel)
**Project Type**: Web API (Serverless)
**Performance Goals**: Certificado emitido em <5s, CA inicializada em <2s
**Constraints**: Conformidade ICP-Brasil, LGPD, ABNT NBR 15527
**Scale/Scope**: 1000+ certificados/mês, 100+ AGRs simultâneos

## Constitution Check

### Simplicity Gate (Article VII)
- [x] Usando ≤3 projetos? ✅ (Next.js monolito)
- [x] Sem future-proofing? ✅
- [x] Usando framework diretamente? ✅ (node-forge sem abstrações)

### Anti-Abstraction Gate (Article VIII)
- [x] Usando framework diretamente? ✅
- [x] Representação única de modelo? ✅

### Integration-First Gate (Article IX)
- [x] Contratos definidos? ✅ (API Routes)
- [x] Testes de contrato escritos? ✅ (Vitest)

## Project Structure

### Documentation (this feature)

```text
specs/002-ac-angry-certification/
├── plan.md              # Este arquivo
├── spec.md              # Especificação da feature
├── data-model.md        # Modelo de dados
├── research.md          # Pesquisa técnica
└── contracts/           # Contratos de API
    └── api-contracts.md
```

### Source Code (repository root)

```text
src/
├── app/
│   └── api/
│       └── ac/
│           ├── sign/route.ts           # API de assinatura
│           └── persist-certificate/route.ts  # Persistência
├── lib/
│   └── ac-angry/
│       ├── security.ts                 # NonceManager, RateLimiter, AuditLogger
│       ├── pki.ts                      # Operações PKI
│       ├── api-middleware.ts           # Middleware de auth
│       ├── supabase-admin.ts          # Cliente Supabase
│       └── __tests__/                  # Testes unitários
│           └── security.test.ts
└── tests/
    └── security/                       # Testes de segurança
        ├── security.module.test.ts
        └── security.endpoint.test.ts
```

**Structure Decision**: Next.js App Router com APIs serverless e módulos de segurança isolados em `lib/ac-angry/`.

## Complexity Tracking

| Violation | Why Needed | Simpler Alternative Rejected Because |
|-----------|------------|-------------------------------------|
| CA em memória (não HSM) | Desenvolvimento/testes | HSM requer infraestrutura física |
| Supabase Service Role | Acesso admin para auditoria | RLS insuficiente para operações de sistema |

## Fases de Implementação

### Fase 1: Infraestrutura de Segurança
- [x] NonceManager com HMAC-SHA256
- [x] RateLimiter por scope
- [x] AuditLogger imutável
- [x] SessionManager para AGRs

### Fase 2: Motor PKI
- [x] Geração lazy de CA raiz (RSA 2048)
- [x] Validação de CSR
- [x] Emissão de certificados
- [x] Exportação PEM

### Fase 3: API de Assinatura
- [x] Endpoint POST /api/ac/sign
- [x] Validação de nonce
- [x] Rate limiting
- [x] Audit logging

### Fase 4: Persistência
- [x] Endpoint POST /api/ac/persist-certificate
- [x] Insert no Supabase
- [x] Validação de duplicatas

### Fase 5: Testes
- [x] Testes unitários de segurança
- [x] Testes de endpoint
- [x] Testes de conformidade

## Checklist de Validação

- [ ] Todos os nonces expirados são rejeitados
- [ ] Rate limiting bloqueia requisições acima do limite
- [ ] 100% das operações são auditadas
- [ ] CA raiz é inicializada corretamente
- [ ] Certificados são emitidos com validade correta
- [ ] Logs de auditoria são imutáveis
