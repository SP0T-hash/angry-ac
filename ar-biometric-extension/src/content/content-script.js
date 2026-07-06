/**
 * content-script.js
 *
 * Executa em contexto ISOLADO (world: "ISOLATED" no manifest).
 * Faz a ponte entre a página web (ANGRY) e a extensão (service worker + overlay biométrico).
 *
 * Fluxo completo:
 *   Página → CustomEvent → Content Script → Overlay UI → Service Worker → Native Host
 *                                                                              ↓
 *   Página ← CustomEvent ← Content Script ← Overlay UI ← Service Worker ←───┘
 *
 * Funcionalidades:
 *  - Injetar overlay biométrico com guia de dedos
 *  - Captura de impressão digital (5 dedos)
 *  - Assinatura com senha do Token AGR
 *  - Integração com ANGRY: login, aprovação de pedido, revogação
 */

"use strict";

// ─────────────────────────────────────────────────────────────────────────────
// Constantes
// ─────────────────────────────────────────────────────────────────────────────

const INBOUND_EVENT  = "AR_BRIDGE:REQUEST";
const OUTBOUND_EVENT = "AR_BRIDGE:RESPONSE";

// Ações que a página pode solicitar
const ALLOWED_ACTIONS = new Set([
  "START_SESSION",
  "CAPTURE_FINGERPRINT",
  "CAPTURE_FACE",
  "ABORT",
  "AGR_SIGN",
  "AGR_LOGIN",
  "AGR_APPROVE_ORDER",
  "AGR_REVOKE_CERT",
]);

const ACTION_TO_MSG_TYPE = {
  START_SESSION:        "AR_BIOMETRIC_START_SESSION",
  CAPTURE_FINGERPRINT:  "AR_BIOMETRIC_CAPTURE_FINGERPRINT",
  CAPTURE_FACE:         "AR_BIOMETRIC_CAPTURE_FACE",
  ABORT:                "AR_BIOMETRIC_ABORT",
};

// ─────────────────────────────────────────────────────────────────────────────
// Estado
// ─────────────────────────────────────────────────────────────────────────────

let overlayInstance = null;
let currentResolve = null;
let currentReject = null;

// ─────────────────────────────────────────────────────────────────────────────
// Listener de eventos vindos da página web
// ─────────────────────────────────────────────────────────────────────────────

document.addEventListener(INBOUND_EVENT, async (event) => {
  const raw = event?.detail;

  const validation = validateInboundPayload(raw);
  if (!validation.ok) {
    dispatchResponse(null, { ok: false, error: validation.error });
    return;
  }

  const { action, requestId, data } = validation.payload;

  try {
    let response;

    switch (action) {
      case "START_SESSION":
      case "CAPTURE_FINGERPRINT":
      case "CAPTURE_FACE":
      case "ABORT":
        response = await chrome.runtime.sendMessage({
          type: ACTION_TO_MSG_TYPE[action],
          ...sanitizeData(data),
        });
        break;

      case "AGR_LOGIN":
        response = await handleAgrLogin(data);
        break;

      case "AGR_APPROVE_ORDER":
        response = await handleAgrApproveOrder(data);
        break;

      case "AGR_REVOKE_CERT":
        response = await handleAgrRevokeCert(data);
        break;

      default:
        response = { ok: false, error: "UNHANDLED_ACTION" };
    }

    dispatchResponse(requestId, response);
  } catch (err) {
    dispatchResponse(requestId, {
      ok: false,
      error: "EXTENSION_ERROR",
      detail: err?.message,
    });
  }
}, { passive: true });

// ─────────────────────────────────────────────────────────────────────────────
// Handlers de alto nível (Overlay + Service Worker)
// ─────────────────────────────────────────────────────────────────────────────

/**
 * AGR Login: abre overlay → captura biometria → assina com token → retorna token JWT
 */
