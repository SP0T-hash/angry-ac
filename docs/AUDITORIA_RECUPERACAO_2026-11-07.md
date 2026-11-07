# AC Angry — recuperação de segurança (07/11/2026)

## Escopo desta intervenção
Correções defensivas isoladas na branch `security/fail-closed-critical-flows-20261107`. Não houve deploy, alteração de banco, homologação ICP-Brasil ou integração PSC real. A branch requer revisão e testes antes de merge.

## Alterações realizadas
1. `CloudPSCAuthModal.tsx`: remove confirmação de assinatura por temporizadores. Enquanto não existir prova criptográfica verificada no servidor, exibe indisponibilidade e não chama `onConfirm`.
2. `api/psbio/route.ts`: sem credenciais biométricas, o ambiente de produção retorna HTTP 503 em vez de gerar aprovações aleatórias. Simulação de desenvolvimento permanece e deve ser identificada explicitamente.
3. `api/protocol/update/route.ts`: limita a rota genérica a `holder_telefone` e `holder_email`, com valores string. Mudanças de estado e dados decisórios exigem endpoints próprios e autorização por organização.
4. `api/ac/sign/route.ts`: desativa emissão pela AC fictícia em produção (HTTP 503).

## Riscos ainda abertos (não considerar pronto para produção)
- Validar cadeia X.509 ICP-Brasil, EKU/políticas, revogação via CRL/OCSP e autorização atual do AGR.
- Revisar inconsistência entre JWT no cookie e session_token no Bearer; unificar contrato e revogação.
- Garantir isolamento multi-tenant por AR e controle de papéis em TODAS as APIs com service-role.
- Exigir auditoria transacional e imutável para operações decisórias; o AuditLogger atual absorve erros.
- Remover aprovação biométrica simulada de qualquer ambiente acessível a usuários reais, inclusive staging.
- Revisar `api/protocols/audit`: aceita eventos fornecidos pelo cliente.
- Revisar `api/gs/mutate`: mutação genérica com service-role e sem validação específica de campos.
- Revisar dados pessoais em `mockData.ts` e histórico do Git; avaliar rotação de segredos se expostos.
- Confirmar contratos reais e credenciais dos PSCs; nenhum mock pode liberar aprovação.
- Persistência durável das evidências de vídeo, recuperação após falhas, integridade e retenção.
- Revisar `api/ac/persist-certificate` para não aceitar material e estados arbitrários do cliente.
- Revisar impacto funcional do bloqueio de campos no formulário de protocolos.

## Checklist de validação antes do merge
- `npm ci && npm run lint && npm test && npm run build`.
- Testar produção sem IDWALL_API_KEY: biometria deve retornar 503.
- Testar produção: POST /api/ac/sign deve retornar 503.
- Testar modal PSC: nunca chamar onConfirm sem evidência real.
- Testar atualização de protocolo: campos decisórios retornam 400.
- Testar todos os fluxos de edição legítimos e criar endpoints específicos para campos necessários.
- Executar testes de autorização cruzada entre duas ARs e entre papéis.
- Confirmar que nenhum dado real é usado em testes.
- Revisar requisitos ICP-Brasil com AC parceira e responsável de conformidade.

## Próximas etapas
P0: controle de acesso multi-tenant, autenticação A3 completa, estados imutáveis, auditoria.
P1: persistência de vídeo e biometria real com trilha verificável.
P2: integrações PSC e AC com ambientes sandbox e contratos oficiais.
P3: UX de atendimento e métricas de produtividade; só depois comercialização.

**Importante:** correções são contenções pontuais e não certificam segurança ou conformidade regulatória.

## Atualização técnica — Mordomo, 2026-11-07
- `77b686c`: contenção PKI em produção, CRL fail-closed, GS genérico somente AC_ADMIN ativo, revogação/persistência GS e regressões de segurança.
- `33e812f`: remoção de dependências incompatíveis/não utilizadas, cliente Supabase 2.90.1 fixado, build Webpack e diagnóstico indisponível em produção.
- 79 testes aprovados; instalação limpa com scripts de terceiros desativados; build/TypeScript aprovados. Smoke local: login 200, diagnóstico 404, PKI 503. Não houve merge, deploy ou alteração de dados reais.
- Specs 002 e 011 atualizadas com distinção entre contenções comprovadas e homologação pendente. Próxima revisão pontual: consumidor do cookie JWT e rotas administrativas AC.
