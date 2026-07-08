# API Contracts: AC ANGRY - Motor de Certificação Digital

## POST /api/ac/sign

### Descrição
Assina um CSR (Certificate Signing Request) e emite um certificado digital.

### Headers
```
Content-Type: application/json
Authorization: Bearer <session_token>
X-Nonce: <nonce_value>
```

### Request Body
```json
{
  "csrPem": "-----BEGIN CERTIFICATE REQUEST-----\n...\n-----END CERTIFICATE REQUEST-----",
  "titularData": {
    "name": "João da Silva",
    "cpf": "123.456.789-00",
    "email": "joao@exemplo.com.br"
  },
  "product": "e-CPF A1",
  "nonce": "abc123.def456"
}
```

### Response (200 OK)
```json
{
  "success": true,
  "certificatePem": "-----BEGIN CERTIFICATE-----\n...\n-----END CERTIFICATE-----",
  "caChainPem": "-----BEGIN CERTIFICATE-----\n...\n-----END CERTIFICATE-----",
  "serialNumber": "a1b2c3d4e5f6...",
  "validUntil": "2027-07-07T00:00:00.000Z",
  "issuer": "VEMAPI AC RAIZ"
}
```

### Error Responses

#### 400 Bad Request - CSR inválido
```json
{
  "error": "CSR não fornecido"
}
```

#### 400 Bad Request - Nonce inválido
```json
{
  "error": "Nonce já utilizado"
}
```

#### 401 Unauthorized
```json
{
  "error": "Token de sessão inválido ou expirado"
}
```

#### 429 Too Many Requests
```json
{
  "error": "Rate limit exceeded"
}
```

#### 500 Internal Server Error
```json
{
  "error": "Assinatura do CSR inválida"
}
```

---

## POST /api/ac/persist-certificate

### Descrição
Persiste um certificado emitido no banco de dados.

### Headers
```
Content-Type: application/json
Authorization: Bearer <session_token>
```

### Request Body
```json
{
  "serialNumber": "a1b2c3d4e5f6...",
  "certificatePem": "-----BEGIN CERTIFICATE-----\n...\n-----END CERTIFICATE-----",
  "caChainPem": "-----BEGIN CERTIFICATE-----\n...\n-----END CERTIFICATE-----",
  "titularData": {
    "name": "João da Silva",
    "cpf": "123.456.789-00",
    "email": "joao@exemplo.com.br"
  },
  "product": "e-CPF A1",
  "validUntil": "2027-07-07T00:00:00.000Z",
  "protocolId": "uuid-do-protocolo"
}
```

### Response (200 OK)
```json
{
  "success": true,
  "certificateId": "uuid-do-certificado"
}
```

### Error Responses

#### 400 Bad Request
```json
{
  "error": "Serial number já existe"
}
```

#### 401 Unauthorized
```json
{
  "error": "Token de sessão inválido ou expirado"
}
```

---

## POST /api/ac/generate-nonce

### Descrição
Gera um nonce de uso único para operação específica.

### Headers
```
Content-Type: application/json
Authorization: Bearer <session_token>
```

### Request Body
```json
{
  "scope": "SIGN",
  "protocolId": "uuid-do-protocolo"
}
```

### Response (200 OK)
```json
{
  "nonce": "abc123.def456",
  "expiresAt": "2026-07-07T00:02:00.000Z"
}
```

### Error Responses

#### 401 Unauthorized
```json
{
  "error": "Token de sessão inválido ou expirado"
}
```

---

## POST /api/auth/pki

### Descrição
Autentica um AGR via PKI (chave pública).

### Headers
```
Content-Type: application/json
```

### Request Body
```json
{
  "certificatePem": "-----BEGIN CERTIFICATE-----\n...\n-----END CERTIFICATE-----",
  "signature": "base64_da_assinatura",
  "challenge": "nonce_para_autenticacao"
}
```

### Response (200 OK)
```json
{
  "success": true,
  "sessionToken": "token_de_sessao",
  "agrId": "uuid-do-agente",
  "expiresAt": "2026-07-07T01:00:00.000Z"
}
```

### Error Responses

#### 401 Unauthorized
```json
{
  "error": "Certificado inválido ou revogado"
}
```

#### 403 Forbidden
```json
{
  "error": "Assinatura inválida"
}
```

---

## Rate Limits

| Endpoint | Limite | Janela |
|----------|--------|--------|
| POST /api/ac/sign | 10 req/min | Deslizante |
| POST /api/ac/persist-certificate | 20 req/min | Deslizante |
| POST /api/ac/generate-nonce | 30 req/min | Deslizante |
| POST /api/auth/pki | 5 req/min | Deslizante |

---

## Auditoria

Todas as operações são registradas com:
- `eventType`: Tipo do evento
- `agrId`: Identificador do AGR
- `protocolId`: Identificador do protocolo (quando aplicável)
- `ipAddress`: Endereço IP do cliente
- `payload`: Dados detalhados da operação
- `severity`: INFO, WARNING, ERROR, CRITICAL

### Event Types
- `CERT_SIGNED`: Certificado emitido com sucesso
- `CERT_SIGN_ERROR`: Erro na emissão do certificado
- `AUTH_SUCCESS`: Autenticação bem-sucedida
- `AUTH_FAILURE`: Falha na autenticação
- `NONCE_GENERATED`: Nonce gerado
- `NONCE_CONSUMED`: Nonce consumido
- `RATE_LIMIT_EXCEEDED`: Rate limit atingido
