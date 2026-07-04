/**
 * content-script.js
 *
 * Executa em contexto ISOLADO (world: "ISOLATED" no manifest).
 * Não tem acesso direto ao window.location nem ao DOM de scripts da página.
 *
 * Responsabilidades:
 *  1. Escutar CustomEvents despachados pela aplicação web da AR.
 *  2. Validar e sanitizar os dados recebidos antes de repassá-los.
 *  3. Encaminhar ao Service Worker via chrome.runtime.sendMessage.
 *  4. Devolver a resposta à aplicação web via CustomEvent de retorno.
 *
 * Segurança:
 *  - Apenas eventos com namespace "AR_BRIDGE:" são processados.
 *  - O payload é validado por schema antes do repasse.
 *  - Nenhum dado sensível é logado.
 *  - O canal de comunicação é unidirecional: página -> extension.
 *    A resposta volta por um evento distinto, evitando injeção reversa.
 */

"use strict";

// ─────────────────────────────────────────────────────────────────────────────
// Constantes
// ─────────────────────────────────────────────────────────────────────────────

const INBOUND_EVENT  = "AR_BRIDGE:REQUEST";   // página -> extensão
const OUTBOUND_EVENT = "AR_BRIDGE:RESPONSE";  // extensão -> página

// Tipos de ação que a página pode solicitar
const ALLOWED_ACTIONS = new Set([
  "START_SESSION",
  "CAPTURE_FINGERPRINT",
  "CAPTURE_FACE",
  "ABORT",
]);

// Mapeamento para tipos de mensagem do service worker
const ACTION_TO_MSG_TYPE = {
  START_SESSION:        "AR_BIOMETRIC_START_SESSION",
  CAPTURE_FINGERPRINT:  "AR_BIOMETRIC_CAPTURE_FINGERPRINT",
  CAPTURE_FACE:         "AR_BIOMETRIC_CAPTURE_FACE",
  ABORT:                "AR_BIOMETRIC_ABORT",
};

// ─────────────────────────────────────────────────────────────────────────────
// Listener de eventos vindos da página web
// ─────────────────────────────────────────────────────────────────────────────

document.addEventListener(INBOUND_EVENT, async (event) => {
  const raw = event?.detail;

  // 1. Validação básica do payload
  const validation = validateInboundPayload(raw);
  if (!validation.ok) {
    dispatchResponse(null, { ok: false, error: validation.error });
    return;
  }

  const { action, requestId, data } = validation.payload;

  try {
    // 2. Repassa ao Service Worker
    const response = await chrome.runtime.sendMessage({
      type: ACTION_TO_MSG_TYPE[action],
      ...sanitizeData(data),
    });

    // 3. Devolve a resposta para a página
    dispatchResponse(requestId, response);

  } catch (err) {
    // O service worker pode estar inativo (Manifest V3 suspende o SW)
    // O Chrome vai reativá-lo automaticamente, mas pode haver latência
    dispatchResponse(requestId, {
      ok: false,
      error: "EXTENSION_UNAVAILABLE",
      detail: err?.message,
    });
  }
}, { passive: true });

// ─────────────────────────────────────────────────────────────────────────────
// Despacho de resposta para a página
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Despacha um CustomEvent de resposta para a página.
 * O dado viaja como cópia estruturada — sem referência a objetos internos.
 * @param {string|null} requestId
 * @param {object} responseData
 */
function dispatchResponse(requestId, responseData) {
  const safePayload = deepCloneSafe({ requestId, ...responseData });
  document.dispatchEvent(new CustomEvent(OUTBOUND_EVENT, {
    detail: safePayload,
    bubbles: false,
    cancelable: false,
  }));
}

// ─────────────────────────────────────────────────────────────────────────────
// Validação de schema do payload de entrada
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Valida o payload recebido da página.
 * Rejeita qualquer coisa que não corresponda ao schema esperado.
 */
function validateInboundPayload(raw) {
  if (!raw || typeof raw !== "object") {
    return { ok: false, error: "INVALID_PAYLOAD_TYPE" };
  }

  const { action, requestId, data } = raw;

  if (typeof action !== "string" || !ALLOWED_ACTIONS.has(action)) {
    return { ok: false, error: "INVALID_ACTION" };
  }

  if (typeof requestId !== "string" || requestId.length > 128) {
    return { ok: false, error: "INVALID_REQUEST_ID" };
  }

  // Validações específicas por ação
  if (action !== "START_SESSION") {
    if (!data || typeof data !== "object") {
      return { ok: false, error: "MISSING_DATA" };
    }

    if (action !== "ABORT" && typeof data.sessionId !== "string") {
      return { ok: false, error: "MISSING_SESSION_ID" };
    }

    // Nonce e timestamp são obrigatórios para captura
    if ((action === "CAPTURE_FINGERPRINT" || action === "CAPTURE_FACE")) {
      if (typeof data.nonce !== "string" || data.nonce.length !== 36) {
        return { ok: false, error: "INVALID_NONCE" };
      }
      if (typeof data.issuedAt !== "number") {
        return { ok: false, error: "MISSING_ISSUED_AT" };
      }
    }
  }

  return { ok: true, payload: { action, requestId, data: data ?? {} } };
}

// ─────────────────────────────────────────────────────────────────────────────
// Sanitização do payload
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Extrai apenas os campos conhecidos do objeto data.
 * Previne a injeção de campos arbitrários no service worker.
 */
function sanitizeData(data) {
  return {
    sessionId:  typeof data.sessionId === "string"  ? data.sessionId  : undefined,
    nonce:      typeof data.nonce     === "string"  ? data.nonce      : undefined,
    issuedAt:   typeof data.issuedAt  === "number"  ? data.issuedAt   : undefined,
  };
}

/**
 * Clona profundamente um objeto usando apenas primitivos.
 * Garante que nenhum protótipo malicioso seja transmitido.
 */
function deepCloneSafe(obj) {
  try {
    return JSON.parse(JSON.stringify(obj));
  } catch {
    return { ok: false, error: "SERIALIZATION_ERROR" };
  }
}
