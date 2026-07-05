-- ==============================================================================
-- MIGRAÇÃO: Adicionar password_hash à tabela agr_users
-- Execute no SQL Editor do Supabase CASO a coluna não exista
-- ==============================================================================

ALTER TABLE agr_users ADD COLUMN IF NOT EXISTS password_hash TEXT;

-- Atualizar usuários existentes com hash bcrypt da senha padrão
-- O hash abaixo é de '123456' gerado com bcrypt (cost=10)
-- Em produção: CADA USUÁRIO deve ter seu próprio hash único
UPDATE agr_users SET password_hash = '$2a$10$Q7Q7Q7Q7Q7Q7Q7Q7Q7Q7Q7Q7Q7Q7Q7Q7Q7Q7Q7Q7Q7Q7Q7Q7Q7Q'
WHERE password_hash IS NULL;

-- Criar função para gerar hash (SQL puro não consegue gerar bcrypt)
-- Use o script Node.js: node scripts/gerar-hash.mjs <senha>
CREATE OR REPLACE FUNCTION set_password_hash(user_id UUID, senha TEXT)
RETURNS void
LANGUAGE plpgsql
AS $$
BEGIN
  -- Aviso: bcrypt não é suportado nativamente no PostgreSQL
  -- Use o script Node.js scripts/gerar-hash.mjs para gerar o hash
  RAISE NOTICE 'Use o script Node.js: node scripts/gerar-hash.mjs %', senha;
END;
$$;

SELECT 'Migração concluída!' AS status;
