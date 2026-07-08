/**
 * DataEncryptor - Criptografia AES-256-GCM + Hash SHA-256
 * 
 * Fornece criptografia simétrica para dados sensíveis
 * e hashing para integridade.
 */

import {
  randomBytes,
  createCipheriv,
  createDecipheriv,
  createHash,
  scryptSync,
} from 'crypto';

const ALGORITHM = 'aes-256-gcm';
const IV_LENGTH = 12;
const TAG_LENGTH = 16;

function deriveKey(secret: string): Buffer {
  return scryptSync(secret, 'ac-angry-salt', 32);
}

export const DataEncryptor = {
  /**
   * Criptografa texto usando AES-256-GCM
   * Formato: iv:tag:ciphertext (hex)
   */
  encrypt(text: string): string {
    const key = deriveKey(process.env.PKI_ENCRYPTION_KEY!);
    const iv = randomBytes(IV_LENGTH);
    const cipher = createCipheriv(ALGORITHM, key, iv);
    let encrypted = cipher.update(text, 'utf8', 'hex');
    encrypted += cipher.final('hex');
    const tag = cipher.getAuthTag().toString('hex');
    return `${iv.toString('hex')}:${tag}:${encrypted}`;
  },

  /**
   * Descriptografa texto criptografado com AES-256-GCM
   */
  decrypt(encrypted: string): string {
    const key = deriveKey(process.env.PKI_ENCRYPTION_KEY!);
    const parts = encrypted.split(':');
    if (parts.length !== 3) throw new Error('Formato de dado criptografado inválido.');
    const [ivHex, tagHex, data] = parts;
    const iv = Buffer.from(ivHex, 'hex');
    const tag = Buffer.from(tagHex, 'hex');
    const decipher = createDecipheriv(ALGORITHM, key, iv);
    decipher.setAuthTag(tag);
    let decrypted = decipher.update(data, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    return decrypted;
  },

  /**
   * Gera hash SHA-256 de dados
   */
  hash(data: string): string {
    return createHash('sha256').update(data).digest('hex');
  },

  /**
   * Gera hash chain para integridade sequencial
   */
  hashChain(prevHash: string, data: string): string {
    return createHash('sha256').update(prevHash + data).digest('hex');
  },
};