async function handleAgrLogin(data) {
  return new Promise((resolve, reject) => {
    currentResolve = resolve;
    currentReject = reject;

    // Abrir overlay biométrico
    showBiometricOverlay().then((overlay) => {
      // Quando a assinatura AGR for concluída, enviar para o backend
      overlay.on('agrSign', async (password) => {
        try {
          // 1. Capturar biometria (5 dedos)
          const bioResult = await captureFingerprintsViaSW(overlay);

          if (!bioResult.ok) {
            overlay.showError('Falha na captura biométrica: ' + bioResult.error);
            return;
          }

          // 2. Assinar com senha do token AGR
          overlay.setStep(4);

          // 3. Enviar para o backend ANGRY
          const response = await fetch('/api/auth/pki', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              type: 'BIOMETRIC',
              biometricData: bioResult,
              agrPassword: password,
              nonce: data.nonce,
            }),
          });

          const result = await response.json();

          if (result.success) {
            overlay.showResult(true, {
              message: 'Login AGR autorizado via biometria + token!',
              token: result.token?.slice(0, 20) + '...',
            });

            setTimeout(() => {
              overlay.destroy();
              resolve({ ok: true, token: result.token, session: result.agent });
            }, 1500);
          } else {
            overlay.showResult(false, { message: result.error || 'Falha na autenticação' });
            reject(new Error(result.error));
          }
        } catch (err) {
          overlay.showError(err.message);
          reject(err);
        }
      });

      overlay.on('cancel', () => {
        reject(new Error('Usuário cancelou'));
      });
    });
  });
}

/**
 * Aprovação de pedido: abre overlay → captura → assina → envia
 */
async function handleAgrApproveOrder(data) {
  return new Promise((resolve, reject) => {
    currentResolve = resolve;
    currentReject = reject;

    showBiometricOverlay().then((overlay) => {
      overlay.on('agrSign', async (password) => {
        try {
          const bioResult = await captureFingerprintsViaSW(overlay);

          if (!bioResult.ok) {
            overlay.showError('Falha na captura biométrica');
            return;
          }

          const response = await fetch('/api/protocol/update', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${data.sessionToken}`,
            },
            body: JSON.stringify({
              id: data.protocolId,
              updates: { status: 'ISSUED', biometry_status: 'VALIDATED' },
              agrSignature: {
                biometricData: bioResult,
                password: password,
              },
            }),
          });

          const result = await response.json();

          if (result.success) {
            overlay.showResult(true, {
              message: `Pedido ${data.protocolId} aprovado com sucesso!`,
            });
            setTimeout(() => {
              overlay.destroy();
              resolve({ ok: true });
            }, 1500);
          } else {
            overlay.showResult(false, { message: result.error });
            reject(new Error(result.error));
          }
        } catch (err) {
          overlay.showError(err.message);
          reject(err);
        }
      });

      overlay.on('cancel', () => reject(new Error('Usuário cancelou')));
    });
  });
}

/**
 * Revogação de certificado: abre overlay → captura → assina → envia
 */
async function handleAgrRevokeCert(data) {
  return new Promise((resolve, reject) => {
    currentResolve = resolve;
    currentReject = reject;

    showBiometricOverlay().then((overlay) => {
      overlay.on('agrSign', async (password) => {
        try {
          const bioResult = await captureFingerprintsViaSW(overlay);

          if (!bioResult.ok) {
            overlay.showError('Falha na captura biométrica');
            return;
          }

          const response = await fetch('/api/protocol/update', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${data.sessionToken}`,
            },
            body: JSON.stringify({
              id: data.protocolId,
              updates: { status: 'CANCELLED' },
              revokeReason: data.reason || 'Revogado pelo AGR',
              agrSignature: {
                biometricData: bioResult,
                password: password,
              },
            }),
          });

          const result = await response.json();

          if (result.success) {
            overlay.showResult(true, {
              message: `Certificado ${data.protocolId} revogado com sucesso!`,
            });
            setTimeout(() => {
              overlay.destroy();
              resolve({ ok: true });
            }, 1500);
          } else {
            overlay.showResult(false, { message: result.error });
            reject(new Error(result.error));
          }
        } catch (err) {
          overlay.showError(err.message);
          reject(err);
        }
      });

      overlay.on('cancel', () => reject(new Error('Usuário cancelou')));
    });
  });
}

