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
  "http://localhost:3000",
  "http://localhost:3001",
  "https://vemapi.com.br",
  "https://www.vemapi.com.br",
  "https://angry.ac.br",
  "https://www.angry.ac.br",
  "https://ar.sua-empresa.com.br",
  "https://ra.icp-brasil.gov.br",
]);

// Mensagens internas reconhecidas (allowlist de tipos)
const ALLOWED_MSG_TYPES = new Set([
  "AR_BIOMETRIC_START_SESSION",
  "AR_BIOMETRIC_CAPTURE_FINGERPRINT",
  "AR_BIOMETRIC_CAPTURE_FACE",
  "AR_BIOMETRIC_ABORT",
  "AR_AGR_SIGN",
  "AR_AGR_LOGIN",
  "AR_AGR_APPROVE_ORDER",
  "AR_AGR_REVOKE_CERT",
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

    case "AR_AGR_SIGN":
      return handleAgrSign(message, tabId);

    case "AR_AGR_LOGIN":
      return handleAgrLogin(message, tabId);

    case "AR_AGR_APPROVE_ORDER":
      return handleAgrApproveOrder(message, tabId);

    case "AR_AGR_REVOKE_CERT":
      return handleAgrRevokeCert(message, tabId);

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
// AGR Sign — assinatura de payload com senha do token A3
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Assina um payload usando HMAC-SHA256 derivado da senha do token AGR.
 * A senha NUNCA é enviada em texto claro para lugar nenhum — apenas o hash
 * de verificação e a assinatura do payload via HMAC.
 *
 * @param {object} message
 *   - passwordHash: string (SHA-256 da senha do token AGR)
 *   - data: object (payload a ser assinado: sessionId, protocolId, action, nonce)
 * @param {string} tabId
 * @returns {Promise<object>}
 */
async function handleAgrSign(message, tabId) {
  const { passwordHash, data } = message;

  if (!passwordHash || typeof passwordHash !== "string" || passwordHash.length !== 64) {
    return { ok: false, error: "INVALID_PASSWORD_HASH" };
  }
  if (!data || typeof data !== "object") {
    return { ok: false, error: "INVALID_DATA" };
  }

  try {
    // 1. Importar o hash da senha como chave HMAC
    const hmacKey = await importHmacKey(passwordHash);

    // 2. Construir o payload a ser assinado
    const signPayload = {
      ...data,
      signedAt: Date.now(),
      agrVersion: "1.0",
      nonce: data.nonce || generateNonce(),
    };

    // 3. Calcular HMAC-SHA256
    const encoded = new TextEncoder().encode(JSON.stringify(signPayload));
    const sigBuffer = await crypto.subtle.sign("HMAC", hmacKey, encoded);
    const signature = bufferToBase64Url(new Uint8Array(sigBuffer));

    // 4. Prova de posse da senha (hash da senha + salt) para verificação
    const proofSalt = generateNonce().slice(0, 16);
    const proofInput = passwordHash + proofSalt + signPayload.nonce;
    const proofEncoded = new TextEncoder().encode(proofInput);
    const proofBuffer = await crypto.subtle.digest("SHA-256", proofEncoded);
    const proof = bufferToBase64Url(new Uint8Array(proofBuffer));

    return {
      ok: true,
      signature,
      proof,
      proofSalt,
      signedAt: signPayload.signedAt,
      dataHash: await sha256Hex(JSON.stringify(signPayload)),
    };
  } catch (err) {
    console.error("[AR-Bridge] AGR_SIGN error:", err);
    return { ok: false, error: "SIGN_FAILED", detail: err.message };
  }
}

/**
 * Realiza todo o fluxo de login AGR:
 *   biometria (5 dedos) → assinatura AGR → pacote consolidado
 */
async function handleAgrLogin(message, tabId) {
  const { nonce, issuedAt, passwordHash } = message;

  if (!passwordHash && !message.passwordHash) {
    return { ok: false, error: "PASSWORD_HASH_REQUIRED" };
  }

  try {
    // 1. Iniciar sessão biométrica
    const sessionResult = await handleStartSession(tabId);
    if (!sessionResult.ok) return sessionResult;

    const { sessionId } = sessionResult;

    // 2. Capturar os 5 dedos
    const fingerprints = [];
    for (let i = 0; i < 5; i++) {
      const captureResult = await handleCapture("fingerprint", {
        sessionId,
        nonce: generateNonce(),
        issuedAt: Date.now(),
      }, tabId);

      if (!captureResult.ok) {
        destroySession(sessionId);
        return captureResult;
      }

      fingerprints.push(captureResult);
    }

    // 3. Dados para assinatura AGR
    const signData = {
      action: "LOGIN",
      sessionId,
      nonce: nonce || generateNonce(),
      issuedAt: issuedAt || Date.now(),
      fingerprintCount: fingerprints.length,
      fingerprintHashes: fingerprints.map(f => f.meta?.nonce),
    };

    // 4. Assinar com senha AGR
    const signResult = await handleAgrSign({
      passwordHash: passwordHash || message.passwordHash,
      data: signData,
    }, tabId);

    if (!signResult.ok) {
      destroySession(sessionId);
      return signResult;
    }

    return {
      ok: true,
      sessionId,
      fingerprints,
      agrSignature: signResult,
      loginPackage: {
        biometricData: fingerprints,
        agrProof: signResult,
        issuedAt: signData.issuedAt,
      },
    };
  } catch (err) {
    return { ok: false, error: "AGR_LOGIN_FAILED", detail: err.message };
  }
}

/**
 * Fluxo de aprovação de pedido de certificado:
 *   biometria → assinatura AGR → dados do protocolo
 */
async function handleAgrApproveOrder(message, tabId) {
  const { passwordHash, protocolId, sessionToken } = message;

  if (!passwordHash) return { ok: false, error: "PASSWORD_HASH_REQUIRED" };
  if (!protocolId) return { ok: false, error: "PROTOCOL_ID_REQUIRED" };

  try {
    // 1. Iniciar sessão e capturar biometria (apenas 1 dedo para aprovação)
    const sessionResult = await handleStartSession(tabId);
    if (!sessionResult.ok) return sessionResult;

    const captureResult = await handleCapture("fingerprint", {
      sessionId: sessionResult.sessionId,
      nonce: generateNonce(),
      issuedAt: Date.now(),
    }, tabId);

    if (!captureResult.ok) {
      destroySession(sessionResult.sessionId);
      return captureResult;
    }

    // 2. Assinar dados de aprovação com senha AGR
    const signData = {
      action: "APPROVE_ORDER",
      protocolId,
      sessionId: sessionResult.sessionId,
      nonce: generateNonce(),
      issuedAt: Date.now(),
    };

    const signResult = await handleAgrSign({ passwordHash, data: signData }, tabId);
    if (!signResult.ok) {
      destroySession(sessionResult.sessionId);
      return signResult;
    }

    return {
      ok: true,
      sessionId: sessionResult.sessionId,
      biometricCapture: captureResult,
      agrSignature: signResult,
      approvalPackage: {
        protocolId,
        biometricData: captureResult,
        agrProof: signResult,
      },
    };
  } catch (err) {
    return { ok: false, error: "AGR_APPROVE_FAILED", detail: err.message };
  }
}

/**
 * Fluxo de revogação de certificado:
 *   biometria → assinatura AGR → dados de revogação
 */
async function handleAgrRevokeCert(message, tabId) {
  const { passwordHash, protocolId, reason, sessionToken } = message;

  if (!passwordHash) return { ok: false, error: "PASSWORD_HASH_REQUIRED" };
  if (!protocolId) return { ok: false, error: "PROTOCOL_ID_REQUIRED" };

  try {
    // 1. Captura biométrica + face (revogação exige biometria dupla)
    const sessionResult = await handleStartSession(tabId);
    if (!sessionResult.ok) return sessionResult;

    const [fpResult, faceResult] = await Promise.all([
      handleCapture("fingerprint", {
        sessionId: sessionResult.sessionId,
        nonce: generateNonce(),
        issuedAt: Date.now(),
      }, tabId),
      handleCapture("face", {
        sessionId: sessionResult.sessionId,
        nonce: generateNonce(),
        issuedAt: Date.now(),
      }, tabId),
    ]);

    if (!fpResult.ok) {
      destroySession(sessionResult.sessionId);
      return fpResult;
    }
    if (!faceResult.ok) {
      destroySession(sessionResult.sessionId);
      return faceResult;
    }

    // 2. Assinar dados de revogação
    const signData = {
      action: "REVOKE_CERT",
      protocolId,
      reason: reason || "Revogado pelo AGR",
      sessionId: sessionResult.sessionId,
      nonce: generateNonce(),
      issuedAt: Date.now(),
    };

    const signResult = await handleAgrSign({ passwordHash, data: signData }, tabId);
    if (!signResult.ok) {
      destroySession(sessionResult.sessionId);
      return signResult;
    }

    return {
      ok: true,
      sessionId: sessionResult.sessionId,
      biometricCapture: { fingerprint: fpResult, face: faceResult },
      agrSignature: signResult,
      revokePackage: {
        protocolId,
        reason: reason || "Revogado pelo AGR",
        biometricData: { fingerprint: fpResult, face: faceResult },
        agrProof: signResult,
      },
    };
  } catch (err) {
    return { ok: false, error: "AGR_REVOKE_FAILED", detail: err.message };
  }
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

/**
 * Importa uma string hexadecimal como chave HMAC-SHA256.
 * @param {string} hexKey  — 64 caracteres hex (32 bytes / 256 bits)
 * @returns {Promise<CryptoKey>}
 */
async function importHmacKey(hexKey) {
  const rawKey = new Uint8Array(32);
  for (let i = 0; i < 32; i++) {
    rawKey[i] = parseInt(hexKey.slice(i * 2, i * 2 + 2), 16);
  }
  return crypto.subtle.importKey(
    "raw",
    rawKey,
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign", "verify"]
  );
}

/**
 * Calcula SHA-256 de uma string e retorna em hex.
 * @param {string} input
 * @returns {Promise<string>}
 */
async function sha256Hex(input) {
  const encoded = new TextEncoder().encode(input);
  const hashBuffer = await crypto.subtle.digest("SHA-256", encoded);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, "0")).join("");
}
