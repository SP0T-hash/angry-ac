# Roadmap Comercial — VEMAPI para outras ARs

Objetivo: tornar a suíte um **produto SaaS white-label vendável para múltiplas ARs** da ICP-Brasil.
Priorizado por impacto comercial × risco. Diagnóstico baseado no código real.

## Descoberta importante (já existe muito)
O **GS (backoffice)** já é um SaaS multi-tenant maduro:
- `gs_ars` com `logo_url` + `config` JSONB; tela `gs/ars` ("Gestão multi-tenant de ARs parceiras").
- `gs_integracoes_ac` — **integração de AC por AR** (`ac_provider` + `config` JSONB, `UNIQUE(ar_id, ac_provider)`).
- `gs_integracao_logs` — rastreabilidade por AR.
- Isolamento de tenant em `mutate/route.ts` e `data.ts` (AR_SCOPED_TABLES).
- Faturamento com **split GS/AR** (`gs_assinaturas.split_percent_gs/ar`).

Ou seja: operação por AR + faturamento + integração de AC por AR **já existem**. O que falta é
ligar isso à **experiência do usuário final** e ao **núcleo de identidade**.

## O que fazer PRIMEIRO (P0)

### 1. White-label POR AR na UI real
Hoje a marca vem de `VITE_*` (RI) e `env` (angry-ac) — **global**, não por AR. Cada AR quer VER
sua marca no fluxo. O `gs_ars` já guarda `logo_url`/`config`, mas Landing/AC Angry/RI não consomem.
- [x] Resolver marca por tenant (`getArBranding(arId)`) com fallback global. ← INICIADO (ciclo 2)
- [ ] Ligar branding nas telas públicas (Landing, fluxo RI, AC Angry).
- [ ] Editor de marca na tela `gs/ars` (logo, cores, textos, environmentLabel).

### 2. Tornar o RI (núcleo de identidade) multi-tenant
O `ar-eletronica` é **single-tenant**: não conhece `ar_id`. Para vender o produto de identidade a
ARs, cada AR precisa de seu próprio fluxo, dossiê e integração de AC.
- [ ] Adicionar contexto de tenant (`ar_id`/slug) ao RI (schema + config + rotas).
- [ ] Escopo de dossiê/eventos por AR.
- [ ] Consumir `gs_integracoes_ac` da AR no lugar de env global.

## Em seguida (P1)
3. **Provisionamento de AR (onboarding)**: ao criar AR no GS, provisionar tenant no RI + AC Angry.
4. **Ligar integração de AC por AR** no runtime (RI/AC Angry consomem `gs_integracoes_ac`).
5. **Artefatos comerciais**: planos/preços, contrato + DPA/LGPD por AR, doc de segurança/conformidade,
   ambiente demo (sandbox) para prospects, tracker de homologação por AR.

## Depois (P2)
6. Auditoria de isolamento de tenant no RI/AC Angry.
7. Unificar tokens white-label entre repos (`shared/brand`) — ver `unificacao.md`.
8. Site de marketing destacando oferta multi-tenant white-label.

## Decisão de partida
Começar pelo **item 1** (white-label por AR): capacidade comercial mais visível, segura e reversível,
e fundação para os demais (AC integration, provisionamento, onboarding dependem do conceito de tenant/AR).
Planejamento completo em `/Users/vitor/Desktop/VEMAPI/comercial/ROADMAP-COMERCIAL.md`.
