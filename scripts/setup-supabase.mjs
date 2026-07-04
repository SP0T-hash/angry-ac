/**
 * Script de setup automático do Supabase.
 *
 * Tenta executar o schema SQL via Supabase Management API.
 * Se não for possível via API, instrui o usuário a usar o SQL Editor.
 *
 * Uso: node scripts/setup-supabase.mjs
 */

const SUPABASE_URL = 'https://lzmylpfdmgspleezgynz.supabase.co';
const SUPABASE_REF = 'lzmylpfdmgspleezgynz'; // extraído da URL
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imx6bXlscGZkbWdzcGxlZXpneW56Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2ODg2ODY4OCwiZXhwIjoyMDg0NDQ0Njg4fQ.qXfF_-1_Yr_NytHpeqfWwOpyhyTSY9fkUh81IL1BryQ';

async function checkConnectivity() {
  console.log('🔍 Verificando conectividade com Supabase...');
  console.log(`   URL: ${SUPABASE_URL}`);
  console.log(`   Ref: ${SUPABASE_REF}`);

  try {
    // Teste 1: Health check básico via REST
    const healthRes = await fetch(`${SUPABASE_URL}/rest/v1/`, {
      headers: {
        'apikey': SERVICE_ROLE_KEY,
        'Authorization': `Bearer ${SERVICE_ROLE_KEY}`,
      },
    });
    console.log(`   ✅ REST API respondendo (${healthRes.status})`);
  } catch (err) {
    console.log(`   ❌ REST API falhou: ${err.message}`);
    return false;
  }

  try {
    // Teste 2: Tentar listar tabelas
    const testRes = await fetch(`${SUPABASE_URL}/rest/v1/agr_users?select=count&limit=1`, {
      headers: {
        'apikey': SERVICE_ROLE_KEY,
        'Authorization': `Bearer ${SERVICE_ROLE_KEY}`,
      },
    });

    if (testRes.status === 200) {
      console.log('   ✅ Tabela agr_users já existe! Schema já executado.');
      return true;
    } else if (testRes.status === 404) {
      console.log('   ⏳ Tabela agr_users não encontrada. Schema precisa ser executado.');
      console.log('   ⚠️  DDL não pode ser executado via REST API.');
      console.log('   📋 Será necessário usar o SQL Editor do Supabase Dashboard.');
      return false;
    } else {
      const text = await testRes.text();
      console.log(`   ℹ️  Resposta inesperada (${testRes.status}): ${text.substring(0, 200)}`);
      return false;
    }
  } catch (err) {
    console.log(`   ❌ Erro ao consultar: ${err.message}`);
    return false;
  }
}

function printInstructions() {
  console.log('\n' + '='.repeat(60));
  console.log('📋 INSTRUÇÕES PARA EXECUTAR O SCHEMA');
  console.log('='.repeat(60));
  console.log(`
1. Acesse: https://supabase.com/dashboard/project/${SUPABASE_REF}/sql/new

2. Cole o conteúdo do arquivo SUPABASE_SCHEMA.sql e execute (▶️ Run)

3. Após executar com sucesso, cole o conteúdo de SUPABASE_SEED.sql
   e execute para popular dados de teste

4. Verifique se as tabelas foram criadas:
   - Table Editor: https://supabase.com/dashboard/project/${SUPABASE_REF}/editor
   - Tabelas esperadas: agr_users, protocols, security_nonces, secure_sessions,
     audit_logs, rate_limit_buckets, leads
`);
}

async function main() {
  console.log('🚀 Supabase Setup Script\n');
  
  const alreadySetup = await checkConnectivity();
  
  if (!alreadySetup) {
    printInstructions();
  } else {
    console.log('\n✅ Tudo pronto! Supabase já está configurado.');
  }
}

main().catch(console.error);
