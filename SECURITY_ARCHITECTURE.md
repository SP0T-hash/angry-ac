# 🔐 GS VEMAPI — Arquitetura de Segurança

## Sumário
1. [Visão Geral](#1-visão-geral)
2. [Camadas de Segurança](#2-camadas-de-segurança)
3. [Criptografia](#3-criptografia)
4. [Autenticação e Sessão](#4-autenticação-e-sessão)
5. [Controle de Acesso (RBAC)](#5-controle-de-acesso-rbac)
6. [Proteção de Dados Pessoais (LGPD)](#6-proteção-de-dados-pessoais-lgpd)
7. [Segurança de Arquivos](#7-segurança-de-arquivos)
8. [Pagamentos (PCI-DSS)](#8-pagamentos-pci-dss)
9. [Auditoria e Logs](#9-auditoria-e-logs)
10. [Middleware e Headers](#10-middleware-e-headers)
11. [Integrações com ACs](#11-integrações-com-acs)
12. [Checklist de Produção](#12-checklist-de-produção)

---

## 1. Visão Geral

O GS VEMAPI adota uma arquitetura de **defesa em profundidade** (defense in depth), com múltiplas camadas de segurança que protegem dados desde o frontend até o armazenamento.

```
┌─────────────────────────────────────────────────────────────┐
│                    CLIENTE (Browser)                         │
│  CSP · HSTS · X-Frame-Options · HttpOnly Cookies           │
└─────────────────────────┬───────────────────────────────────┘
                          │ HTTPS/TLS 1.3
┌─────────────────────────▼───────────────────────────────────┐
│              NEXT.JS MIDDLEWARE (Edge)                       │
│  Security Headers · Rate Limiting · CORS · CSRF             │
│  JWT Validation · RBAC · Session Check                      │
└─────────────────────────┬───────────────────────────────────┘
                          │
┌─────────────────────────▼───────────────────────────────────┐
│              API ROUTES (Node.js Server)                     │
│  withSecurity() HOF · Input Validation · Field Decryption   │
│  Audit Logging · Permission Check · Rate Limit              │
└─────────────────────────┬───────────────────────────────────┘
                          │
┌─────────────────────────▼───────────────────────────────────┐
│              SUPABASE / DATABASE                             │
│  Row-Level Security · Column Encryption · Encrypted Backup   │
│  Immutable Audit Logs · Parameterized Queries               │
└─────────────────────────┬───────────────────────────────────┘
                          │
┌─────────────────────────▼───────────────────────────────────┐
│              STORAGE (S3/R2 Encrypted)                       │
│  AES-256 Client-Side Encryption · Signed URLs · Access Logs │
└─────────────────────────────────────────────────────────────┘
```

## 2. Camadas de Segurança

### 2.1 Transporte (TLS)
- HTTPS obrigatório em produção
- TLS 1.3 mínimo
- HSTS com preload (max-age=31536000)
- Certificados renovados automaticamente

### 2.2 Edge (Middleware)
- **Security Headers**: CSP, X-Frame-Options, X-Content-Type-Options, etc.
- **Rate Limiting**: Por IP, com janela configurável
- **CORS**: Whitelist de origens permitidas
- **JWT Validation**: Decodifica e valida token em todas as requisições protegidas
- **GS Route Protection**: Redireciona para login se não autenticado

### 2.3 API (Server)
- **withSecurity() HOF**: Wrapper que aplica todas as verificações automaticamente
- **Input Validation**: Sanitização de entradas (XSS prevention)
- **Field Decryption**: Decripta campos sensíveis automaticamente
- **Permission Check**: RBAC granular por módulo/ação/escopo
- **Audit Logging**: Log imutável de todas as operações críticas

### 2.4 Dados (Database)
- **Row-Level Security (RLS)**: Isolamento de dados por tenant
- **Column Encryption**: AES-256-GCM para CPF, RG, CNH, dados de pagamento
- **Encrypted Backups**: Backup criptografado diário
- **Parameterized Queries**: Prevenção de SQL injection

### 2.5 Armazenamento (Files)
- **Client-Side Encryption**: Arquivos criptografados antes do upload
- **Signed URLs**: Acesso temporário e controlado
- **Validation**: Magic bytes, tamanho, tipo MIME
- **Access Logs**: Todo download é registrado

## 3. Criptografia

### 3.1 Algoritmos
| Algoritmo | Uso | Chave |
|-----------|-----|-------|
| AES-256-GCM | Dados sensíveis em repouso | 32 bytes (hex) |
| SHA-256 | Hash chain (auditoria), checksums | N/A |
| scrypt | Derivação de chave | Parâmetros OWASP |
| HMAC-SHA256 | Assinatura de tokens | 64 bytes (hex) |

### 3.2 Chaves
- **GS_ENCRYPTION_KEY**: Chave mestre para dados do GS (32 bytes hex)
- **PKI_ENCRYPTION_KEY**: Chave para artefatos de certificados (32 bytes hex)
- **AUTH_JWT_SECRET**: Assinatura de tokens JWT (64 bytes hex)
- **PKI_NONCE_SECRET**: Geração de nonces (64 bytes hex)

### 3.3 Rotação de Chaves
- Chaves de criptografia rotacionadas a cada 90 dias
- JWT secrets rotacionados a cada 30 dias
- Chaves antigas mantidas por 30 dias para descriptografia de dados legados

## 4. Autenticação e Sessão

### 4.1 Fluxo de Login
```
Usuário → Login (email + senha) → bcrypt verify → JWT emitido 
→ Cookie httpOnly + Secure + SameSite=Strict → Redireciona para Dashboard
```

### 4.2 Proteções
- **bcrypt**: Hash de senha com custo 12
- **Rate Limit**: 5 tentativas por IP a cada 5 minutos
- **Exponential Backoff**: Bloqueio dobra a cada reincidência (máx 24h)
- **Session Rotation**: Token é rotacionado após ações críticas
- **Session Termination**: Usuário pode ver e encerrar sessões ativas

### 4.3 JWT
```json
{
  "sub": "uuid-do-usuario",
  "nivel": "AR_ADMIN",
  "ar_id": "uuid-da-ar",
  "unidade_id": "uuid-da-unidade",
  "iat": 1234567890,
  "exp": 1234596690
}
```

## 5. Controle de Acesso (RBAC)

### 5.1 Hierarquia de Níveis
```
AC_ADMIN → AR_ADMIN → UNIDADE_ADMIN → OPERADOR → CONTADOR
     ↓           ↓            ↓            ↓           ↓
  Visão     Visão da     Visão da      Visão do    Visão da
  Global    AR inteira   Unidade       Ponto       Carteira
```

### 5.2 Permissões Granulares
```
hasPermission(user, 'PEDIDOS', 'CRIAR', 'UNIDADE')
├── Módulo: PEDIDOS, CLIENTES, FINANCEIRO, etc.
├── Ação: CRIAR, LER, ATUALIZAR, EXCLUIR, APROVAR
└── Escopo: GLOBAL, AR, UNIDADE, PROPRIO
```

## 6. Proteção de Dados Pessoais (LGPD)

### 6.1 Princípios
- **Finalidade**: Dados tratados apenas para a finalidade declarada
- **Necessidade**: Coleta apenas do mínimo necessário
- **Transparência**: Titular sabe como seus dados são usados
- **Segurança**: Medidas técnicas e administrativas de proteção

### 6.2 Bases Legais (Art. 7º LGPD)
| Finalidade | Base Legal |
|------------|------------|
| Execução do contrato | Art. 7º, V |
| Cumprimento de obrigação legal | Art. 7º, II |
| Consentimento do titular | Art. 7º, I |
| Legítimo interesse | Art. 7º, IX |

### 6.3 Direitos dos Titulares (Art. 18 LGPD)
- Confirmação e acesso → `/api/gs/lgpd/acesso`
- Correção → `/api/gs/lgpd/correcao`
- Exclusão → `/api/gs/lgpd/exclusao` (salvo obrigações legais)
- Portabilidade → `/api/gs/lgpd/portabilidade`
- Revogação de consentimento → `/api/gs/lgpd/revogar`

### 6.4 Data Masking
| Tipo | Formato |
|------|---------|
| CPF | `***.456.789-**` |
| CNPJ | `**.***.789/0001-**` |
| Email | `mar***@domain.com` |
| Telefone | `(11) ****-1234` |
| CEP | `***45-678` |

### 6.5 Períodos de Retenção
| Dado | Período | Base Legal |
|------|---------|------------|
| Dados cadastrais | 5 anos após término | Art. 12, §2º |
| Dados de pagamento | 5 anos (fiscal) | Código Tributário |
| Logs de auditoria | 5 anos | ICP-Brasil |
| Documentos (RG, CNH) | Durante vigência + 90 dias | Contrato |
| Certificados | 10 anos após emissão | ICP-Brasil |

## 7. Segurança de Arquivos

### 7.1 Validação
- Magic bytes (não confiar em extensão)
- Limite de 10MB
- MIME types permitidos: PDF, JPG, JPEG, PNG
- Hash SHA-256 antes do upload (dedup e verificação)

### 7.2 Upload Flow
```
File → Validate (size, type, magic bytes) → Encrypt (AES-256-GCM) 
→ Upload to S3/R2 → Store key + hash in DB → Signed URL for access
```

### 7.3 Acesso
- URLs assinadas com expiração (default: 1 hora)
- Todo acesso registrado no audit log
- Apenas usuários autorizados podem gerar URLs

## 8. Pagamentos (PCI-DSS)

### 8.1 Estratégia
O GS **NÃO ARMAZENA** dados de cartão de crédito. O Asaas é o responsável pelo processamento (PCI-DSS Level 1).

### 8.2 Tokenização
- Asaas retorna um `payment_id` que usamos como referência
- Dados de pagamento sensíveis nunca passam pelos nossos servidores
- Webhook assinado criptograficamente pelo Asaas

### 8.3 Split de Pagamento
- GS recebe split automaticamente via Asaas Split
- AR recebe repasse na conta Asaas configurada
- Tudo registrado em `gs_transacoes` para conciliação

## 9. Auditoria e Logs

### 9.1 Blockchain-style Audit Chain
```
genesis_hash → hash(entry1 + genesis) → hash(entry2 + hash1) → ...
Cada entrada contém o hash da entrada anterior (SHA-256)
Qualquer alteração invalida a corrente
```

### 9.2 Eventos Auditados
| Categoria | Eventos |
|-----------|---------|
| Autenticação | LOGIN, LOGOUT, LOGIN_FAILED |
| Dados | DATA_ACCESSED, DATA_EXPORTED, DATA_DELETED |
| Arquivos | FILE_UPLOADED, FILE_DOWNLOADED, FILE_DELETED |
| Pagamentos | PAYMENT_RECEIVED, PAYMENT_REFUNDED |
| Certificados | CERT_ISSUED, CERT_REVOKED |
| Admin | USER_CREATED, PERMISSION_CHANGED, CONTRACT_ACCEPTED |

### 9.3 Verificação de Integridade
```bash
# Verificar a cadeia de auditoria
GET /api/gs/admin/audit/verify
# Retorna: { valid: true, entriesChecked: 12345 }
```

## 10. Middleware e Headers

### 10.1 Security Headers (Todas as Respostas)
| Header | Valor | Proteção |
|--------|-------|----------|
| Content-Security-Policy | restritivo | XSS |
| X-Content-Type-Options | nosniff | MIME sniffing |
| X-Frame-Options | DENY | Clickjacking |
| Strict-Transport-Security | max-age=31536000 | HTTPS downgrade |
| Referrer-Policy | strict-origin-when-cross-origin | Vazamento de referrer |
| Permissions-Policy | restritivo | API abuse |
| X-XSS-Protection | 1; mode=block | XSS (legado) |

### 10.2 CSP Detalhado
```
default-src 'self';
script-src 'self' 'unsafe-inline' 'unsafe-eval' https://*.supabase.co;
style-src 'self' 'unsafe-inline' https://fonts.googleapis.com;
img-src 'self' data: blob: https://*.supabase.co https://*.r2.cloudflarestorage.com;
font-src 'self' https://fonts.gstatic.com;
connect-src 'self' https://*.supabase.co https://api.asaas.com;
frame-src 'self' https://*.asaas.com;
object-src 'none';
base-uri 'self';
form-action 'self';
```

## 11. Integrações com ACs

### 11.1 Autenticação
- API Keys armazenadas criptografadas (AES-256-GCM)
- Taxa de transferência limitada por AC
- Timeout configurável por integração

### 11.2 Validação
- Certificados recebidos são validados contra ICP-Brasil
- Chain validation (cadeia de certificação)
- CRL/OCSP check antes de aceitar
- Nonce obrigatório para ações críticas

### 11.3 Logs
- Toda requisição para AC é logada em `gs_integracao_logs`
- Payloads sensíveis são mascarados antes do log
- Alertas em caso de falha repetida

## 12. Checklist de Produção

### 🔴 Crítico
- [ ] `SUPABASE_SERVICE_ROLE_KEY` configurada e **nunca exposta no client**
- [ ] `GS_ENCRYPTION_KEY` gerada com 32 bytes aleatórios
- [ ] `AUTH_JWT_SECRET` gerado com 64 bytes aleatórios
- [ ] HTTPS configurado com certificado válido
- [ ] CSP testado e sem violações
- [ ] RLS habilitado em todas as tabelas GS
- [ ] Audit chain verificada

### 🟡 Alta Prioridade
- [ ] Rate limiting configurado por endpoint
- [ ] CORS configurado com origens específicas
- [ ] Upload criptografado habilitado
- [ ] Signed URLs para acesso a documentos
- [ ] Backup criptografado configurado
- [ ] Monitoramento de tentativas de brute force

### 🟢 Boas Práticas
- [ ] 2FA habilitado para admins (próxima fase)
- [ ] Teste de penetração agendado
- [ ] Plano de resposta a incidentes documentado
- [ ] Termos de uso aceitos por todos os usuários
- [ ] Consentimento LGPD registrado
- [ ] Análise de vulnerabilidades semanal

---

**Documento mantido pelo time de segurança GS VEMAPI**
Versão 1.0 — Julho 2026
