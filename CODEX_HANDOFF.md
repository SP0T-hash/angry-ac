# CODEX HANDOFF — AC Angry

Atualizado: 2026-11-07. Responsável pelas alterações: ChatGPT (revisão assistida). Branch: `security/fail-closed-critical-flows-20261107`. PR: https://github.com/SP0T-hash/angry-ac/pull/1

## Escopo para revisão econômica
Não audite o repositório inteiro. Comece por:
```bash
git fetch origin
git diff --stat origin/main...origin/security/fail-closed-critical-flows-20261107
git log --oneline origin/main..origin/security/fail-closed-critical-flows-20261107
git diff origin/main...origin/security/fail-closed-critical-flows-20261107 -- src/lib/gs/session.ts src/lib/ac-angry/api-middleware.ts src/app/api/protocol/update/route.ts src/app/api/psbio/route.ts src/app/api/ac/sign/route.ts src/components/ac-angry/protocol-viewer/modals/CloudPSCAuthModal.tsx
```
Analise somente os arquivos modificados e dependências diretas. Não use tokens para reexplicar documentação antiga.

## Alterações da branch (não homologadas)
- `CloudPSCAuthModal.tsx`: remove confirmação simulada por temporizador; assinatura não deve avançar sem prova real.
- `api/psbio/route.ts`: sem chave de provedor biométrico, bloqueia simulação em produção.
- `api/ac/sign/route.ts`: bloqueia CA fictícia em produção.
- `api/protocol/update/route.ts`: restringe campos genéricos a `holder_telefone` e `holder_email`. **Atenção:** ainda falta autorização por AR e verificação de existência/ownership.
- `lib/gs/session.ts`: remove fallback de senha em texto puro, exige conta ativa na consulta da sessão, marca cookie Secure em produção. **Atenção:** usuários antigos com senha sem hash precisarão migrar credenciais; não restaurar comparação em texto puro.

- `lib/ac-angry/security.ts` (commit `dcfe1c84`): valida explicitamente cabeçalho JWT `HS256`/`JWT` e exige `exp` numérico válido; não substitui validação de revogação de sessão nem autenticação A3.

- `lib/ac-angry/api-middleware.ts` (commit `ea311356`): verifica no banco se AGR está ativo e aplica `requireRole` quando solicitado; falha fechada se consulta de permissões falhar. **Atenção:** checar valores reais de `agr_users.role`, cobertura dos endpoints e custo da consulta por request; não implementa isolamento entre ARs.
- `api/auth/pki/route.ts` permanece **insegura para autenticação ICP-Brasil em produção**: checagem por texto do emissor não valida cadeia de confiança, CRL/OCSP real nem prova de dispositivo A3. Exige arquitetura de validação confiável antes de liberar.

## Estado de validação
Código gravado na branch, **sem execução confirmada de lint, testes ou build**. Não afirmar que a segurança foi certificada ou que o produto está pronto para produção.

## Tarefas prioritárias para Codex
1. Rodar `npm ci && npm run lint && npm test && npm run build` e reportar falhas exatas.
2. Inspecionar `src/lib/ac-angry/security.ts`, `src/lib/ac-angry/api-middleware.ts`, `src/app/api/auth/pki/route.ts` para contrato de sessão, papéis, expiração e validação ICP-Brasil.
3. Verificar isolamento multi-tenant: `src/app/api/protocols/route.ts`, `src/app/api/protocol/update/route.ts`, `src/app/api/gs/mutate/route.ts` e schema de ARs. Não inventar nomes de colunas nem liberar service-role sem filtros.
4. Criar testes de autorização entre ARs, estado de protocolo, falhas de biometria e PSC.
5. Antes de mudar fluxos críticos, registrar migrações e compatibilidade com banco e frontend.

## Instrução curta para Codex
> Leia primeiro CODEX_HANDOFF.md e docs/AUDITORIA_RECUPERACAO_2026-11-07.md na branch security/fail-closed-critical-flows-20261107. Revise apenas o diff contra main e dependências diretas. Identifique erros reais e testes faltantes, cite arquivo e linha, não refatore partes não relacionadas e não faça merge. Informe o custo estimado de contexto antes de ampliar a análise.

## Aprovação
Nenhuma alteração desta branch deve ser mesclada na main sem revisão e aprovação do proprietário.