// ─────────────────────────────────────────────────────────────────────────────
// Overlay biométrico
// ─────────────────────────────────────────────────────────────────────────────

async function showBiometricOverlay() {
  // Aguardar o script do overlay carregar
  while (typeof window.ARBiometricOverlay === 'undefined') {
    await new Promise(r => setTimeout(r, 100));
  }

  const overlay = window.ARBiometricOverlay.getInstance();
  overlayInstance = overlay;

  // Iniciar a simulação/exibição
  overlay.show();

  return overlay;
}

/**
 * Captura os 5 dedos via Service Worker (Native Messaging)
 */
async function captureFingerprintsViaSW(overlay) {
  // Iniciar sessão
  const sessionResp = await chrome.runtime.sendMessage({
    type: "AR_BIOMETRIC_START_SESSION",
  });

  if (!sessionResp.ok) {
    throw new Error('Falha ao iniciar sessão biométrica: ' + sessionResp.error);
  }

  const { sessionId } = sessionResp;

  // Capturar cada dedo
  const fingerprints = [];
  const fingerNames = ['polegar', 'indicador', 'médio', 'anelar', 'mínimo'];

  for (let i = 0; i < 5; i++) {
    overlay.setStep(2);
    overlay.setFingerGuide(i);

    const nonce = crypto.randomUUID();
    const issuedAt = Date.now();

    const captureResp = await chrome.runtime.sendMessage({
      type: "AR_BIOMETRIC_CAPTURE_FINGERPRINT",
      sessionId,
      nonce,
      issuedAt,
      fingerIndex: i,
    });

    if (!captureResp.ok) {
      throw new Error(`Falha na captura do ${fingerNames[i]}: ${captureResp.error}`);
    }

    fingerprints.push({
      finger: i,
      fingerName: fingerNames[i],
      template: captureResp.encryptedTemplate,
      quality: captureResp.meta?.quality,
      nfiq: captureResp.meta?.livenessScore,
    });

    overlay.setStep(3);
    overlay.setProgress(((i + 1) / 5) * 100);
  }

  // Qualidade
  overlay.setStep(4);
  const avgNfiq = Math.floor(fingerprints.reduce((s, f) => s + (f.nfiq || 0), 0) / 5);
  overlay.setQuality(avgNfiq);

  overlay.showResult(true, {
    fingerprints: 5,
    nfiq: avgNfiq,
    quality: fingerprints.every(f => f.quality >= 40) ? 100 : 75,
    message: 'Biometria capturada. Assine com seu token AGR.',
  });

  return {
    ok: true,
    sessionId,
    fingerprints,
    capturedAt: Date.now(),
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// Despacho de resposta para a página
// ─────────────────────────────────────────────────────────────────────────────

function dispatchResponse(requestId, responseData) {
  const safePayload = deepCloneSafe({ requestId, ...responseData });
  document.dispatchEvent(new CustomEvent(OUTBOUND_EVENT, {
    detail: safePayload,
    bubbles: false,
    cancelable: false,
  }));
}

// ─────────────────────────────────────────────────────────────────────────────
// Validação de payload
// ─────────────────────────────────────────────────────────────────────────────

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

  if (action !== "START_SESSION" && action !== "AGR_LOGIN") {
    if (!data || typeof data !== "object") {
      return { ok: false, error: "MISSING_DATA" };
    }
  }

  return { ok: true, payload: { action, requestId, data: data ?? {} } };
}

function sanitizeData(data) {
  return {
    sessionId:  typeof data.sessionId  === "string" ? data.sessionId  : undefined,
    nonce:      typeof data.nonce      === "string" ? data.nonce      : undefined,
    issuedAt:   typeof data.issuedAt   === "number" ? data.issuedAt   : undefined,
    fingerIndex: typeof data.fingerIndex === "number" ? data.fingerIndex : undefined,
  };
}

function deepCloneSafe(obj) {
  try {
    return JSON.parse(JSON.stringify(obj));
  } catch {
    return { ok: false, error: "SERIALIZATION_ERROR" };
  }
}
