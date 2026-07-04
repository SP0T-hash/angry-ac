/**
 * service-worker.js  (Manifest V3 — background)
 *
 * Responsabilidades:
 *  1. Receber mensagens do content-script (via chrome.runtime.onMessage).
 *  2. Gerenciar o ciclo de vida da conexão com o Native Messaging Host.
 *  3. Criptografar/assinar o payload biométrico antes de devolvê-lo à aba.
 *  4. Manter registro de sessões e nonces para prevenção de replay.
 *
 * Nenhuma chave ou template biométrico é persistido em disco.
 */

import {
  generateEphemeralECDHKeyPair,
  generateSigningKeyPair,
  encryptPayload,
  signPayload,
  exportPublicKeyAsJWK,
  generateNonce,
  isTimestampFresh,
  bufferToBase64Url,
} from "./crypto-utils.js";

import {
  createSession,
  getSession,
  destroySession,
  consumeNonce,
} from "./session-store.js";

// ─────────────────────────────────────────────────────────────────────────────
// Constantes
// ─────────────────────────────────────────────────────────────────────────────

const NATIVE_HOST_ID    = "com.ar.biometric.host";
const ALLOWED_ORIGINS   = new Set([
  "https://ar.sua-empresa.com.br",
  "https://ra.icp-brasil.gov.br",
]);

// Mensagens internas reconhecidas (allowlist de tipos)
const ALLOWED_MSG_TYPES = new Set([
  "AR_BIOMETRIC_START_SESSION",
  "AR_BIOMETRIC_CAPTURE_FINGERPRINT",
  "AR_BIOMETRIC_CAPTURE_FACE",
  "AR_BIOMETRIC_ABORT",
]);

// ─────────────────────────────────────────────────────────────────────────────
// Listener principal de mensagens (content-script -> service worker)
// ─────────────────────────────────────────────────────────────────────────────

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  // Validação de origem: apenas abas do domínio autorizado
  if (!isSenderTrusted(sender)) {
    console.warn("[AR-Bridge] Mensagem de origem não autorizada.", sender?.url);
    sendResponse({ ok: false, error: "UNAUTHORIZED_ORIGIN" });
    return false;
  }

  // Allowlist de tipos de mensagem
  if (!ALLOWED_MSG_TYPES.has(message?.type)) {
    console.warn("[AR-Bridge] Tipo de mensagem desconhecido:", message?.type);
    sendResponse({ ok: false, error: "UNKNOWN_MESSAGE_TYPE" });
    return false;
  }

  // Processamento assíncrono — retorna true para manter o canal aberto
  handleMessage(message, sender).then(sendResponse).catch(err => {
    console.error("[AR-Bridge] Erro ao processar mensagem:", err);
    sendResponse({ ok: false, error: "INTERNAL_ERROR", detail: err.message });
  });

  return true; // sinaliza resposta assíncrona
});

// ─────────────────────────────────────────────────────────────────────────────
// Dispatcher de mensagens
// ─────────────────────────────────────────────────────────────────────────────

