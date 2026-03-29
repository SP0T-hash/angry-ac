# Configuração do Banco de Dados Supabase

## Problema Identificado
O formulário de contato não está funcionando porque a tabela `leads` não existe no Supabase ou as permissões não estão configuradas corretamente.

## Solução Passo a Passo

### 1. Verificar Chaves do Supabase
No arquivo `.env.local`, verifique se as chaves estão completas:

```env
NEXT_PUBLIC_SUPABASE_URL=https://SEU_PROJETO.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=sua_chave_anonima_completa
```

### 2. Criar Tabela no Supabase
Acesse: https://supabase.com/dashboard

1. Selecione seu projeto
2. Vá para **SQL Editor** no menu lateral
3. Clique em **New query**
4. Cole e execute este SQL:

```sql
-- Criar tabela leads se não existir
CREATE TABLE IF NOT EXISTS leads (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  nome TEXT NOT NULL,
  startup TEXT NOT NULL,
  email TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Habilitar RLS (Row Level Security)
ALTER TABLE leads ENABLE ROW LEVEL SECURITY;

-- Criar política para permitir inserções
CREATE POLICY "Allow insert" ON leads
  FOR INSERT
  WITH CHECK (true);

-- Criar política para permitir leituras
CREATE POLICY "Allow select" ON leads
  FOR SELECT
  USING (true);
```

### 3. Testar a Conexão
Acesse: http://localhost:3001/test-db

Esta página de teste irá:
- Testar a conexão com o Supabase
- Mostrar erros específicos se houver
- Exibir as instruções SQL novamente

### 4. Verificar Resultado
Após executar o SQL:
- A tabela `leads` deve aparecer em **Table Editor**
- O formulário do site deve funcionar
- Os dados serão salvos na tabela

## Problemas Comuns

### Chave Incompleta
Se a chave anonimizada estiver cortada, copie a chave completa do dashboard do Supabase:
1. Dashboard > Project > Settings > API
2. Copie a `anon public` key
3. Substitua no `.env.local`

### Permissões Negadas
Se receber erro "permission denied", execute as políticas RLS conforme mostrado acima.

### Tabela Não Existe
Se receber erro "relation does not exist", execute o SQL para criar a tabela.

## Teste Final
Preencha o formulário em http://localhost:3001 e verifique se:
1. Não aparece erro de conexão
2. A mensagem "SOLICITAÇÃO RECEBIDA" aparece
3. Os dados aparecem na tabela `leads` no Supabase

---

**Importante:** Reinicie o servidor após alterar o `.env.local`:
```bash
npm run dev
```
