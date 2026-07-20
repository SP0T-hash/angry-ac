# ANGRY-AC Constitution

## Core Principles

### I. Separação de Áreas (NON-NEGOTIABLE)
O projeto tem 3 frentes que evoluem de forma independente e NÃO devem ter
suas edições misturadas sem ordem explícita:
- **Landing (VEMAPI)** — `src/app/(landing)/`. 🔒 TRAVADA: nunca alterar sem
  pedido expresso. Está marcada com `git update-index --assume-unchanged`.
- **GS (Gestão Core-AR)** — `src/app/gs/`, `src/components/gs/`.
- **AC ANGRY** — `src/app/(angry)/`, `src/app/ac/`.
Uma edição em uma área não deve vazar para as outras sem solicitação.

### II. Spec-Driven Development
Toda feature não-trivial começa como especificação (`.specify/specs/`) antes
da implementação. Usar o processo spec-kit: constitution → spec → plan →
tasks → implement → converge. Specs descrevem O QUÊ e PORQUÊ, nunca O COMO
(sem stack/frameworks no spec).

### III. Design System Consistente (Open Design)
Accent único emerald (`#10b981`); never usar indigo padrão de LLM como accent.
Superfícies planas — sem gradientes "trust" (roxo→azul) nem glows decorativos.
Sem emoji como ícone (usar SVG monoline `currentColor`). Hierarquia clara:
headline → support → ação. Foco visível em todos os inputs.
Toda superfície data-driven DEVE renderizar 5 estados: loading, empty, error,
populated, edge.

### IV. Ambientes Dev e Prod Isolados
- **DEV**: `npm run dev` → http://localhost:3001 (hot reload, `.env.development`).
- **PROD (local)**: `npm run build` + `npm run start:prod` → http://localhost:3000
  (`.env.production`).
Nunca commitar segredos; `.env.*` está no `.gitignore`.

### V. Simplicidade (YAGNI)
Começar simples. Não adicionar abstrações, libs ou telas não solicitadas.
Acoplamento mínimo entre as áreas (GS não depende de AC e vice-versa).

## Security Requirements
- Credenciais Supabase service-role NUNCA no client. Cookies de sessão GS são
  httpOnly.
- Login GS usa reCAPTCHA v2 invisível (verificar SITE_KEY/SECRET no `.env`).
- Tokens expostos em setup anterior (GitHub `ghp_...`, Supabase `sbp_...`) DEVEM
  ser revogados.

## Development Workflow
1. Criar spec (`/speckit-specify`) para features não-triviais.
2. Implementar na área correta (respeitando Princípio I).
3. Validar: `npx tsc --noEmit`, `npm run lint`.
4. Subir em dev (3001) para testar; só depois buildar em prod (3000).

## Governance
Esta constitution prevalece sobre práticas informais. Emendas requerem
documentação da mudança e bump de versão (semver). Toda feature deve respeitar
o Princípio I (separação) e III (design system).
**Version**: 1.0.0 | **Ratified**: 2026-07-19 | **Last Amended**: 2026-07-19
