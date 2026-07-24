# Checklist de conformidade — identificação e biometria

Baseado na Instrução Normativa ITI nº 36/2026 (confirmação de identidade) e no DOC-ICP-05.03
(procedimentos de identificação biométrica). **Sempre confirme o texto vigente em
repositorio.iti.gov.br antes de aplicar em produção** — normas do ITI são atualizadas com
frequência e este resumo pode ficar desatualizado.

## Métodos de confirmação de identidade aceitos

- Comparecimento presencial
- Videoconferência
- Uso de certificado ICP-Brasil válido já existente
- Módulo Eletrônico de AR
- AR Eletrônica

Métodos não presenciais precisam garantir nível de segurança equivalente ao presencial,
com validação de dados biográficos e biométricos por tecnologia eletrônica segura.

## Fluxo de identificação inicial

1. Apresentação e verificação documental
2. Coleta e verificação biométrica
3. Consulta à Lista Negativa das ACs
4. Assinatura/confirmação de origem e integridade do Termo de Titularidade

## Regras de biometria

- Verificação pelo "melhor dedo" (sistema deve pedir aleatoriamente qual dedo apresentar —
  por isso todos os dedos do AGR/requerente precisam estar cadastrados)
- Uso de face como alternativa quando a digital não puder ser usada
- Nova captura facial obrigatória quando a biometria tiver mais de 5 anos
- Logs de transação biométrica guardados por no mínimo 7 anos
- Validação biométrica deve ocorrer na base do PSBio (ou cache) — **proibido** validar
  exclusivamente na base local da AC
- Verificação de posse de e-mail com OTP, vedado vincular o mesmo e-mail a mais de um CPF

## Regras extras para PEP / autoridades do Judiciário e Ministério Público

1. Segunda verificação por outro Agente de Registro da AC
2. Batimento obrigatório da impressão digital na base do PSBio
3. Coleta de documento de identidade mesmo com batimento aprovado no PSBio

## Checklist rápido para o AGR em atendimento

- [ ] Documento de identidade original conferido
- [ ] Biometria coletada (dedo solicitado aleatoriamente pelo sistema)
- [ ] Se digital indisponível → captura facial registrada
- [ ] Biometria com mais de 5 anos? → nova captura facial
- [ ] E-mail validado por OTP e não duplicado em outro CPF
- [ ] Consulta à Lista Negativa realizada
- [ ] Se requerente é PEP/autoridade → segunda verificação + batimento PSBio + doc. físico
- [ ] Termo de Titularidade assinado/confirmado
- [ ] Registro de todo o processo salvo com verificação biométrica e assinatura digital do
      executante (certificado ICP-Brasil mínimo tipo A3), permitindo reconstituição para auditoria
