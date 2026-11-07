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

- `api/protocols/route.ts` (commit `71ed1e6a`) limita listagem a `agr_id` da sessão; `api/protocol/update/route.ts` (commit `6593b079`) limita edição ao mesmo `agr_id` e retorna 404 se nenhum registro autorizado foi atualizado. **Restrição provisória por agente, não isolamento completo por AR**: supervisores e equipes podem precisar de acesso por unidade; validar schema, permissões e fluxos antes de produção.
- Pesquisa futura: comparar controles publicamente documentados da SafeWeb e da Syngular/Singular, sem presumir arquitetura interna; considerar normas ICP-Brasil, LGPD, OWASP ASVS, proteção contra zip bombs, abuso automatizado e fornecedores.

- `api/protocols/audit/route.ts` (commit `24509e73`): restringe evento originado do navegador a `UI_PROTOCOL_VIEWED`, verifica propriedade por `agr_id` e descarta metadados arbitrários do cliente. **Compatibilidade:** verificar nomes de eventos usados no frontend; eventos de auditoria de segurança devem ser gerados no servidor. **Não testado**.
- `api/gs/mutate/route.ts` continua crítico: mutações genéricas com service-role sem política de campos e escopo por tenant. Revisar esquema e papéis antes de qualquer liberação.

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

## Contenções adicionais planejadas — 2026-11-07 (Mordomo/ODIN)
Risco de compatibilidade registrado antes da implementação: login PKI em produção será bloqueado (503), pois não existe validação confiável da cadeia ICP-Brasil. Não habilitar por variável de ambiente enquanto isso não for implementado. A consulta local de revogação também deve falhar fechada.
A rota genérica GS passará a aceitar apenas AC_ADMIN ativo. AR_ADMIN, unidades e contadores perderão temporariamente essas gravações; o endpoint usa service-role sem política de tenant e possui tabelas com vínculos indiretos. Reabrir somente com políticas por tabela/campo/relacionamento e testes entre organizações. Nenhuma migração ou alteração de dados é necessária para a contenção.
Sessões GS com is_active diferente de true serão negadas; falha ao persistir sessão não retornará login bem-sucedido.

## Resultado da revisão direcionada — 2026-11-07
- Checkout isolado da branch autorizada em `work/angry-security`; checkout original `opencode/comercial` preservado. Comparação com main limitada ao diff e dependências diretas de autenticação/GS. ODIN fez revisão pontual somente leitura; sem auditoria integral ou pesquisa externa duplicada.
- Implementado: PKI GET/POST retorna 503 em produção antes de nonce/banco; erro ou exceção na consulta de revogação nega login; mutação genérica GS exige AC_ADMIN ativo e não devolve mensagens internas do banco; sessões GS revogadas/inconsistentes são rejeitadas; erro de persistência da sessão nega login.
- Testes: 78 aprovados em 5 arquivos. Cobrem revogação GS, falha de persistência, todos os papéis GS não administrativos, protocolos de outro AGR, campos decisórios proibidos, auditoria forjada, bloqueios produtivos de PKI/biometria/CA simulada, falhas de consulta CRL e cabeçalho/expiração JWT. Corrigido mock preexistente com hoisting inválido que impedia a suíte antiga de iniciar. Testes usam mocks/dados fictícios; não homologam ICP-Brasil real.
- Instalação: `npm ci --ignore-scripts --no-audit --no-fund` falhou ERESOLVE (Tremor 3.18.2 exige React 18, projeto usa 19.2.3). Instalação com `--legacy-peer-deps` passou sem alterar lockfile ou versões. Node isolado 24.22.2.
- Lint global: 134 erros e 82 avisos, principalmente any e problemas React preexistentes. Lint direcionado da rota GS e quatro novos arquivos de teste passou. Não corrigidos arquivos alheios ao escopo.
- Build padrão Turbopack interrompido por ausência de progresso na compilação neste ambiente. `next build --webpack` falhou: `test-db/page.tsx doesn't have a root layout`. A página e layouts não diferem da main. Build NÃO aprovado; variáveis reais não foram fornecidas.
- TypeScript: `tsc --noEmit` aprovado. `git diff --check` aprovado.
- Sem merge, deploy, push, migração ou acesso a dados reais.

### Riscos pendentes / próxima etapa
1. PKI de desenvolvimento continua sem validar cadeia confiável; nunca usar com identidades reais. Para reabrir produção: confiança ICP-Brasil, revogação confiável, vínculo da identidade/serial e prova de posse homologados. Aprovação OAuth PSC isolada não é prova suficiente.
2. A contenção GS não implementa permissões finas/isolamento por AR: bloqueia não administradores. AC_ADMIN ainda é global e a mutação genérica precisa política de campos e relacionamentos antes de ser reaberta a outros papéis.
3. Protocolos estão isolados por AGR, não por equipe/AR completa. Consumidores do cookie JWT precisam revisão direcionada para revogação da sessão persistida. Compatibilidade do frontend com auditoria restrita e bearer opaque continua pendente.
4. Próxima ação: corrigir o bloqueio de build/layout e a instalação React/Tremor; depois políticas GS por tabela e revisão dos consumidores de sessão. Não considerar esta branch pronta para produção.

