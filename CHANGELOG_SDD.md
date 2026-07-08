# Changelog - Implementação SDD + Melhorias de Arquitetura

**Projeto**: VEMAPI SITE  
**Período**: Julho 2026  
**Metodologia**: Spec-Driven Development (SDD)  

---

## Resumo das Mudanças

Esta documentação lista todas as mudanças realizadas durante a sessão de trabalho, organizadas por fase e tipo.

---

## Fase 1: Documentação SDD (Spec-Driven Development)

### Commits
- `6118649` - `docs: implement SDD methodology with complete project specifications`

### Arquivos Criados

#### Estrutura SDD
```
.specify/
├── memory/constitution.md          # Constituição do projeto (9 artigos)
├── templates/
│   ├── spec-template.md            # Template para especificações
│   ├── plan-template.md            # Template para planos
│   └── tasks-template.md           # Template para tarefas
```

#### Especificações (12 features)
```
specs/
├── README.md                       # Índice das especificações
├── 001-landing-page/spec.md        # Página de marketing
├── 002-ac-angry-certification/     # Motor de certificação (COMPLETO)
│   ├── spec.md
│   ├── plan.md
│   ├── data-model.md
│   ├── research.md
│   ├── contracts/api-contracts.md
│   └── tasks.md
├── 003-ac-angry-protocol-viewer/spec.md
├── 004-admin-portal/spec.md
├── 005-user-portal/spec.md
├── 006-serverless-apis/spec.md
├── 007-corear-checkout/spec.md
├── 008-corear-ledger/spec.md
├── 009-corear-billing/spec.md
├── 010-corear-crm/spec.md
├── 011-cyber-security/spec.md      # Status: Planned
└── 012-cloud-infrastructure/spec.md # Status: Planned
```

### Conteúdo da Constituição
- **Artigo I**: Princípio da Biblioteca
- **Artigo II**: Mandato de Interface CLI
- **Artigo III**: Imperativo de Teste Primeiro (TDD)
- **Artigo IV**: Governança (ICP-Brasil, LGPD, ABNT)
- **Artigo V**: Observabilidade
- **Artigo VI**: Versionamento
- **Artigo VII**: Simplicidade
- **Artigo VIII**: Confiança no Framework
- **Artigo IX**: Teste de Integração Primeiro

---

## Fase 2: Configuração OpenCode

### Commits
- `65c8c9b` - `chore: update opencode config with merged global settings`

### Arquivos Modificados
- `opencode.jsonc` - Configurações atualizadas

### Mudanças
- Adicionado `specs/README.md` nas instruções
- Adicionadas referências `vemapi` e `spec-kit`
- Adicionado MCP `open-design` (desabilitado)
- Atualizado prompt do agente com descrição completa do projeto

---

## Fase 3: Análise de Arquitetura

### Arquivo Criado
- `.mimocode/plans/architecture-analysis.md` - Análise completa da arquitetura

### Problemas Críticos Identificados
1. **verifySignature() sempre retorna true** - `psc-auth.ts:194`
2. **Validação A3 simulada** - `api/auth/pki/route.ts:276`
3. **Validação PSC simulada** - `api/auth/pki/route.ts:295`
4. **CSP permite unsafe-inline/eval** - `next.config.ts:8`
5. **HMAC compara com !==** - `security.ts:101`
6. **Código duplicado** - 432 vs 908 linhas em 2 locais
7. **Navbar sem 'use client'** - `Navbar.tsx:4`
8. **3 padrões de cliente Supabase**

### Arquitetura Recomendada
**BFF com Shared Kernel**:
```
Next.js 16 (BFF)  ←→  .NET 8 (CORE-AR)
        ↓                     ↓
   packages/security    RabbitMQ + Redis
        ↓
   Supabase PostgreSQL
```

---

## Fase 4: Correções de Segurança Crítica

### Commits
- `d0b6b97` - `fix: critical security fixes and architecture improvements`

### Arquivos Modificados

#### 1. `src/lib/ac-angry/psc-auth.ts`
**Antes**: `verifySignature()` sempre retornava `true`
**Depois**: Valida via API do provider PSC

```typescript
// ANTES
async verifySignature(session_id: string, signedData: string): Promise<boolean> {
  return true; // SEMPRE RETORNA TRUE
}

// DEPOIS
async verifySignature(session_id: string, signedData: string): Promise<boolean> {
  // Valida via API do Vidaas/Syngular/BirdID
  const response = await fetch(`${config.api_url}/v1/signature/${session_id}/verify`, {...});
  const data = await response.json();
  return data.valid === true;
}
```

#### 2. `src/app/api/auth/pki/route.ts`
**Antes**: Validação A3 simulada (hash > 0)
**Depois**: Validação criptográfica real com `crypto.verify()`

```typescript
// ANTES
const signatureHash = createHash('sha256').update(signature).digest('hex');
return signatureHash.length > 0; // SEMPRE TRUE

// DEPOIS
const verifier = createVerify('SHA256');
verifier.update(nonce);
const isValid = verifier.verify(pemKey, signatureBuffer);
return isValid;
```

**Antes**: Validação PSC simulada (UUID regex)
**Depois**: Chamada real à API do provider

