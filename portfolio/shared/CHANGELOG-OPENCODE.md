# CHANGELOG OPENCODE — VEMAPI Suite

Formato por commit: identificador + mensagem, data/hora, sistema, problema, hipótese/decisão,
arquivos, antes/depois, testes, rotas, referências, riscos, limitações, pendências, reversão.

---

## C1.1 — `docs(ri): adiciona README com estado sandbox/homologação e arquitetura`
- **Data/hora**: 2026-08-19 (ciclo 1)
- **Sistema**: RI / AR Eletrônica (`ar-eletronica`)
- **Problema**: `AGENTS.md` referencia `README.md` que não existia (link morto); repo sem face
  documental de estado regulatório, convidando leitores a presumir conformidade.
- **Hipótese/Decisão**: criar README explícito marcando SANDBOX/HOMOLOGAÇÃO/PRODUCTION_BLOCKED,
  sem afirmar conformidade. Reutiliza terminologia de `docs/AR-ELETRONICA-CLOUD.md`.
- **Arquivos**: `ar-eletronica/README.md` (novo).
- **Antes**: sem README; `AGENTS.md` apontava arquivo inexistente.
- **Depois**: README com stack, scripts, arquitetura, tabela de status regulatório explícito.
- **Testes**: `pnpm check` OK; `pnpm test` 13/13.
- **Rotas**: n/a (docs).
- **Referências**: `ar-eletronica/docs/AR-ELETRONICA-CLOUD.md`, `MATRIZ-REGULATORIA.md`.
- **Riscos**: baixo (doc-only).
- **Limitações**: não altera código nem comportamento.
- **Pendências**: manter README sincronizado se regra regulatória mudar.
- **Reversão**: `git revert <hash>` ou remover arquivo.

## C1.2 — `test(ri): adiciona testes de robustez do hash chain (genesis)`
- **Data/hora**: 2026-08-19 (ciclo 1)
- **Sistema**: RI / AR Eletrônica (`ar-eletronica`)
- **Problema**: `verifyHashChain` não tinha cobertura para evento gênesis com `previousHash`
  não-nulo (adulteração na raiz) nem cadeia de evento único válida.
- **Hipótese/Decisão**: adicionar 2 casos — rejeição de genesis forjado e aceitação de genesis
  válido — para documentar o contrato de imutabilidade do dossiê.
- **Arquivos**: `ar-eletronica/server/ar-engine.test.ts`.
- **Antes**: 11/11 testes.
- **Depois**: 13/13 testes (os 2 novos verdes).
- **Testes**: `pnpm test` 13/13.
- **Rotas**: n/a (teste unitário).
- **Referências**: `server/ar-engine.ts` (`verifyHashChain`).
- **Riscos**: baixo.
- **Limitações**: cobre apenas a função; integração com DB não testada aqui.
- **Pendências**: teste de append real via `appendDossierEvent` (precisa de DB).
- **Reversão**: `git revert <hash>`.

## C1.3 — `security(ac-angry): impede aprovação simulada em adaptador Soluti Vidaas`
- **Data/hora**: 2026-08-19 (ciclo 1)
- **Sistema**: AC Angry (`angry-ac`)
- **Problema**: `soluti-vidaas.requestPushSignature` retornava `{ success: true, request_id: 'SOL-REQ-999' }`
  hardcoded → resposta de API inventada, violando a regra de não invenção e o padrão fail-safe
  do próprio projeto (`psc-auth` lança quando não configurado).
- **Hipótese/Decisão**: tornar o método fail-safe (throw `PENDING_PROVIDER`/`PENDING_HOMOLOGATION`),
  sem simular sucesso; tipar o adapter (`any` → interfaces) e usar parâmetros no log para traçabilidade.
  Função não tem chamadores em `src` (grep confirmou), logo sem risco de quebra.
- **Arquivos**: `angry-ac/src/lib/ac-angry/soluti-vidaas.ts`.
- **Antes**: retorno falso `success: true`.
- **Depois**: lança erro explícito de não implementação; lint 0 problemas no arquivo.
- **Testes**: ESLint do arquivo → 0 problemas; `tsc --noEmit` sem erros no arquivo.
- **Rotas**: n/a (adapter não chamado em fluxo atual).
- **Referências**: padrão fail-safe em `src/lib/ac-angry/psc-auth.ts`.
- **Riscos**: baixo (fail-safe mais rigoroso).
- **Limitações**: integração real ainda pendente de credencial/contrato/homologação.
- **Pendências**: implementar chamada real quando AC/DPC e provedor contratados.
- **Reversão**: `git revert <hash>`.

## C2.1 — `env(ri): adiciona configuração de ambientes dev/prod e indicador de ambiente`
- **Data/hora**: 2026-08-19 (ciclo 2)
- **Sistema**: RI / AR Eletrônica (`ar-eletronica`)
- **Problema**: sem separação dev/prod nem distinção visual do ambiente ativo.
- **Hipótese/Decisão**: `shared/config.ts` (ENVIRONMENT, ISSUANCE_ENABLED com guarda) + `.env.*.example` + `EnvironmentBadge` fixo em `App.tsx`.
- **Arquivos**: `shared/config.ts`, `.env.development.example`, `.env.production.example`, `client/src/components/EnvironmentBadge.tsx`, `client/src/App.tsx`.
- **Antes**: sem config/banner. **Depois**: ambientes documentados; badge mostra ambiente + "emissão bloqueada"; emissão bloqueada por padrão.
- **Testes**: `pnpm check` OK; `pnpm test` 13/13. **Rotas**: `/`,`/solucao`,`/operacao`.
- **Referências**: `client/src/branding.ts`, `docs/AR-ELETRONICA-CLOUD.md`.
- **Riscos**: baixo. **Limitações**: deep visual redesign não realizado (sem navegador p/ validar).
- **Pendências**: `.env.production` real no go-live. **Reversão**: `git revert <hash>`.

## C2.2 — `env(angry): adiciona ambientes dev/prod e banner de ambiente nos layouts`
- **Data/hora**: 2026-08-19 (ciclo 2)
- **Sistema**: Landing/GS/AC Angry (`angry-ac`)
- **Problema**: sem separação dev/prod explícita nem indicador visual de ambiente.
- **Hipótese/Decisão**: `src/lib/env.ts` + `.env.*.example` + `EnvironmentBanner` nos layouts de grupo.
- **Arquivos**: `src/lib/env.ts`, `.env.development.example`, `.env.production.example`, `src/components/EnvironmentBanner.tsx`, `src/app/(landing)/layout.tsx`, `src/app/(portal)/layout.tsx`, `src/app/(angry)/layout.tsx`, `src/app/gs/layout.tsx`.
- **Antes**: sem config/banner. **Depois**: ambientes documentados; banner mostra ambiente + "emissão bloqueada"; emissão bloqueada por padrão.
- **Testes**: `tsc` sem erros nos alterados; ESLint limpo; `npm run test` 45/45. **Rotas**: landing/portal/angry/gs.
- **Referências**: `src/lib/ac-angry/security.ts`, Next.js env loading.
- **Riscos**: baixo. **Limitações**: exemplo apenas; valores reais no go-live.
- **Pendências**: unificar white-label com RI. **Reversão**: `git revert <hash>`.
