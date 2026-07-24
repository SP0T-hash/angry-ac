// Executa os schemas SQL no Supabase remoto (dev tool).
// Uso: DB_PW=<senha> node scripts/run-migrations.mjs
// Lê variáveis de ambiente; NÃO embute segredos.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { Client } from 'pg';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');

const REF = 'lzmylpfdmgspleezgynz';
const REGION = 'us-west-2';
const PW = process.env.DB_PW;
if (!PW) {
  console.error('Defina DB_PW (senha do banco Supabase).');
  process.exit(1);
}

// Conexão DIRETA (porta 5432) — necessária para DDL.
const conn = `postgresql://postgres.${REF}:${PW}@db.${REF}.supabase.co:5432/postgres`;

const FILES = [
  'SUPABASE_SCHEMA.sql',
  'SUPABASE_SCHEMA_GS.sql',
  'SUPABASE_SCHEMA_BILLING.sql',
  'SUPABASE_SCHEMA_AGENDA.sql',
  'SUPABASE_MIGRATION_SECURITY.sql',
];

// Splitter tolerante a $$ (dollar quoting) e aspas.
function splitSql(sql) {
  const out = [];
  let cur = '';
  let inSingle = false;
  let inDouble = false;
  let inDollar = false;
  let dollarTag = '';
  let i = 0;
  while (i < sql.length) {
    const ch = sql[i];
    const nxt = sql[i + 1];
    if (inDollar) {
      cur += ch;
      // fim de dollar quote: $tag$
      if (ch === '$' && sql.startsWith(dollarTag, i)) {
        i += dollarTag.length;
        inDollar = false;
        dollarTag = '';
        continue;
      }
      i++;
      continue;
    }
    if (ch === "'" && !inDouble) {
      inSingle = !inSingle;
      cur += ch;
      i++;
      continue;
    }
    if (ch === '"' && !inSingle) {
      inDouble = !inDouble;
      cur += ch;
      i++;
      continue;
    }
    if (ch === '$' && !inSingle && !inDouble) {
      // início de dollar quote: $tag$  (tag pode ser vazio)
      const m = /^\$([A-Za-z_][A-Za-z0-9_]*)?\$/.exec(sql.slice(i));
      if (m) {
        inDollar = true;
        dollarTag = m[0];
        cur += m[0];
        i += m[0].length;
        continue;
      }
    }
    if (ch === ';' && !inSingle && !inDouble && !inDollar) {
      if (cur.trim()) out.push(cur.trim());
      cur = '';
      i++;
      continue;
    }
    cur += ch;
    i++;
  }
  if (cur.trim()) out.push(cur.trim());
  return out;
}

async function run() {
  const client = new Client({ connectionString: conn, ssl: { rejectUnauthorized: true } });
  await client.connect();
  console.log('Conectado ao banco.');
  for (const f of FILES) {
    const p = path.join(ROOT, f);
    if (!fs.existsSync(p)) {
      console.warn(`Pulando ${f} (não encontrado).`);
      continue;
    }
    const sql = fs.readFileSync(p, 'utf8');
    const stmts = splitSql(sql);
    console.log(`\n=== ${f} (${stmts.length} statements) ===`);
    for (let s = 0; s < stmts.length; s++) {
      const stmt = stmts[s];
      try {
        await client.query(stmt);
      } catch (e) {
        // Ignora "já existe" para idempotência; falha em caso contrário.
        const msg = e.message || '';
        if (/already exists|duplicate key|permission denied/.test(msg)) {
          console.warn(`  [skip] stmt ${s + 1}: ${msg.split('\n')[0]}`);
        } else {
          console.error(`  [ERRO] stmt ${s + 1}: ${msg.split('\n')[0]}`);
          throw e;
        }
      }
    }
    console.log(`  OK: ${f}`);
  }
  await client.end();
  console.log('\nMigrações concluídas.');
}

run().catch((e) => {
  console.error('Falha:', e.message);
  process.exit(1);
});
