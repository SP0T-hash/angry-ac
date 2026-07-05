#!/usr/bin/env node
/**
 * Script para gerar hash bcrypt de senhas
 * Uso: node scripts/gerar-hash.mjs <senha>
 * Exemplo: node scripts/gerar-hash.mjs "minha-senha-segura"
 */

import bcrypt from 'bcryptjs';
import { createHash } from 'crypto';

async function main() {
  const senha = process.argv[2];
  if (!senha) {
    console.error('Uso: node scripts/gerar-hash.mjs <senha>');
    console.error('Exemplo: node scripts/gerar-hash.mjs "minha-senha"');
    process.exit(1);
  }

  const salt = await bcrypt.genSalt(10);
  const hash = await bcrypt.hash(senha, salt);

  console.log('╔══════════════════════════════════════════════╗');
  console.log('║         Hash bcrypt gerado com sucesso       ║');
  console.log('╠══════════════════════════════════════════════╣');
  console.log(`║ Senha:    ${senha.padEnd(33)}║`);
  console.log(`║ Hash:     ${hash.slice(0, 30).padEnd(33)}║`);
  console.log(`║ Completo: ${hash.padEnd(33)}║`);
  console.log('╚══════════════════════════════════════════════╝');
  console.log('\nUse este SQL para atualizar o usuário:');
  console.log(`UPDATE agr_users SET password_hash = '${hash}' WHERE email = 'usuario@email.com';`);
}

main().catch(console.error);
