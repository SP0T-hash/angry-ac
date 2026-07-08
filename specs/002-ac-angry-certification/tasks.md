# Tasks: AC ANGRY - Motor de Certificação Digital

**Branch**: `002-ac-angry-certification` | **Date**: 2026-07-07 | **Spec**: [spec.md](./spec.md)

**Input**: Implementation plan from `/specs/002-ac-angry-certification/plan.md`

## User Story 1 - Emissão de Certificado Digital (Priority: P1)

### Tarefas

- [x] **T1.1**: Implementar NonceManager com HMAC-SHA256
  - Arquivos: `src/lib/ac-angry/security.ts`
  - Dependências: Nenhuma
  - Estimativa: 4h

- [x] **T1.2**: Implementar RateLimiter por scope
  - Arquivos: `src/lib/ac-angry/security.ts`
  - Dependências: T1.1
  - Estimativa: 2h

- [x] **T1.3**: Implementar AuditLogger imutável
  - Arquivos: `src/lib/ac-angry/security.ts`
  - Dependências: Nenhuma
  - Estimativa: 3h

- [x] **T1.4**: Implementar SessionManager para AGRs
  - Arquivos: `src/lib/ac-angry/security.ts`
  - Dependências: T1.1
  - Estimativa: 2h

### Checkpoint

- [x] Todos os testes unitários passam
- [x] Nonces são validados corretamente
- [x] Rate limiting funciona
- [x] Audit logs são gerados

---

## User Story 2 - Motor PKI (Priority: P1)

### Tarefas

- [x] **T2.1**: Implementar geração lazy de CA raiz (RSA 2048)
  - Arquivos: `src/app/api/ac/sign/route.ts`
  - Dependências: Nenhuma
  - Estimativa: 4h

- [x] **T2.2**: Implementar validação de CSR
  - Arquivos: `src/app/api/ac/sign/route.ts`
  - Dependências: T2.1
  - Estimativa: 3h

- [x] **T2.3**: Implementar emissão de certificados
  - Arquivos: `src/app/api/ac/sign/route.ts`
  - Dependências: T2.2
  - Estimativa: 4h

- [x] **T2.4**: Implementar exportação PEM
  - Arquivos: `src/app/api/ac/sign/route.ts`
  - Dependências: T2.3
  - Estimativa: 2h

### Checkpoint

- [x] CA raiz é inicializada corretamente
- [x] CSRs são validados
- [x] Certificados são emitidos com serial number
- [x] PEM é exportado corretamente

---

## User Story 3 - API de Assinatura (Priority: P1)

### Tarefas

- [x] **T3.1**: Implementar endpoint POST /api/ac/sign
  - Arquivos: `src/app/api/ac/sign/route.ts`
  - Dependências: T2.4
  - Estimativa: 3h

- [x] **T3.2**: Implementar middleware de autenticação
  - Arquivos: `src/lib/ac-angry/api-middleware.ts`
  - Dependências: T1.4
  - Estimativa: 2h

- [x] **T3.3**: Integrar validação de nonce
  - Arquivos: `src/app/api/ac/sign/route.ts`
  - Dependências: T3.1, T1.1
  - Estimativa: 1h

- [x] **T3.4**: Integrar rate limiting
  - Arquivos: `src/app/api/ac/sign/route.ts`
  - Dependências: T3.1, T1.2
  - Estimativa: 1h

### Checkpoint

- [x] API retorna certificado PEM
- [x] Validação de nonce funciona
- [x] Rate limiting funciona
- [x] Audit logging funciona

---

## User Story 4 - Persistência (Priority: P2)

### Tarefas

- [x] **T4.1**: Implementar endpoint POST /api/ac/persist-certificate
  - Arquivos: `src/app/api/ac/persist-certificate/route.ts`
  - Dependências: Nenhuma
  - Estimativa: 2h

- [x] **T4.2**: Implementar insert no Supabase
  - Arquivos: `src/app/api/ac/persist-certificate/route.ts`
  - Dependências: T4.1
  - Estimativa: 1h

- [x] **T4.3**: Implementar validação de duplicatas
  - Arquivos: `src/app/api/ac/persist-certificate/route.ts`
  - Dependências: T4.2
  - Estimativa: 1h

### Checkpoint

- [x] Certificado é persistido no Supabase
- [x] Duplicatas são rejeitadas
- [x] Dados são consistentes

---

## User Story 5 - Testes (Priority: P2)

### Tarefas

- [x] **T5.1**: Criar testes unitários de segurança
  - Arquivos: `src/lib/ac-angry/__tests__/security.test.ts`
  - Dependências: T1.1-T1.4
  - Estimativa: 4h

- [x] **T5.2**: Criar testes de endpoint
  - Arquivos: `src/lib/ac-angry/__security__/security.endpoint.test.ts`
  - Dependências: T3.1-T3.4
  - Estimativa: 3h

- [x] **T5.3**: Criar testes de conformidade
  - Arquivos: `src/lib/ac-angry/__security__/security.module.test.ts`
  - Dependências: T5.1, T5.2
  - Estimativa: 2h

### Checkpoint

- [x] Todos os testes passam
- [x] Cobertura >80%
- [x] Testes de conformidade ICP-Brasil passam

---

## Resumo

| User Story | Total Tarefas | Estimativa | Status |
|------------|---------------|------------|--------|
| US 1 - Segurança | 4 | 11h | Concluído |
| US 2 - Motor PKI | 4 | 13h | Concluído |
| US 3 - API Assinatura | 4 | 7h | Concluído |
| US 4 - Persistência | 3 | 4h | Concluído |
| US 5 - Testes | 3 | 9h | Concluído |
| **Total** | **18** | **44h** | **Concluído** |

## Notas

- Todas as tarefas foram concluídas com sucesso
- Sistema está em produção e operacional
- Conformidade ICP-Brasil e LGPD verificada
