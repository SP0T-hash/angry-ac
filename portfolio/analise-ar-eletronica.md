# Análise — Repositório `ar-eletronica` (RI / AR Eletrônica)

Clonado de `https://github.com/SP0T-hash/ar-eletronica.git` (commit `927b549`) para
`/Users/vitor/Documents/GitHub/ar-eletronica`. Este é o sistema **RI / AR Eletrônica** da suíte.

## Stack
- **Frontend**: React 19 + Vite 7 + Tailwind 4 + shadcn/ui (radix) + wouter + TanStack Query + tRPC client.
- **Backend**: Express + tRPC server (`server/_core`) + Drizzle ORM.
- **Banco**: MySQL/TiDB via Drizzle (`drizzle/schema.ts`), migrations em `drizzle/migrations` (vazias ainda).
- **Testes**: Vitest (`server/ar-engine.test.ts`, `server/auth.logout.test.ts`).
- **Qualidade**: `tsc --noEmit`, Prettier, ESLint via `eslint.config`? (não presente; usa `tsc`+prettier).
- **White-label**: `client/src/branding.ts` com variáveis `VITE_*`; sem hex/texto de fornecedor hardcoded nas telas principais (propagado conforme `todo.md`).

## Arquitetura implementada (conforme `docs/AR-ELETRONICA-CLOUD.md`)
1. **Motor de decisão puro** (`shared/ar.ts`): `evaluateIdentity(signals)` determinístico e explicável.
   - Regras: Termo aceito → documento → liveness → batimento biométrico (mín. 80) → bases →
     Lista Negativa → PEP → Judiciário/MP → tecnologia embarcada → PJ → evidência faltante.
   - Saídas: `APPROVE | REJECT | FALLBACK` com `reasons`, `riskScore`, `fallbackReason`, `ruleVersion`.
2. **Dossiê append-only com hash chain** (`server/ar-engine.ts`): `canonicalJson` + SHA-256;
   `verifyHashChain` detecta adulteração. Eventos: `IDENTITY_DECISION`, `TERM_ACCEPTED`.
3. **Adaptadores de integração** (`server/integrations.ts`): interfaces tipadas; provedores
   não configurados lançam `UnconfiguredProviderError`; `blockedCertificateAuthorityProvider`
   **sempre bloqueia emissão**. Nenhum endpoint/credencial fictícia.
4. **Retenção**: `assertRetentionYears` impede < 7 anos; `retentionDateFromNow` calcula UTC+7y.
5. **Idempotência/correlação**: `idempotencyKey` (rejeita duplicata) + `correlationId` persistidos.
6. **Demo modes**: `?demo=complete|fallback|rejected|error|unavailable` sem persistir dados.

## Pontos fortes (reutilizar em outros sistemas)
- Motor explicável + hash chain auditável → modelo para GS/AC Angry.
- Bloqueio de emissão por design (`PRODUCTION_BLOCKED`).
- White-label por configuração (padrão a replicar na Landing/GS/AC Angry).
- Cobertura de testes do motor, hash chain, retenção e fallback.

## Achados de auditoria (priorizados)

### P2 — Sinais de decisão fornecidos pelo cliente
`appRouter.ar.createApplication` recebe `signals` do cliente e calcula a decisão no servidor
a partir deles. Em sandbox isso é aceitável, mas para produção o servidor deve **coletar
evidências dos provedores**, não confiar no cliente. Risco: cliente malicioso pode enviar
`sinal` tudo-verdadeiro e obter `APPROVE` (embora `issuanceEnabled:false` sempre).
**Ação**: marcar contrato como `PENDING_PROVIDER`; documentar que o "APPROVE" atual não é
evidência. Não alterar sem provedores homologados.

### P2 — `getByPublicId` expõe PII como `publicProcedure`
`routers.ts:141` retorna aplicação completa (CPF, e-mail, nome) para qualquer um que tenha o
`publicId`. Recomendar exigência de `correlationId` ou escopo de operador. Pendente de fix
(acompanhado de teste).

### P3 — `termHash` derivado da constante `TERM_TEXT`
`routers.ts:70` faz hash de `TERM_TEXT` (texto canônico constante). O `todo.md` marca como
"feito" substituir por hash do termo **exibido/aceito** com versão. Atualmente não há
versionamento do termo nem captura do texto renderizado. Baixo risco (hash é do texto canônico),
mas recomenda-se `termVersion` + hash do conteúdo efetivamente apresentado.

### P3 — `verifyHashChain` não valida explicitamente `previousHash === null` no evento gênesis
Inicia `previousHash=null` e compara; um evento gênesis com `previousHash` não-nulo seria
rejeitado, então está correto. Adicionar asserção explícita + teste para clareza.

### P3 — `README.md` ausente
`AGENTS.md` referencia `README.md`, mas não existe. Criar README preciso marcando
SANDBOX/HOMOLOGAÇÃO (sem afirmar conformidade). (Será criado neste ciclo como doc fix.)

### P3 — MySQL/TiDB vs Postgres (GS/AC Angry usam Supabase/Postgres)
Risco de fragmentação de banco na suíte. Recomendar decisão de plataforma única ou camada
de eventos para GS/AC Angry consumirem o dossiê do RI. Backlog.

### P4 — `todo.md` ainda tem itens abertos
Fluxo PJ completo, captura CIN/CNH/passaporte/CNE, QR/MRZ/NFC, liveness real, bases oficiais,
Lista Negativa, PEP/Judiciário, fila de videoconferência real, alertas agendados. Todos
`PENDING_PROVIDER` / `PENDING_AC_APPROVAL` — corretamente sem implementação fictícia.

## Status regulatório (matriz)
| Requisito | Estado |
|---|---|
| IN nº 36/2026 (métodos admissíveis / AR Eletrônica) | Base implementada; integração AC pendente |
| IN nº 36/2026 §2 (segurança equivalente, liveness) | Contrato; provedor pendente |
| IN nº 36/2026 Art. 3 (documento, biometria, Lista Negativa, Termo) | SANDBOX |
| IN nº 36/2026 Art. 5 (CIN/ICN/TSE/CNH/Senatran/IPD) | Adaptador tipado; credenciais pendentes |
| IN nº 36/2026 Art. 6 (dossiê) | Persistência base implementada |
| IN nº 36/2026 Art. 8 (PF: doc, CPF, PEP, biometria) | Fluxo SANDBOX |
| IN nº 36/2026 Art. 9 (AGR distinto / exceção AR Eletrônica) | Regra representada; DPC pendente |
| IN nº 36/2026 Arts. 11–14 (PJ, representante, procuração) | Base; verificação oficial pendente |
| IN nº 37/2026 (procedimentos biométricos) | Contrato preparado; homologação pendente |
| DOC-ICP-05 (retenção 7 anos) | IMPLEMENTED (enforce) |
| Resolução 197/2021 (AR Eletrônica) | Base; operação formal AR/AC pendente |
| Emissão de certificado | **PRODUCTION_BLOCKED** por design |

## Decisão de implementação neste ciclo
- Criar `README.md` (P3, doc-only, seguro, sem risco regulatório).
- Não alterar provedores nem lógica de decisão (depende de AC/credenciais/homologação).
- Não mover código entre repos (manter `ar-eletronica` como repositório irmão).
