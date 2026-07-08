# Data Model: AC ANGRY - Motor de Certificação Digital

## Entidades Principais

### security_nonces
Armazena nonces de uso único para prevenção de ataques de replay.

| Coluna | Tipo | Constraints | Descrição |
|--------|------|-------------|-----------|
| id | uuid | PRIMARY KEY, DEFAULT gen_random_uuid() | Identificador único |
| nonce | text | NOT NULL, UNIQUE | Token nonce com assinatura HMAC |
| scope | text | NOT NULL, CHECK (scope IN ('AUTH','SIGN','BIOMETRY','EMIT')) | Escopo de uso |
| protocol_id | uuid | FOREIGN KEY → protocols(id) | Protocolo associado |
| agr_id | uuid | FOREIGN KEY → agents(id) | Agente de Registro |
| expires_at | timestamptz | NOT NULL | Data/hora de expiração |
| used_at | timestamptz | NULL | Data/hora do uso (NULL = não usado) |
| created_at | timestamptz | DEFAULT now() | Data/hora de criação |

**Índices:**
- `idx_nonces_nonce` ON (nonce) - Busca rápida por nonce
- `idx_nonces_expires` ON (expires_at) - Limpeza de nonces expirados
- `idx_nonces_scope_agr` ON (scope, agr_id) - Controle de rate limiting

**RLS Policies:**
- Service role pode inserir e atualizar nonces
- Usuários autenticados podem ler apenas seus próprios nonces

---

### audit_logs
Trilha de auditoria imutável para todas operações críticas.

| Coluna | Tipo | Constraints | Descrição |
|--------|------|-------------|-----------|
| id | uuid | PRIMARY KEY, DEFAULT gen_random_uuid() | Identificador único |
| event_type | text | NOT NULL | Tipo do evento (CERT_SIGNED, AUTH_SUCCESS, etc.) |
| agr_id | uuid | NULL | Agente de Registro |
| protocol_id | uuid | NULL | Protocolo associado |
| ip_address | inet | NULL | Endereço IP |
| payload | jsonb | NULL | Dados detalhados do evento |
| severity | text | NOT NULL, CHECK (severity IN ('INFO','WARNING','ERROR','CRITICAL')) | Severidade |
| created_at | timestamptz | DEFAULT now() | Data/hora do evento |

**Índices:**
- `idx_audit_event_type` ON (event_type) - Filtro por tipo
- `idx_audit_agr` ON (agr_id) - Filtro por agente
- `idx_audit_created` ON (created_at) - Consultas temporais

**RLS Policies:**
- Service role pode inserir logs
- Logs são somente leitura (não UPDATE/DELETE)
- REVOKE UPDATE, DELETE ON audit_logs FROM authenticated;

---

### certificates
Armazena certificados digitais emitidos.

| Coluna | Tipo | Constraints | Descrição |
|--------|------|-------------|-----------|
| id | uuid | PRIMARY KEY, DEFAULT gen_random_uuid() | Identificador único |
| serial_number | text | NOT NULL, UNIQUE | Número de série do certificado |
| pem | text | NOT NULL | Certificado em formato PEM |
| ca_chain_pem | text | NOT NULL | Cadeia de certificação CA |
| titular_name | text | NOT NULL | Nome do titular |
| titular_cpf | text | NULL | CPF do titular |
| titular_cnpj | text | NULL | CNPJ do titular |
| titular_email | text | NULL | Email do titular |
| product | text | NOT NULL | Tipo do produto (e-CPF A1, e-CNPJ A3, etc.) |
| validity_not_before | timestamptz | NOT NULL | Data de início da validade |
| validity_not_after | timestamptz | NOT NULL | Data de término da validade |
| agr_id | uuid | NOT NULL, FOREIGN KEY → agents(id) | Agente emissor |
| protocol_id | uuid | NULL, FOREIGN KEY → protocols(id) | Protocolo associado |
| status | text | DEFAULT 'active', CHECK (status IN ('active','revoked','expired')) | Status do certificado |
| created_at | timestamptz | DEFAULT now() | Data/hora de emissão |