## Correção de build e dependências — 2026-11-07
- Mordomo executou diretamente; nenhuma delegação adicional necessária. Escopo: bloqueios de instalação/build e quatro consumidores diretos do Tremor, sem ampliar a auditoria.
- Removido Tremor (inclusive a versão atual 3.18.7 exige React 18). Os quatro consumidores usam HTML semântico, estilos Tailwind existentes, tabela nativa e progress com rótulo acessível. React permanece 19.2.3. A aparência dos componentes pode variar ligeiramente.
- Removido `@supabase/ssr`, sem referências no código e com peer incompatível com o cliente bloqueado no lockfile. Cliente `@supabase/supabase-js` fixado na versão original 2.90.1; nenhuma mudança de banco/credenciais/contrato de autenticação. O lockfile também atualizou três dependências transitivas de tipos/WebSocket.
- `/test-db` reutiliza o layout existente e retorna notFound em produção, evitando publicar diagnóstico de banco. Adicionado teste desse bloqueio.
- `npm run build` usa `next build --webpack`, opção suportada pelo Next 16, em lugar do Turbopack que não avançava neste ambiente. Nenhum controle de segurança ou checagem TypeScript foi desabilitado.
- Instalação limpa: `npm ci --ignore-scripts --no-audit --no-fund` passou, sem legacy-peer-deps. Scripts de instalação de terceiros não foram executados.
- Testes: 79 aprovados em 6 arquivos após instalação limpa. Lint dos seis arquivos alterados/novos: zero erros, um aviso existente de compatibilidade de memoização no TanStack Table. `git diff --check` passou. Lint global permanece pendente; os erros fora deste escopo não foram suprimidos.
- `npm run build` aprovado após instalação limpa, incluindo TypeScript e geração das 37 páginas. Smoke HTTP com `next start` somente em localhost: `/auth/login` 200, `/test-db` 404 e `/api/auth/pki` 503. Servidor de teste encerrado. Sem dados ou credenciais reais.
- Permanecem as restrições e riscos PKI/GS da revisão anterior. Sem push, merge ou deploy. Próxima etapa: corrigir os erros de lint globais por módulo e implementar permissões GS por organização, mantendo a contenção até a homologação.

## Publicação e próxima correção — 2026-11-07
Commits `77b686c`, `33e812f` e `e922b97` enviados a `origin/security/fail-closed-critical-flows-20261107`, sem merge ou deploy. Specs 002/011 e auditoria atualizadas.
Risco de compatibilidade registrado antes da mudança: o guard de páginas AC passará a exigir JWT com `sub` e `session_token` vinculados a sessão persistida ativa e conta ativa. JWT antigo sem vínculo, sessão revogada, conta desativada ou indisponibilidade do banco perderão acesso. `/ac/admin` exigirá papel ADMIN lido do banco, também na página servidor. Nenhuma migração ou dado real envolvido. APIs continuarão usando Bearer opaque e `withAuth`; não serão convertidas para confiar no JWT.

## Continuidade — vínculo de sessão e portal ADMIN
- Implementado `SessionManager.validatePageJWT`: valida JWT, exige sub/session_token, confere sessão persistida e vínculo agr_id, conta ativa e papel atual no banco. Sessões com is_active não verdadeiro ou expiração inválida também são negadas.
- Proxy `/ac/*` usa essa validação; `/ac/admin` e subrotas exigem ADMIN. A própria página servidor `/ac/admin` repete a autorização antes de renderizar; APIs Bearer opaque continuam com seu contrato anterior.
- 101 testes aprovados em 8 arquivos: regressões anteriores e vínculo divergente, sessão revogada/expirada, expiração inválida, conta inativa, papel ADMIN desatualizado, banco indisponível, proxy e acesso direto à página. Dados fictícios/mocks.
- Lint do proxy, página e dois novos arquivos de teste: zero erros/avisos. O core/teste de segurança conserva tipagens any preexistentes; lint global não foi limpo nem desabilitado.
- `npm run build` aprovado com TypeScript e geração das páginas após a correção. Nenhum dado real acessado; specs 002/011 atualizadas.
- Riscos remanescentes: PKI/PSC real e cadeia ICP-Brasil não homologados; GS genérico permanece AC_ADMIN-only até política por tabela/AR/campo; conferir demais APIs administrativas e compatibilidade frontend de auditoria/Bearer; limpar lint global por módulos. O guard adiciona consultas por requisição e indisponibilidade nega navegação. Não reabrir produção por fallback.
