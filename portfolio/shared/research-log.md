# Research Log — VEMAPI Suite

Registro de fontes externas públicas, data de acesso, resumo e decisão de implementação.
Não copiar código proprietário, marcas ou textos protegidos. Princípios > clones.

## 2026-08-19 (Ciclo 1)

### Fontes oficiais ICP-Brasil / ITI (revisadas via documentação do repositório `ar-eletronica`)
- **Resolução CG ICP-Brasil nº 197/2021** — AR Eletrônica (100% eletrônica, automatizada, sem AGR).
  Fonte: https://www.gov.br/iti/pt-br/assuntos/legislacao/resolucoes/resolucoes-old/resolucao197_ar_eletronica.htm
  Decisão: manter fluxo principal autosserviço sem AGR, com fallback para exceções.
- **IN ITI nº 36/2026** — métodos admissíveis de identificação (presencial, videoconferência,
  certificado ICP-Brasil, módulo eletrônico de AR, AR Eletrônica); documento, biometria, Lista
  Negativa, Termo de Titularidade; CIN/ICN/TSE/CNH/Senatran/IPD; PF/PJ.
  Fonte: https://repositorio.iti.gov.br/instrucoes-normativas/IN2026_36_identificacao_requerente.htm
  Decisão: motor de decisão do RI já reflete esses métodos em sandbox.
- **IN ITI nº 37/2026** — procedimentos biométricos (alteração de anexo DOC-ICP-05.03).
  Fonte: https://www.gov.br/iti/pt-br/assuntos/legislacao/instrucoes-normativas
  Decisão: contrato de biometria preparado; homologação pendente.
- **DOC-ICP-05 (v7.0)** — retenção mínima 7 anos, operação de dossiê.
  Fonte: https://www.gov.br/iti/pt-br/assuntos/legislacao/documentos-principais/Resolucao177_DOCICP05_compilada_v7.0.pdf
  Decisão: `assertRetentionYears` enforce piso de 7 anos (IMPLEMENTED no RI).
- **Notas Técnicas nº 5 e nº 8 / ata 24-04-2026** — consolidação normativa e minuta em construção.
  Decisão: tratar requisitos de minuta (liveness 3D, match obrigatório, deduplicação PSBio,
  atualização q5anos, vedação PJ baixada) como PENDING até publicação oficial.
- **Conclusões verificadas (doc anexado pelo usuário)** — viabilidade de construir em sandbox;
  operar dentro de AR credenciada/vinculada a AC; não emitir de forma independente. Decisão: adotado.

### Provedores candidatos (catálogo `shared/provider-catalog.ts`, sem URLs/credenciais fictícias)
- **Datavalid (SERPRO)** — 1ª trilha externa prioritária (CNH QR, cadastro, face match, liveness). PENDING.
- **Regula** — MRZ/NFC/RFID e documento. PENDING.
- **Safeweb** — biometria/liveness (Validar documentação/homologação). PENDING.
- **CGU/Portal da Transparência** — PEP (limitações conhecidas). PENDING.
- **Lista Negativa de ACs / Judiciário-MP** — fonte conforme canal confirmado pela AC. PENDING.

### Pesquisa de mercado / concorrentes (PENDENTE deste ciclo)
- Ainda não executada. Próximo ciclo: revisar publicamente GFCIS/Certifica Minas (inspiração do GS),
  e padrões de UX de onboarding de identidade (acesso, foco de teclado, contraste), extraindo princípios.
  Restrição: não afirmar homologação de concorrente sem fonte oficial + aceite da AC; manter white-label.

## Notas de implementação derivadas
- Nenhuma integração ativada em produção sem contrato, credencial e homologação (regra mantida).
- White-label: RI usa `VITE_*`; Landing/GS/AC Angry usam Tailwind/`.env` — risco de divergência (backlog).
