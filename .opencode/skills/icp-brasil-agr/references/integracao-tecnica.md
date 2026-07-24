# Integração técnica — assinatura digital e certificados ICP-Brasil

## Bibliotecas recomendadas (não reinventar criptografia)

| Necessidade | Biblioteca | Linguagem | Observação |
|---|---|---|---|
| Assinar/validar PDF (PAdES) | `demoiselle/signer` + `estevaocm/AssinadorPdf` | Java | Baseado em PDFBox + BouncyCastle |
| Assinatura genérica (CAdES/XAdES) | `demoiselle/signer` | Java | Componentes ICP-Brasil-ready |
| Autenticação com certificado A1/A3 no navegador | ver `c0h1b4/autenticacao-ICP-Brasil` | Node/PHP/Nginx | Mapeia CN do certificado para CPF/CNPJ (formato `NOME:CPF`) |
| Integração com API gov.br de assinatura | `servicosgovbr/manual-integracao-assinatura-eletronica` | — | Escopo `icp_brasil` força assinatura qualificada; combinar com `govbr` permite o cidadão escolher |
| Integração com PJE (Processo Judicial Eletrônico) | `chapirousIA/pje-mcp-server` | MCP server | Suporta certificados A1 (arquivo) e A3 (token/smartcard) |

## MCP servers relevantes para Claude Code

- **`Mcp-Brasil/mcp-brasil`** — 70 APIs públicas brasileiras (IBGE, TSE etc.), útil para consultas
  de dados cadastrais/públicos que podem cruzar com verificação de identidade.
- **`chapirousIA/pje-mcp-server`** — se o fluxo de trabalho tocar em processos judiciais
  eletrônicos com certificado digital.

Não há, até o momento, um MCP server dedicado à emissão/validação ICP-Brasil ou ao PSBio —
para automações nessa área, a integração precisa ser feita diretamente com a API/SDK da AC
contratada (ex: GoSigner, BITSIGN) ou construída sobre as bibliotecas acima.

## Extraindo CPF/CNPJ do certificado (subject CN)

O campo `CN` de um certificado ICP-Brasil segue o padrão `NOME:CPF` (pessoa física) ou
`RAZAO_SOCIAL:CNPJ` (pessoa jurídica). Separar pelo caractere `:` dá o nome/razão social no
índice 0 e o número no índice 1.

## Escopo OAuth gov.br para assinatura

- Nenhum escopo (`icp_brasil`/`govbr`) → assinatura avançada com certificado GOV.BR (padrão)
- Só `govbr` → assinatura avançada GOV.BR
- Só `icp_brasil` → assinatura qualificada com certificado ICP-Brasil; usuário escolhe o PSC
- Ambos → usuário escolhe entre GOV.BR (avançada) ou ICP-Brasil (qualificada)

## Boas práticas ao gerar código nesta área

- Nunca gerar chaves privadas de exemplo com dados reais — usar sempre dados fictícios
  claramente marcados.
- Preferir bibliotecas auditadas (BouncyCastle, Demoiselle) a implementações próprias de
  X.509/ASN.1.
- Validar sempre a cadeia completa até a AC Raiz (ITI) antes de confiar em uma assinatura.
