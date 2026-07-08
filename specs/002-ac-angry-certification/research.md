# Research: AC ANGRY - Motor de Certificação Digital

## node-forge vs crypto nativo

### node-forge
**Vantagens:**
- API completa para X.509, CSR, PKCS#12
- Suporte a RSA 2048/4096 e ECC
- Geração de certificados e CAs
- Fácil de usar com TypeScript

**Desvantagens:**
- Performance inferior ao crypto nativo
- Dependência externa
- Manutenção limitada

### crypto nativo (Node.js)
**Vantagens:**
- Performance superior
- Sem dependências externas
- Suporte a HSM via PKCS#11

**Desvantagens:**
- API mais baixo nível
- Não suporta X.509 nativamente
- Requer implementação manual de CSR/certificados

**Decisão**: node-forge para desenvolvimento e testes. Em produção, considerar migração para crypto nativo + HSM.

---

## Conformidade ICP-Brasil

### DOC-ICP-01
- Algoritmos permitidos: RSA 2048/4096, ECC P-256/P-384
- Hashing: SHA-256, SHA-384
- Validade máxima: A1 (1 ano), A3 (3 anos)
- Container PFX: AES-256-CBC

### ABNT NBR 15527
- Certificados de chave pública
- Estrutura X.509 v3
- Extensões obrigatórias: BasicConstraints, KeyUsage

### LGPD
- Criptografia de dados sensíveis
- Consentimento do titular
- Direito ao esquecimento
- Registro de operações (audit trail)

---

## Padrões de Nonce Anti-Replay

### HMAC-SHA256
- Nonce: random_bytes(32).hex() + "." + hmac_sha256(secret, random_bytes).hex()
- Validação: Recalcular HMAC e comparar
- Consumo: Marcar como usado (used_at != NULL)

### TTL por Scope
- AUTH: 5 minutos (operações de login)
- SIGN: 2 minutos (emissão de certificado)
- BIOMETRY: 3 minutos (validação biométrica)
- EMIT: 10 minutos (operações de emissão)

---

## Rate Limiting

### Estratégia
- Contador por scope + agr_id
- Janela deslizante (sliding window)
- Armazenamento em memória (desenvolvimento) ou Redis (produção)

### Limites Recomendados
- AUTH: 5 req/min por AGR
- SIGN: 10 req/min por AGR
- BIOMETRY: 20 req/min por AGR
- EMIT: 5 req/min por AGR

---

## Armazenamento de Certificados

### Supabase (PostgreSQL)
- Certificados em formato PEM (texto)
- RLS para isolamento por AGR
- Índices para busca por serial, CPF, CNPJ

### HSM (Produção)
- Chaves privadas em hardware
- PKCS#11 interface
- AWS CloudHSM ou Azure Dedicated HSM

---

## Testes de Conformidade

### Testes Obrigatórios
1. Validação de CSR com chave RSA 2048
2. Validação de CSR com chave RSA 4096
3. Emissão de certificado A1 (1 ano)
4. Emissão de certificado A3 (3 anos)
5. Nonce expirado é rejeitado
6. Nonce reutilizado é rejeitado
7. Rate limiting bloqueia excedentes
8. Audit log é gerado para cada operação
9. Audit log é imutável (UPDATE/DELETE bloqueado)

---

## Referências

- [DOC-ICP-01](https://www.gov.br/iti/pt-br/assuntos/icp-brasil/documentos-tecnicos)
- [ABNT NBR 15527](https://www.abnt.org.br/)
- [LGPD](https://www.planalto.gov.br/ccivil_03/_ato2015-2018/2018/lei/l13709.htm)
- [node-forge](https://github.com/digitalbazaar/forge)
- [Supabase RLS](https://supabase.com/docs/guides/auth/row-level-security)
