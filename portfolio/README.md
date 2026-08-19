# Portfolio VEMAPI — Suíte de Certificação Digital & Identidade ICP-Brasil

Esta pasta é a **camada de organização** da suíte de produtos. Ela não move código: apenas
mapeia os repositórios reais, documenta o relacionamento entre os sistemas e concentra os
registros do ciclo de auditoria/melhoria contínua (loop do OpenCode).

> Estado regulatório geral: todos os sistemas operam em **SANDBOX / HOMOLOGAÇÃO**. Nenhuma
> emissão de certificado ICP-Brasil real ocorre. Integrações externas (Datavalid, Regula,
> Safeweb, CGU, Lista Negativa, AC) estão em adaptadores explícitos e permanecem
> `PENDING_PROVIDER` / `PENDING_AC_APPROVAL` até contrato, credencial e homologação formal.

## 1. Os quatro produtos

| Produto (nome do negócio) | Papel | Repositório real | Stack | Status geral |
|---|---|---|---|---|
| **Landing page / comercial** | Apresentação, aquisição, confiança, white-label e conversão. Direciona para `/solucao` e demo do RI. | `angry-ac` → `src/app/(landing)` + `src/app/(portal)` | Next.js 16 (TS, Tailwind), Supabase/Postgres | `IMPLEMENTED` (comercial) · `SANDBOX` (dados) |
| **GS** (Gerenciamento da AR, inspirado no GFCIS/Certifica Minas) | Operação da AR: casos, filas, agentes, unidades, financeiro, tickets, indicadores, conformidade. | `angry-ac` → `src/app/gs` + `src/app/api/gs` (`SUPABASE_SCHEMA_GS.sql`) | Next.js + Supabase/Postgres | `IMPLEMENTED` · `SANDBOX` |
| **AC Angry** | Fluxo assistido de videoconferência, revisão e atendimento assistido (fallback da AR Eletrônica). | `angry-ac` → `src/app/(angry)/ac` + `src/lib/ac-angry` + `src/app/api/{ac,psbio,video,saf}` | Next.js + Supabase/Postgres | `IMPLEMENTED` · `SANDBOX` |
| **RI / AR Eletrônica** | Onboarding autosserviço, identidade, evidências, motor de decisão, dossiê eletrônico, preparação de emissão. | **repo separado** `ar-eletronica` (clone de `SP0T-hash/ar-eletronica`) em `/Users/vitor/Documents/GitHub/ar-eletronica` | React 19 + tRPC + Express + Drizzle/MySQL | `IMPLEMENTED` (motor/dossiê) · `PRODUCTION_BLOCKED` (emissão) |

### Mapeamento de nomes (para evitar confusão)

- O repositório `angry-ac` concentra **Landing + GS + AC Angry** (front Next.js) e referências
  a um backend .NET (`gs.vemapi` / CoreAr) que, neste ambiente, aparece apenas como referência
  stale (ausente em disco). O RI/AR Eletrônica vive em repositório próprio (`ar-eletronica`).
- `RI` = Registro de Identidade / plataforma de identificação digital = **AR Eletrônica**.
- `GS` ≠ AC Angry: GS é operação da AR (backoffice); AC Angry é atendimento assistido/fallback.

## 2. Relacionamento entre os sistemas

```
Landing ──CTA/demo──▶ RI/AR Eletrônica (núcleo de identidade)
                            │  dossiê, decisão, eventos, alertas
                            ├──────────────▶ GS (operação/backoffice consome estados)
                            └──────────────▶ AC Angry (fallback: só recebe casos encaminhados)
```

Contrato de integração esperado (transversal):

- `publicId` — identificador público do dossiê/solicitação.
- `correlationId` — correlação de requisição (rastreia todas as chamadas de uma sessão).
- `idempotencyKey` — prevenção de duplicidade em criação/avaliação.
- Status canônicos: `DRAFT → IN_PROGRESS → APPROVED | REJECTED | FALLBACK → ISSUANCE_BLOCKED`.
- Timestamps em **UTC**; retenção mínima de **7 anos** (piso obrigatório, sem valor inferior).
- Emissão real sempre `PRODUCTION_BLOCKED` até AC/DPC/homologação.

## 3. Documentos do loop (nesta pasta)

| Arquivo | Conteúdo |
|---|---|
| `mapa-produtos.md` | Tabela rápida de mapeamento e responsáveis por sistema. |
| `analise-ar-eletronica.md` | Análise técnica/regulatória do repositório recém-adicionado. |
| `shared/opencode-loop-log.md` | Registro de cada ciclo (notas antes/depois, arquivos, testes, riscos). |
| `shared/research-log.md` | Pesquisas externas (fontes, data, decisão de implementação). |
| `shared/CHANGELOG-OPENCODE.md` | Changelog detalhado por commit. |
| `shared/RELATORIO-MANHA.md` | Resumo executivo para leitura matinal. |

## 4. Como trabalhar

- Os repositórios são independentes (git separado). Não aninhar git: manter `ar-eletronica`
  como repositório irmão em `/Users/vitor/Documents/GitHub/ar-eletronica`.
- Para incluir o RI como submódulo no futuro, usar `git submodule add` em branch de trabalho
  (não em main), registrando o hash remoto no relatório. **Ação não executada ainda** (pendente de autorização).
- Regras de autonomia e de não-invenção de integrações estão em `ar-eletronica/docs/...` e
  replicadas no prompt mestre do loop.
