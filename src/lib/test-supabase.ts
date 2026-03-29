import { supabase } from './supabase';

// Função para testar a conexão com o Supabase
export async function testSupabaseConnection() {
  try {
    console.log('Testando conexão com Supabase...');
    
    // Teste simples de conexão
    const { data, error } = await supabase.from('leads').select('count');
    
    if (error) {
      console.error('Erro na conexão:', error);
      return { success: false, error: error.message };
    }
    
    console.log('Conexão bem-sucedida!', data);
    return { success: true, data };
  } catch (err) {
    console.error('Erro geral:', err);
    return { success: false, error: 'Erro desconhecido' };
  }
}

// SQL para criar a tabela leads (execute no painel SQL do Supabase)
export const createLeadsTableSQL = `
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
`;