async function handleMessage(message, sender) {
  const tabId = String(sender.tab?.id ?? "unknown");

  switch (message.type) {
    case "AR_BIOMETRIC_START_SESSION":
      return handleStartSession(tabId);

    case "AR_BIOMETRIC_CAPTURE_FINGERPRINT":
      return handleCapture("fingerprint", message, tabId);

    case "AR_BIOMETRIC_CAPTURE_FACE":
      return handleCapture("face", message, tabId);

    case "AR_BIOMETRIC_ABORT":
      return handleAbort(message.sessionId, tabId);

    default:
      return { ok: false, error: "UNHANDLED_TYPE" };
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Início de sessão — gera chaves efêmeras e devolve a chave pública ao cliente
// ─────────────────────────────────────────────────────────────────────────────

async function handleStartSession(tabId) {
  const sessionId = generateNonce(); // reutiliza gerador de UUIDs v4

  const [ecdhPair, signingPair] = await Promise.all([
    generateEphemeralECDHKeyPair(),
    generateSigningKeyPair(),
  ]);

  createSession(sessionId, {
    ecdhPrivateKey:  ecdhPair.privateKey,
    ecdhPublicKey:   ecdhPair.publicKey,
    signingPrivateKey: signingPair.privateKey,
    signingPublicKey:  signingPair.publicKey,
  }, tabId);

  // Exporta apenas as chaves PÚBLICAS para o cliente
  const [ecdhPublicJwk, signingPublicJwk] = await Promise.all([
    exportPublicKeyAsJWK(ecdhPair.publicKey),
    exportPublicKeyAsJWK(signingPair.publicKey),
  ]);

  return {
    ok: true,
    sessionId,
    ecdhPublicKey:    ecdhPublicJwk,
    signingPublicKey: signingPublicJwk,
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// Captura biométrica — aciona o Native Messaging Host
// ─────────────────────────────────────────────────────────────────────────────

async function handleCapture(modality, message, tabId) {
  const { sessionId, nonce, issuedAt } = message;

  // 1. Validação de sessão
  const session = getSession(sessionId);
  if (!session) return { ok: false, error: "SESSION_NOT_FOUND" };
  if (session.originTabId !== tabId) return { ok: false, error: "SESSION_TAB_MISMATCH" };

  // 2. Anti-replay: nonce único + janela de tempo
  if (!nonce || !consumeNonce(nonce)) return { ok: false, error: "REPLAY_DETECTED" };
  if (!issuedAt || !isTimestampFresh(issuedAt)) return { ok: false, error: "TIMESTAMP_EXPIRED" };

  // 3. Comunicação com o Native Messaging Host
  let nativeResponse;
  try {
    nativeResponse = await callNativeHost({
      command:   modality === "face" ? "CAPTURE_FACE" : "CAPTURE_FINGERPRINT",
      sessionId,
      nonce,
      issuedAt,
    });
  } catch (err) {
    return { ok: false, error: "NATIVE_HOST_ERROR", detail: err.message };
  }

  // 4. Valida resposta do host nativo
  if (!nativeResponse.ok) {
    return { ok: false, error: "CAPTURE_FAILED", detail: nativeResponse.error };
  }

  // 5. Valida liveness score (PAD — Presentation Attack Detection)
  const livenessScore = nativeResponse.livenessScore ?? 0;
  if (livenessScore < 0.85) {
    console.warn(`[AR-Bridge] Liveness insuficiente: ${livenessScore}`);
    return { ok: false, error: "LIVENESS_FAILED", livenessScore };
  }

  // 6. Constrói e criptografa o pacote biométrico
  const biometricPackage = await buildEncryptedPackage(
    session,
    nonce,
    issuedAt,
    modality,
    nativeResponse
  );

  // 7. Destrói sessão após uso único (fluxo one-shot)
  destroySession(sessionId);

  return { ok: true, ...biometricPackage };
}

// ─────────────────────────────────────────────────────────────────────────────
// Construção do pacote criptografado
// ─────────────────────────────────────────────────────────────────────────────

async function buildEncryptedPackage(session, nonce, issuedAt, modality, nativeResponse) {
  // Payload interno — NUNCA viaja em claro para fora do service worker
  const innerPayload = {
    modality,
    template:      nativeResponse.templateB64,    // base64url do template ISO/ANSI
    quality:       nativeResponse.quality,
    livenessScore: nativeResponse.livenessScore,
    deviceId:      nativeResponse.deviceId,
    nonce,
    issuedAt,
    capturedAt:    Date.now(),
  };

  // Envelope assinado — inclui nonce + issuedAt para anti-replay verificável pelo backend
  const signedEnvelope = {
    ...innerPayload,
    // template biométrico já está no payload, mas aqui apenas seus metadados viajam na assinatura
    template: "[REDACTED_IN_SIGNATURE_INPUT]",
  };

  const signature = await signPayload(session.signingPrivateKey, signedEnvelope);

  // Cifra o payload completo com a chave pública efêmera da sessão
  // Em produção, cifrar com a chave pública do BACKEND (ECDH remoto)
  // Aqui utilizamos a chave efêmera local como demonstração do fluxo
  const { iv, ciphertext } = await encryptPayload(
    // Em produção: chave derivada do ECDH com o servidor backend
    // Para a demonstração, usamos um raw AES derivado da chave pública efêmera
    await deriveAESFromPublicKey(session.ecdhPublicKey),
    innerPayload
  );

  const publicKeyJwk = await exportPublicKeyAsJWK(session.signingPublicKey);

  return {
    encryptedTemplate: { iv, ciphertext },
    signature,
    signingPublicKey: publicKeyJwk,
    meta: {
      modality,
      quality:       nativeResponse.quality,
      livenessScore: nativeResponse.livenessScore,
      nonce,
      issuedAt,
      capturedAt:    innerPayload.capturedAt,
      extensionVersion: chrome.runtime.getManifest().version,
    },
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// Abort de sessão
// ─────────────────────────────────────────────────────────────────────────────

async function handleAbort(sessionId, tabId) {
  const session = getSession(sessionId);
  if (session && session.originTabId === tabId) destroySession(sessionId);
  return { ok: true };
}

// ─────────────────────────────────────────────────────────────────────────────
// Native Messaging — comunicação com o host nativo
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Envia um comando ao Native Messaging Host e aguarda resposta.
 * Usa um timeout de 30 s para evitar travamentos.
 * @param {object} command
 * @returns {Promise<object>}
 */
function callNativeHost(command) {
  return new Promise((resolve, reject) => {
    let port;
    const timeoutId = setTimeout(() => {
      port?.disconnect();
      reject(new Error("NATIVE_HOST_TIMEOUT"));
    }, 30_000);

    try {
      port = chrome.runtime.connectNative(NATIVE_HOST_ID);
    } catch (err) {
      clearTimeout(timeoutId);
      reject(new Error(`NATIVE_CONNECT_FAILED: ${err.message}`));
      return;
    }

    port.onMessage.addListener(response => {
      clearTimeout(timeoutId);
      port.disconnect();
      resolve(response);
    });

    port.onDisconnect.addListener(() => {
      clearTimeout(timeoutId);
      const err = chrome.runtime.lastError;
      if (err) reject(new Error(`NATIVE_DISCONNECTED: ${err.message}`));
    });

    port.postMessage(command);
  });
}

// ─────────────────────────────────────────────────────────────────────────────
// Helpers internos
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Valida se a mensagem veio de uma aba de domínio autorizado.
 * @param {chrome.runtime.MessageSender} sender
 * @returns {boolean}
 */
function isSenderTrusted(sender) {
  if (!sender?.tab?.url) return false;
  try {
    const { origin } = new URL(sender.tab.url);
    return ALLOWED_ORIGINS.has(origin);
  } catch {
    return false;
  }
}

/**
 * Deriva uma chave AES-GCM a partir de um ponto de chave pública ECDH.
 * NOTA: Em produção, a chave AES deve ser derivada via ECDH com a chave
 * pública do SERVIDOR (não da própria extensão).
 * @param {CryptoKey} ecdhPublicKey
 * @returns {Promise<CryptoKey>}
 */
async function deriveAESFromPublicKey(ecdhPublicKey) {
  // Exporta a chave pública como raw e deriva AES via HKDF
  const rawKey = await crypto.subtle.exportKey("raw", ecdhPublicKey);
  const baseKey = await crypto.subtle.importKey("raw", rawKey, "HKDF", false, ["deriveKey"]);
  return crypto.subtle.deriveKey(
    {
      name: "HKDF",
      hash: "SHA-256",
      salt: new Uint8Array(32),
      info: new TextEncoder().encode("AR-Biometric-AES-v1"),
    },
    baseKey,
    { name: "AES-GCM", length: 256 },
    false,
    ["encrypt", "decrypt"]
  );
}
