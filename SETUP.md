# Guia de Setup - VEMAPI SITE

## Pré-requisitos

| Ferramenta | Versão | Link |
|------------|--------|------|
| Node.js | 18+ | https://nodejs.org |
| npm | 9+ | Incluído com Node.js |
| Git | Qualquer | https://git-scm.com |
| Docker | Qualquer (opcional) | https://www.docker.com |

## 1. Instalação

```bash
# Clonar repositório
git clone <URL_DO_REPOSITORIO>
cd "VEMAPI SITE"

# Instalar dependências
npm install
```

## 2. Configuração de Ambiente

```bash
# Copiar template de variáveis de ambiente
cp .env.example .env.local
```

Edite `.env.local` com os valores reais:

### Variáveis Obrigatórias

| Variável | Descrição | Como obter |
|----------|-----------|------------|
| `NEXT_PUBLIC_SUPABASE_URL` | URL do projeto Supabase | Supabase Dashboard → Settings → API |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Chave pública Supabase | Supabase Dashboard → Settings → API |
| `SUPABASE_SERVICE_ROLE_KEY` | Chave de service role (SECRETA) | Supabase Dashboard → Settings → API |
| `PKI_NONCE_SECRET` | Segredo para nonces HMAC | `node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"` |
| `AUTH_JWT_SECRET` | Segredo para JWTs | `node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"` |
| `PKI_ENCRYPTION_KEY` | Chave de criptografia AES | `node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"` |

### Variáveis Opcionais

| Variável | Descrição | Padrão |
|----------|-----------|--------|
| `DAILY_API_KEY` | API key para videoconferência | - |
| `VIDAAS_CLIENT_ID` | Client ID do Vidaas | `ANGRY_VIDAAS` |
| `SYNGULAR_CLIENT_ID` | Client ID do Syngular | `ANGRY_SYNGULAR` |
| `BIRDID_CLIENT_ID` | Client ID do BirdID | `ANGRY_BIRD_ID` |

## 3. Banco de Dados

### Supabase (Produção/Homologação)

1. Criar projeto em https://supabase.com
2. Executar o script `SUPABASE_SCHEMA.sql` no SQL Editor
3. Executar `SUPABASE_SCHEMA_GS.sql` para tabelas do GS
4. Executar `SUPABASE_SEED.sql` para dados iniciais (opcional)

### Configuração de Segurança (RLS)

As políticas de Row Level Security já estão incluídas nos scripts SQL.
Verificar se RLS está habilitado em todas as tabelas sensíveis.

## 4. Desenvolvimento

```bash
# Iniciar servidor de desenvolvimento (porta 3001)
npm run dev

# Acessar a aplicação
http://localhost:3001
```

### Rotas Disponíveis

| Rota | Descrição |
|------|-----------|
| `/` | Landing page VEMAPI |
| `/auth/login` | Login PKI (AC ANGRY) |
| `/ac/agent/dashboard` | Dashboard do AGR |
| `/portal/login` | Login do portal |
| `/portal/dashboard` | Dashboard do cliente |
| `/admin/dashboard` | Dashboard administrativo |

## 5. Testes

```bash
# Executar todos os testes
npm test

# Executar testes em modo watch
npm run test:watch

# Executar com cobertura
npx vitest --coverage
```

### Testes de Segurança

```bash
# Testes de segurança isolados
npx vitest run --config vitest.security.config.ts
```

## 6. Build e Deploy

### Build de Produção

```bash
npm run build
npm start
```

### Deploy no Vercel

1. Conectar repositório ao Vercel
2. Configurar variáveis de ambiente no painel
3. Deploy automático a cada push no `main`

### Variáveis para Vercel

Adicionar todas as variáveis do `.env.local` em:
`https://vercel.com/SEU-PROJETO/settings/environment-variables`

## 7. Estrutura do Projeto

```
VEMAPI SITE/
├── src/
│   ├── app/                    # Next.js App Router
│   │   ├── (angry)/           # AC ANGRY (certificação)
│   │   ├── (landing)/         # Landing page
│   │   ├── (portal)/          # Portal cliente/admin
│   │   └── api/               # API routes
│   ├── components/            # Componentes React
│   │   └── ac-angry/          # Componentes AC ANGRY
│   ├── lib/                   # Utilitários
│   │   └── ac-angry/          # Módulos de segurança
│   └── types/                 # Tipos TypeScript
├── packages/
│   └── security/              # Pacote de segurança compartilhado
├── specs/                     # Especificações SDD
├── gs.vemapi/                 # CORE-AR (.NET 8)
├── public/                    # Assets estáticos
└── supabase/                  # Configurações Supabase
```

## 8. Comandos Úteis

```bash
# Linting
npm run lint

# Type checking
npx tsc --noEmit

# Limpar build
rm -rf .next

# Reinstalar dependências
rm -rf node_modules && npm install
```

## 9. Solução de Problemas

### Erro: "Variáveis de ambiente obrigatórias não configuradas"
- Verificar se `.env.local` existe e está preenchido
- Reiniciar o servidor de desenvolvimento

### Erro: "Supabase connection refused"
- Verificar se o projeto Supabase está ativo
- Verificar se as chaves estão corretas

### Erro: TypeScript errors
- Executar `npx tsc --noEmit` para ver todos os erros
- Corrigir um por vez

### Erro: Build falha
- Limpar cache: `rm -rf .next node_modules/.cache`
- Reinstalar: `npm install`

## 10. Segurança

### Checklist de Segurança

- [ ] `.env.local` está no `.gitignore`
- [ ] `SUPABASE_SERVICE_ROLE_KEY` nunca é exposta no client-side
- [ ] RLS está habilitado em todas as tabelas
- [ ] Rate limiting está configurado
- [ ] CSP está habilitado no `next.config.ts`
- [ ] Auditoria está registrando eventos

### Boas Práticas

1. Nunca commitar chaves de API
2. Usar variáveis de ambiente para todas as configurações
3. Validar input em todos os boundary points
4. Usar HTTPS em produção
5. Manter dependências atualizadas

---

*Guia atualizado em: 2026-07-08*
