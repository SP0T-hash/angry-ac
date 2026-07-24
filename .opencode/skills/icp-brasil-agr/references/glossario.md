# Glossário ICP-Brasil

## Hierarquia / papéis

- **AC Raiz (ITI)**: Instituto Nacional de Tecnologia da Informação. Autoridade máxima da ICP-Brasil, no topo da cadeia de confiança.
- **AC (Autoridade Certificadora)**: entidade credenciada pela AC Raiz que efetivamente emite os certificados digitais (ex: Serasa, Certisign, Soluti, AC Digital).
- **AR (Autoridade de Registro)**: entidade vinculada a uma AC, responsável por identificar e validar os dados do requerente. Oferece os cursos de capacitação de AGR.
- **AGR (Agente de Registro)**: profissional empregado por uma AR, responsável por atender o requerente, coletar documentos/biometria e validar o registro. Precisa de treinamento com carga horária mínima de 16h e vínculo empregatício formal (CTPS) com a AR.
- **PSBio (Prestador de Serviço de Biometria)**: entidade com capacidade técnica para identificação biométrica, mantendo base(s) de dados biométricos únicos para toda a ICP-Brasil. A validação biométrica precisa ocorrer na base do PSBio (ou seu cache) — é vedada verificação exclusiva na base local da AC.
- **PSC (Prestador de Serviço de Confiança)**: oferece certificados em nuvem.
- **ACT (Autoridade Certificadora do Tempo)**: emite carimbos do tempo.
- **ITI**: órgão regulador máximo, publica as Instruções Normativas (IN) e Documentos ICP (DOC-ICP).

## Tipos de certificado

- **A1**: certificado gerado e armazenado em software (arquivo), validade de 1 ano.
- **A3**: certificado armazenado em hardware (token/smartcard), validade de até 3 anos, exige dispositivo criptográfico físico ou nuvem homologada.
- **e-CPF**: certificado de pessoa física.
- **e-CNPJ**: certificado de pessoa jurídica.

## Termos de identificação

- **PEP (Pessoa Exposta Politicamente)**: requerente com regras de identificação reforçadas — exige segunda verificação por AGR, batimento de digital na base do PSBio, e coleta de documento de identidade mesmo com batimento aprovado.
- **Termo de Titularidade**: documento que formaliza a relação entre o titular e o certificado emitido; precisa de assinatura ou confirmação de origem e integridade.
- **Lista Negativa das ACs**: base consultada durante a identificação inicial para verificar restrições prévias do requerente.
- **Dossiê eletrônico**: registro de todo o processo de identificação (documental + biométrico) do titular, mantido para fins de auditoria.

## Padrões de assinatura digital

- **XAdES**: assinatura digital para documentos XML.
- **CAdES**: assinatura digital para dados binários genéricos (CMS/PKCS#7).
- **PAdES**: assinatura digital embutida em PDF.
