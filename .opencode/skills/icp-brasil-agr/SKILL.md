---
name: icp-brasil-agr
description: "Conhecimento operacional e técnico sobre ICP-Brasil, ITI, Agente de Registro (AGR), Autoridade de Registro (AR), Autoridade Certificadora (AC), emissão/revogação de certificados digitais (A1/A3), coleta e verificação biométrica (PSBio) e conformidade com Instruções Normativas do ITI (ex. IN 36 de 2026). Use esta skill sempre que o usuário mencionar certificado digital, ICP-Brasil, AGR, AR, AC, ITI, PSBio, biometria (impressão digital/facial), assinatura digital (XAdES/CAdES/PAdES), Termo de Titularidade, PEP (Pessoa Exposta Politicamente), ou pedir ajuda com o sistema AC ANGRY, troubleshooting de emissão/revogação de certificado, ou dúvidas sobre normas do ITI — mesmo que o usuário não use esses termos exatos e apenas descreva um problema no fluxo de atendimento de certificação digital."
---

# ICP-Brasil / Agente de Registro

Skill de apoio operacional e técnico para quem trabalha como Agente de Registro (AGR) ou dá suporte a sistemas de emissão de certificados digitais ICP-Brasil.

## Quando usar

- Dúvidas sobre papéis do ecossistema (AC, AR, AGR, PSBio, PSC, ACT)
- Checklist de conformidade com Instruções Normativas do ITI (identificação, biometria)
- Troubleshooting de emissão/revogação de certificado (ex: sistema AC ANGRY)
- Dúvidas sobre tipos de certificado (A1, A3, e-CPF, e-CNPJ)
- Integração técnica: assinatura digital (XAdES/CAdES/PAdES), bibliotecas (Demoiselle Signer), APIs (gov.br)
- Escrever ou revisar procedimentos internos, scripts de atendimento, ou documentação para AGRs

## Como usar

1. **Glossário e papéis**: para dúvidas conceituais de quem-faz-o-quê, consulte `references/glossario.md`.
2. **Conformidade / biometria**: para checklist de identificação e biometria (IN 36/2026, DOC-ICP-05.03), consulte `references/checklist-conformidade.md`. Sempre confira a data da norma citada — o ITI atualiza essas instruções normativas com frequência; se a pergunta envolver uma versão específica, sinalize ao usuário para confirmar no repositório oficial (repositorio.iti.gov.br) antes de agir, pois a norma pode ter mudado desde o registro nesta skill.
3. **Integração técnica**: para snippets e bibliotecas de assinatura digital/leitura de certificado, consulte `references/integracao-tecnica.md`.
4. **Troubleshooting AC ANGRY**: trate como um sistema interno de emissão — peça o erro exato exibido, a etapa do fluxo (cadastro, biometria, emissão, revogação) e se o erro é do lado do PSBio, da AC, ou do software local, antes de propor uma solução.

## Princípios ao responder

- Nunca invente números de artigo/parágrafo de Instrução Normativa — se não tiver certeza do texto exato, diga que precisa confirmar na fonte oficial (gov.br/iti) em vez de citar de memória.
- Trate biometria e dados de identificação de titulares como dados sensíveis: não gere, armazene ou repita CPFs, dados biométricos ou documentos de identidade reais em exemplos — use sempre dados fictícios (ex: `123.456.789-00` claramente marcado como exemplo).
- Ao escrever código de integração (assinatura, leitura de certificado), priorize bibliotecas já auditadas/usadas no mercado ICP-Brasil (Demoiselle Signer, BouncyCastle) em vez de reimplementar criptografia do zero.
