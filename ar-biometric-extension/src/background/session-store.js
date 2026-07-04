/**
 * session-store.js
 * Armazenamento em memória de dados de sessão biométrica.
 *
 * Regras de segurança:
 *  - Chaves criptográficas ficam apenas em memória (nunca em chrome.storage).
 *  - Cada sessão tem TTL de SESSION_TTL_MS após o qual é descartada.
 *  - O nonce de cada sessão é registrado para detecção de replay dentro do TTL.
 */

const SESSION_TTL_MS  = 5 * 60 * 1_000;  // 5 minutos
const MAX_SESSIONS    = 10;               // limite de sessões simultâneas

/** @type {Map<string, SessionEntry>} */
const sessions = new Map();

/** @type {Set<string>} nonces já vistos — anti-replay */
const usedNonces = new Set();

/**
 * @typedef {object} SessionEntry
 * @property {string}     sessionId
 * @property {CryptoKey}  signingPrivateKey
 * @property {CryptoKey}  signingPublicKey
 * @property {CryptoKey}  ecdhPrivateKey
 * @property {CryptoKey}  ecdhPublicKey
 * @property {string}     originTabId
 * @property {number}     createdAt
 * @property {number}     expiresAt
 */

/**
 * Cria e armazena uma nova sessão biométrica.
 * @param {string} sessionId
 * @param {object} keys
 * @param {string} originTabId
 * @returns {SessionEntry}
 */
export function createSession(sessionId, keys, originTabId) {
  enforceCapacity();
  const now = Date.now();
  const entry = {
    sessionId,
    ...keys,
    originTabId,
    createdAt: now,
    expiresAt: now + SESSION_TTL_MS,
  };
  sessions.set(sessionId, entry);
  return entry;
}

/**
 * Recupera uma sessão válida (verifica TTL).
 * @param {string} sessionId
 * @returns {SessionEntry|null}
 */
export function getSession(sessionId) {
  const entry = sessions.get(sessionId);
  if (!entry) return null;
  if (Date.now() > entry.expiresAt) {
    sessions.delete(sessionId);
    return null;
  }
  return entry;
}

/**
 * Remove explicitamente uma sessão após conclusão ou erro.
 * @param {string} sessionId
 */
export function destroySession(sessionId) {
  sessions.delete(sessionId);
}

/**
 * Verifica e registra um nonce.
 * Retorna true se o nonce for inédito (seguro); false se replay detectado.
 * @param {string} nonce
 * @returns {boolean}
 */
export function consumeNonce(nonce) {
  if (usedNonces.has(nonce)) return false;
  usedNonces.add(nonce);
  // Limpa nonces antigos periodicamente para evitar crescimento ilimitado.
  if (usedNonces.size > 10_000) {
    const iter = usedNonces.values();
    for (let i = 0; i < 1_000; i++) usedNonces.delete(iter.next().value);
  }
  return true;
}

/**
 * Garante que o mapa de sessões não ultrapasse MAX_SESSIONS.
 * Remove a sessão mais antiga quando necessário.
 */
function enforceCapacity() {
  if (sessions.size < MAX_SESSIONS) return;
  const oldest = [...sessions.entries()].sort((a, b) => a[1].createdAt - b[1].createdAt)[0];
  if (oldest) sessions.delete(oldest[0]);
}