**Índices:**
- `idx_certs_serial` ON (serial_number) - Busca por número de série
- `idx_certs_titular_cpf` ON (titular_cpf) - Busca por CPF
- `idx_certs_titular_cnpj` ON (titular_cnpj) - Busca por CNPJ
- `idx_certs_agr` ON (agr_id) - Filtro por agente
- `idx_certs_status` ON (status) - Filtro por status

**RLS Policies:**
- Service role pode inserir e ler certificados
- AGR pode ler apenas seus próprios certificados

---

### sessions
Sessões autenticadas dos Agentes de Registro.

| Coluna | Tipo | Constraints | Descrição |
|--------|------|-------------|-----------|
| id | uuid | PRIMARY KEY, DEFAULT gen_random_uuid() | Identificador único |
| agr_id | uuid | NOT NULL, FOREIGN KEY → agents(id) | Agente de Registro |
| token | text | NOT NULL, UNIQUE | Token de sessão |
| ip_address | inet | NULL | Endereço IP de criação |
| expires_at | timestamptz | NOT NULL | Data/hora de expiração |
| created_at | timestamptz | DEFAULT now() | Data/hora de criação |
| last_access_at | timestamptz | DEFAULT now() | Último acesso |

**Índices:**
- `idx_sessions_token` ON (token) - Validação de token
- `idx_sessions_agr` ON (agr_id) - Sessões por agente
- `idx_sessions_expires` ON (expires_at) - Limpeza de sessões expiradas

**RLS Policies:**
- Service role pode gerenciar sessões
- Sessões são privadas por agente

---

### agents
Agentes de Registro (AGRs) credenciados.

| Coluna | Tipo | Constraints | Descrição |
|--------|------|-------------|-----------|
| id | uuid | PRIMARY KEY, DEFAULT gen_random_uuid() | Identificador único |
| name | text | NOT NULL | Nome do agente |
| cnpj | text | NOT NULL, UNIQUE | CNPJ do agente |
| email | text | NOT NULL | Email de contato |
| phone | text | NULL | Telefone de contato |
| status | text | DEFAULT 'active', CHECK (status IN ('active','suspended','revoked')) | Status do agente |
| created_at | timestamptz | DEFAULT now() | Data/hora de criação |

---

### protocols
Protocolos de atendimento (sessões de emissão).

| Coluna | Tipo | Constraints | Descrição |
|--------|------|-------------|-----------|
| id | uuid | PRIMARY KEY, DEFAULT gen_random_uuid() | Identificador único |
| agr_id | uuid | NOT NULL, FOREIGN KEY → agents(id) | Agente responsável |
| titular_name | text | NOT NULL | Nome do titular |
| titular_cpf | text | NULL | CPF do titular |
| titular_cnpj | text | NULL | CNPJ do titular |
| status | text | DEFAULT 'pending', CHECK (status IN ('pending','in_progress','completed','rejected')) | Status do protocolo |
| created_at | timestamptz | DEFAULT now() | Data/hora de criação |
| completed_at | timestamptz | NULL | Data/hora de conclusão |

---

## Relacionamentos

```
agents (1) ──── (N) protocols
agents (1) ──── (N) certificates
agents (1) ──── (N) sessions
protocols (1) ──── (N) certificates
protocols (1) ──── (N) security_nonces
```

## Regras de Negócio

1. **Ledger Imutável**: audit_logs não podem ser modificados (REVOKE UPDATE/DELETE)
2. **Nonces One-Time**: security_nonces são consumidos após uso (used_at != NULL)
3. **Validade de Certificado**: A1 = 1 ano, A3 = 3 anos
4. **Serial Number**: Gerado aleatoriamente (16 bytes hex)
5. **CA Lazy**: Chaves da CA são geradas apenas na primeira requisição