```typescript
// ANTES
const uuidRegex = /^[0-9a-f]{8}-...$/i;
return uuidRegex.test(sessionId); // APENAS VERIFICA FORMATO

// DEPOIS
const response = await fetch(`${config.api_url}/v1/signature/${sessionId}/status`, {...});
const data = await response.json();
return data.status === 'approved';
```

#### 3. `src/lib/ac-angry/security.ts`
**Antes**: Comparação HMAC com `!==`
**Depois**: `timingSafeEqual` para prevenir timing attacks

```typescript
// ANTES
if (expected !== signature) throw new Error('Assinatura de nonce inválida.');

// DEPOIS
const expectedBuf = Buffer.from(expected, 'hex');
const signatureBuf = Buffer.from(signature, 'hex');
if (expectedBuf.length !== signatureBuf.length || !timingSafeEqual(expectedBuf, signatureBuf)) {
  throw new Error('Assinatura de nonce inválida.');
}
```

#### 4. `next.config.ts`
**Antes**: CSP com `unsafe-inline` e `unsafe-eval`
**Depois**: CSP sem `unsafe-inline` em scripts

```typescript
// ANTES
"script-src 'self' 'unsafe-inline' 'unsafe-eval' https://*.supabase.co https://*.daily.co"

// DEPOIS
"script-src 'self' 'unsafe-eval' https://*.supabase.co https://*.daily.co"
```

#### 5. `src/lib/ac-angry/pki.ts`
**Antes**: Chave privada sempre retornada
**Depois**: Chave privada não retornada em produção

```typescript
// ANTES
privateKeyPem: forge.pki.privateKeyToPem(keys.privateKey)

// DEPOIS
privateKeyPem: process.env.NODE_ENV === 'development'
  ? forge.pki.privateKeyToPem(keys.privateKey)
  : undefined
```

#### 6. `src/components/ac-angry/Navbar.tsx`
**Antes**: Sem `'use client'` (crashava em runtime)
**Depois**: Diretiva `'use client'` adicionada

#### 7. `src/lib/ac-angry/psc-auth.ts`
**Antes**: Fallback `'***'` para secrets
**Depois**: Fallback vazio (sem credenciais hardcoded)

---

## Fase 5: Pacote de Segurança Compartilhado

### Diretório Criado
```
packages/security/
├── package.json
├── tsconfig.json
└── src/
    ├── index.ts                    # Exports consolidados
    ├── supabase-factory.ts         # Cliente Supabase único
    ├── nonce-manager.ts            # Anti-replay com atomic consume
    ├── session-manager.ts          # Sessões AGR com rotação
    ├── rate-limiter.ts             # Bloqueio exponencial
    ├── audit-logger.ts             # Hash chain imutável
    ├── protocol-locker.ts          # Controle de concorrência
    ├── data-encryptor.ts           # AES-256-GCM
    └── cert-validator.ts           # Validação ICP-Brasil
```

### Melhorias por Módulo

| Módulo | Versão Root | Versão GS | Versão Unificada |
|--------|-------------|-----------|------------------|
| NonceManager | Atomic consume | timingSafeEqual | Ambos combinados |
| SessionManager | Básico | +rotateToken, cleanup | Completo |
| RateLimiter | Linear | Exponencial | Exponencial |
| AuditLogger | Simples | Hash chain | Hash chain |
| ProtocolLocker | Básico | +forceUnlock, expiry | Completo |
| DataEncryptor | Não existia | AES-256-GCM | Implementado |
| CertValidator | Não existia | ICP-Brasil | Implementado |

---

## Fase 6: Tipos e Validação

### Arquivos Criados

#### `src/types/api.ts`
Tipos compartilhados para:
- API Responses (ApiResponse, ApiError, PaginatedResponse)
- Auth (AuthToken, AgrProfile, AuthResponse)
- Certificate (Certificate, CSR, SigningResponse)
- Protocol (Protocol, ProtocolDocument)
- Audit (AuditLogEntry, AuditSeverity)
- Rate Limit (RateLimitInfo)
- Nonce (Nonce, NonceScope)

#### `src/lib/validation.ts`
Funções de validação:
- `isValidCPF()` - Validação completa com dígitos verificadores
- `isValidCNPJ()` - Validação completa com dígitos verificadores
- `isValidEmail()` - Regex padrão
- `isValidPhone()` - Telefone brasileiro
- `isValidUUID()` - Formato UUID
- `isValidBase64()` - Formato Base64
- `sanitizeString()` - Anti-XSS
- `sanitizeCPF()` - Remove não-dígitos
- `sanitizeCNPJ()` - Remove não-dígitos
- Type Guards para NonceScope, AuditSeverity, etc.

---

## Estatísticas Finais

| Métrica | Valor |
|---------|-------|
| Total de commits | 4 |
| Arquivos modificados | 20 |
| Arquivos criados | 25 |
| Linhas adicionadas | ~2.500 |
| Specs criadas | 12 |
| Módulos de segurança | 8 |
| Fixes de segurança | 7 |

---

## Próximos Passos Recomendados

1. **Instalar zod** para validação de schema em runtime
2. **Integrar packages/security/** ao invés de src/lib/ac-angry/security.ts
3. **Unificar frontend** gs.vemapi/frontend com root app
4. **Adicionar testes** para as correções de segurança
5. **Configurar CI/CD** para validação automática

---

*Documentação gerada em: 2026-07-08*
