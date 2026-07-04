/**
 * crypto-utils.js
 * Módulo de criptografia exclusivamente via WebCrypto API nativa do navegador.
 * Sem dependências externas — superfície de ataque mínima.
 *
 * Algoritmos escolhidos alinhados com o DOC-ICP-01.01 (ICP-Brasil):
 *  - Troca de chaves: ECDH P-256
 *  - Cifragem:        AES-GCM 256-bit
 *  - Assinatura:      ECDSA P-256 + SHA-256
 *  - Hash:            SHA-256
 */

const CRYPTO = globalThis.crypto.subtle;

// ─────────────────────────────────────────────────────────────────────────────
// Geração de par de chaves efêmero para troca ECDH
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Gera um par de chaves ECDH efêmero (P-256).
 * Deve ser gerado a cada sessão de captura biométrica.
 * @returns {Promise<CryptoKeyPair>}
 */
export async function generateEphemeralECDHKeyPair() {
  return CRYPTO.generateKey(
    { name: "ECDH", namedCurve: "P-256" },
    false,       // não exportável — chave privada nunca sai do contexto
    ["deriveKey"]
  );
}

/**
 * Deriva uma chave AES-GCM 256-bit a partir de uma chave pública remota (ECDH).
 * @param {CryptoKey} localPrivateKey
 * @param {CryptoKey} remotePublicKey
 * @returns {Promise<CryptoKey>}
 */
export async function deriveSharedAESKey(localPrivateKey, remotePublicKey) {
  return CRYPTO.deriveKey(
    { name: "ECDH", public: remotePublicKey },
    localPrivateKey,
    { name: "AES-GCM", length: 256 },
    false,
    ["encrypt", "decrypt"]
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Cifragem e decifragem AES-GCM
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Cifra um payload (objeto JS) com AES-GCM.
 * Um IV de 12 bytes é gerado aleatoriamente para cada operação.
 * @param {CryptoKey} aesKey
 * @param {object} payload
 * @returns {Promise<{iv: string, ciphertext: string}>}  base64url
 */
export async function encryptPayload(aesKey, payload) {
  const iv = globalThis.crypto.getRandomValues(new Uint8Array(12));
  const encoded = new TextEncoder().encode(JSON.stringify(payload));

  const cipherBuffer = await CRYPTO.encrypt(
    { name: "AES-GCM", iv, tagLength: 128 },
    aesKey,
    encoded
  );

  return {
    iv: bufferToBase64Url(iv),
    ciphertext: bufferToBase64Url(cipherBuffer),
  };
}

/**
 * Decifra um payload AES-GCM.
 * @param {CryptoKey} aesKey
 * @param {string} ivB64
 * @param {string} ciphertextB64
 * @returns {Promise<object>}
 */
export async function decryptPayload(aesKey, ivB64, ciphertextB64) {
  const iv = base64UrlToBuffer(ivB64);
  const cipherBuffer = base64UrlToBuffer(ciphertextB64);

  const plainBuffer = await CRYPTO.decrypt(
    { name: "AES-GCM", iv, tagLength: 128 },
    aesKey,
    cipherBuffer
  );

  return JSON.parse(new TextDecoder().decode(plainBuffer));
}

// ─────────────────────────────────────────────────────────────────────────────
// Assinatura ECDSA (autenticidade + integridade + anti-replay via nonce)
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Gera par de chaves ECDSA para assinatura de pacotes.
 * A chave pública é enviada ao backend para validação posterior.
 * @returns {Promise<CryptoKeyPair>}
 */
export async function generateSigningKeyPair() {
  return CRYPTO.generateKey(
    { name: "ECDSA", namedCurve: "P-256" },
    true,           // exportável — chave pública precisa ser enviada ao backend
    ["sign", "verify"]
  );
}

/**
 * Assina um payload serializado incluindo o nonce e o timestamp.
 * @param {CryptoKey} signingPrivateKey
 * @param {object} payload  — deve incluir nonce e issuedAt
 * @returns {Promise<string>} assinatura em base64url
 */
export async function signPayload(signingPrivateKey, payload) {
  const encoded = new TextEncoder().encode(JSON.stringify(payload));
  const sigBuffer = await CRYPTO.sign(
    { name: "ECDSA", hash: "SHA-256" },
    signingPrivateKey,
    encoded
  );
  return bufferToBase64Url(sigBuffer);
}

/**
 * Verifica uma assinatura ECDSA. Usado opcionalmente pelo content-script
 * para validar mensagens vindas do service worker.
 * @param {CryptoKey} signingPublicKey
 * @param {string} signatureB64
 * @param {object} payload
 * @returns {Promise<boolean>}
 */
export async function verifySignature(signingPublicKey, signatureB64, payload) {
  const sig = base64UrlToBuffer(signatureB64);
  const encoded = new TextEncoder().encode(JSON.stringify(payload));
  return CRYPTO.verify(
    { name: "ECDSA", hash: "SHA-256" },
    signingPublicKey,
    sig,
    encoded
  );
}

/**
 * Exporta uma CryptoKey pública para formato JWK (envio ao backend).
 * @param {CryptoKey} publicKey
 * @returns {Promise<JsonWebKey>}
 */
export async function exportPublicKeyAsJWK(publicKey) {
  return CRYPTO.exportKey("jwk", publicKey);
}

// ─────────────────────────────────────────────────────────────────────────────
// Nonce e anti-replay
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Gera um nonce criptograficamente seguro (UUID v4 derivado de getRandomValues).
 * @returns {string}
 */
export function generateNonce() {
  const bytes = globalThis.crypto.getRandomValues(new Uint8Array(16));
  bytes[6] = (bytes[6] & 0x0f) | 0x40; // versão 4
  bytes[8] = (bytes[8] & 0x3f) | 0x80; // variante RFC 4122
  const hex = [...bytes].map(b => b.toString(16).padStart(2, "0")).join("");
  return `${hex.slice(0,8)}-${hex.slice(8,12)}-${hex.slice(12,16)}-${hex.slice(16,20)}-${hex.slice(20)}`;
}

/**
 * Valida se um timestamp está dentro de uma janela de ±WINDOW_MS.
 * Mitiga ataques de replay com payload expirado.
 * @param {number} issuedAt  — epoch ms
 * @param {number} [windowMs=30000]
 * @returns {boolean}
 */
export function isTimestampFresh(issuedAt, windowMs = 30_000) {
  const delta = Math.abs(Date.now() - issuedAt);
  return delta <= windowMs;
}

// ─────────────────────────────────────────────────────────────────────────────
// Utilitários de codificação
// ─────────────────────────────────────────────────────────────────────────────

export function bufferToBase64Url(buffer) {
  const bytes = new Uint8Array(buffer);
  let binary = "";
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=/g, "");
}

export function base64UrlToBuffer(b64url) {
  const b64 = b64url.replace(/-/g, "+").replace(/_/g, "/");
  const padded = b64.padEnd(b64.length + (4 - b64.length % 4) % 4, "=");
  const binary = atob(padded);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
  return bytes.buffer;
}
