# 🚀 Deploy — VEMAPI SITE (CoreAr)

## Vercel (Frontend Next.js)

### 1. Conectar o repositório

1. Acesse: https://vercel.com/new
2. Importe o repositório `SP0T-hash/angry-ac` (ou o fork correto)
3. Framework: **Next.js** (detectado automaticamente)
4. Root Directory: **./** (raiz)

### 2. Configurar variáveis de ambiente

Adicione em **Settings → Environment Variables**:

| Nome | Valor | Ambiente |
|------|-------|----------|
| `NEXT_PUBLIC_APP_URL` | `https://seu-app.vercel.app` | All |
| `NEXT_PUBLIC_API_URL` | `https://seu-backend.azure.com` | All |
| `NEXT_PUBLIC_SUPABASE_URL` | `https://seu-projeto.supabase.co` | All |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | `eyJ...` | All |
| `SUPABASE_SERVICE_ROLE_KEY` | `eyJ...` | All |
| `PKI_NONCE_SECRET` | `abc...` (64 bytes hex) | All |
| `AUTH_JWT_SECRET` | `def...` (64 bytes hex) | All |

### 3. Configurar Supabase

1. Acesse: https://supabase.com/dashboard
2. No SQL Editor, execute **TODO** o conteúdo de `SUPABASE_SCHEMA.sql`
3. Verifique as 7 tabelas criadas no Table Editor

### 4. Deploy

1. Vá para **Deployments**
2. Clique **Deploy**
3. Acompanhe o build em tempo real

> O build usa `--legacy-peer-deps` automaticamente (configurado em `vercel.json`).

---

## Extensão Chrome (AR Biometric Bridge)

### Build

```powershell
cd ar-biometric-extension
.\build.ps1
```

Arquivos gerados em `ar-biometric-extension/dist/`:
- `ar-biometric-extension-v{version}.zip` → upload na Chrome Web Store
- `ar-biometric-devkit-v{version}.zip` → testes locais

### Teste Local

1. Descompacte o DevKit
2. Vá em `chrome://extensions`
3. Ative "Modo do desenvolvedor"
4. "Carregar sem compactação" → selecione a pasta `extension`
5. Copie o ID gerado
6. Execute `install.ps1 -ExtensionId SEU_ID`
7. Acesse `http://localhost:3000` e teste o login biométrico

---

## Estrutura de Rotas (App Router)

| Rota | Tipo | Descrição |
|------|------|-----------|
| `/` | Static (SSG) | Landing page |
| `/auth/login` | Static | Login do AGR |
| `/ac/agent/dashboard` | Static | Dashboard do AGR |
| `/portal/dashboard` | Static | Portal do cliente |
| `/portal/login` | Static | Login do portal |
| `/admin/dashboard` | Static | Admin |
| `/api/auth/pki` | Dynamic | Autenticação PKI |
| `/api/ac/sign` | Dynamic | Assinatura digital |
| `/api/cpf` | Dynamic | Consulta CPF |
| `/api/cnpj` | Dynamic | Consulta CNPJ |
| `/api/protocol/update` | Dynamic | Atualizar protocolo |
| `/api/protocols/audit` | Dynamic | Auditoria |
| `/api/psbio` | Dynamic | PSBio saf |
| `/api/saf` | Dynamic | SAF |
| `/api/video` | Dynamic | Videoconferência |

---

## Checklist Pré-Produção

- [ ] **Supabase**: Schema SQL executado
- [ ] **Variáveis**: Todas configuradas na Vercel
- [ ] **Secrets**: PKI_NONCE_SECRET e AUTH_JWT_SECRET gerados com `openssl rand -hex 64`
- [ ] **Build**: `npm run build` local passa sem erros
- [ ] **Testes**: `npm test` — 41/41 passando
- [ ] **TypeScript**: `npx tsc --noEmit` — zero erros
- [ ] **Extensão**: Build testado e instalado localmente
- [ ] **Native Host**: .NET 8 Runtime instalado no servidor/homologação
