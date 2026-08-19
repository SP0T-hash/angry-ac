# Unificação da Suíte — angry-ac × ar-eletronica

Documento de **junção** dos dois repositórios. Objetivo: identificar duplicações, lacunas,
contratos incompatíveis e oportunidades de unificação, sem reescrever o que já funciona.

## 1. Sobreposições e duplicações

| Capacidade | angry-ac (AC Angry) | ar-eletronica (RI) | Ação recomendada |
|---|---|---|---|
| **Auditoria imutável / hash chain** | Trigger no Supabase (`SUPABASE_SCHEMA*.sql`, `compute_audit_hash`) | `server/ar-engine.ts` (canonicalJson + SHA-256, `verifyHashChain`) | Compartilhar uma **lib de hash-chain** (tipo `shared/audit-chain`) usada por ambos. |
| **Nonce anti-replay** | `NonceManager` (HMAC + consumo atômico) | `idempotencyKey` em `createApplication` | RI já cobre idempotência; AC Angry mantém nonce para ações A3. Reutilizar `NonceManager` no RI se necessário. |
| **Catálogo de provedores** | `psc-auth.ts`, `soluti-vidaas.ts` (ad-hoc) | `shared/provider-catalog.ts` (tipado) | RI tem catálogo melhor. angry-ac deve adotar o mesmo shape de adaptadores (`SANDBOX`/`PENDING`). |
| **White-label** | Tailwind + `.env` por tela | `branding.ts` com `VITE_*` | Única fonte de marca: extrair para pacote `shared/brand` consumido por Next e Vite. |
| **Status canônicos** | `protocols.status` (PENDING/IN_PROGRESS/.../ISSUED) | `identity_applications.status` (DRAFT/.../APPROVED/REJECTED/FALLBACK) | Mapear 1:1 em tabela de tradução; RI como fonte de verdade do estado de identidade. |
| **Banco** | Supabase/Postgres | Drizzle/MySQL(TiDB) | Fragmentação. Recomendar eventos/CDC do RI → GS/AC Angry, ou decisão de plataforma única. |

## 2. Lacunas cross-sistema
- **GS não consome o dossiê do RI**: hoje o GS opera em Supabase próprio; não há ponte para
  os eventos/alertas do RI. Necessário adaptador de eventos (webhook/fila).
- **AC Angry não devolve ao motor do RI**: quando um caso é encaminhado do RI para videoconferência,
  o retorno (decisão do operador) deve gerar um `DossierEvent` no RI. Hoje os sistemas são isolados.
- **Termo de Titularidade**: RI registra hash + aceite; AC Angry coleta em fluxo A3. Unificar
  modelo de Termo (mesma versão, mesmo hash) para trilha consistente.
- **Retenção**: RI enforce 7 anos; angry-ac depende de política do Supabase. Alinhar piso.

## 3. Contrato de integração transversal (proposta)
- `publicId` (RI) ↔ `protocolId`/`id` (AC Angry/GS) via `correlationId`.
- `idempotencyKey` em toda criação/avaliação.
- Status canônicos: `DRAFT → IN_PROGRESS → APPROVED|REJECTED|FALLBACK → ISSUED|BLOCKED`.
- Eventos: `DossierEvent{ type, payload, previousHash, eventHash, actor, ts(UTC) }`.
- Emissão sempre `PRODUCTION_BLOCKED` até AC/DPC/homologação.
- Provedores: `SANDBOX | PENDING_PROVIDER | PENDING_AC_APPROVAL | PRODUCTION_BLOCKED`.

## 4. Arquitetura-alvo (sugerida, não implementada neste ciclo)
```
[RI/AR Eletrônica] -- eventos(dossiê) --> [Event Bus / Webhook]
                                            |--> [GS] (backoffice, indicadores)
                                            |--> [AC Angry] (fallback, revisão)
[Landing] -- CTA/demo --> [RI]
```
- Lib compartilhada `shared-core` (hash-chain, provider-catalog, brand, status-map, types).
- Monorepo ou pacote publicado internamente; hoje são 2 repos → manter via submódulo
  (`ar-eletronica` como submódulo de `angry-ac` em branch de trabalho, após autorização).

## 5. Backlog de unificação (P2–P3)
1. Extrair lib de hash-chain compartilhada.
2. Catálogo de provedores único (shape do RI) no angry-ac.
3. Tokens white-label centralizados (`shared/brand`).
4. Tabela de mapeamento de status canônicos.
5. Ponte de eventos RI → GS/AC Angry (webhook/CDC).
6. Política de retenção 7 anos aplicada no Supabase do angry-ac.
7. `todo.md` único da suíte referenciando os 4 sistemas.
