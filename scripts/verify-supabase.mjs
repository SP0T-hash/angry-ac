/**
 * Script de verificação do Supabase.
 * Checa se as tabelas existem e se os dados de seed foram inseridos.
 */
const SERVICE_ROLE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imx6bXlscGZkbWdzcGxlZXpneW56Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2ODg2ODY4OCwiZXhwIjoyMDg0NDQ0Njg4fQ.qXfF_-1_Yr_NytHpeqfWwOpyhyTSY9fkUh81IL1BryQ';
const SUPABASE_URL = 'https://lzmylpfdmgspleezgynz.supabase.co';

const headers = {
  'apikey': SERVICE_ROLE_KEY,
  'Authorization': `Bearer ${SERVICE_ROLE_KEY}`,
  'Content-Type': 'application/json',
};

const TABELAS = [
  'agr_users',
  'protocols',
  'security_nonces',
  'secure_sessions',
  'audit_logs',
  'rate_limit_buckets',
  'leads',
];

async function checkTabela(nome) {
  try {
    const res = await fetch(
      `${SUPABASE_URL}/rest/v1/${nome}?select=count&limit=0`,
      { headers }
    );
    if (res.status === 200) {
      const countRes = await fetch(
        `${SUPABASE_URL}/rest/v1/${nome}?select=count`,
        { headers, method: 'HEAD' }
      );
      // Tenta contar via content-range
      const contentRange = countRes.headers.get('content-range');
      let count = '?';
      if (contentRange) {
        const match = contentRange.match(/\/(\d+)/);
        if (match) count = match[1];
      }
      return { exists: true, count };
    }
    return { exists: false, count: 0 };
  } catch {
    return { exists: false, count: 0 };
  }
}

async function queryJSON(nome) {
  try {
    const res = await fetch(`${SUPABASE_URL}/rest/v1/${nome}?select=*`, { headers });
    if (res.ok) return await res.json();
    return [];
  } catch { return []; }
}

async function main() {
  console.log('🔍 Verificando tabelas e dados...\n');
  
  let allOk = true;
  for (const tabela of TABELAS) {
    const result = await checkTabela(tabela);
    const status = result.exists ? '✅' : '❌';
    console.log(` ${status} ${tabela} (${result.exists ? 'OK' : 'AUSENTE'})`);
    if (!result.exists) allOk = false;
  }

  console.log('');
  
  if (!allOk) {
    console.log('⚠️  Algumas tabelas estão ausentes. Execute o SUPABASE_SCHEMA.sql novamente.');
    return;
  }

  // Verificar dados seed
  console.log('📊 Dados inseridos:\n');
  
  const agrs = await queryJSON('agr_users');
  console.log(`   👤 agr_users: ${agrs.length} registros`);
  agrs.forEach(a => console.log(`      - ${a.nome} (${a.email}) [${a.role}]`));

  const protocols = await queryJSON('protocols');
  console.log(`   📋 protocols: ${protocols.length} registros`);
  protocols.forEach(p => console.log(`      - ${p.protocol_number} [${p.status}] ${p.holder_nome}`));

  const leads = await queryJSON('leads');
  console.log(`   📝 leads: ${leads.length} registros`);

  console.log('\n✅ Verificação concluída!');
}

main().catch(console.error);
