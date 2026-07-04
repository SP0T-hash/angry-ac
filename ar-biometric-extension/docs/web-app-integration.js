/**
 * web-app-integration.js
 * Exemplo de como a aplicação web da AR deve interagir com a extensão.
 *
 * Este código roda NO CONTEXTO DA PÁGINA (não da extensão).
 * A comunicação é feita via CustomEvents para o content-script.
 *
 * Uso:
 *   const bridge = new ArBiometricBridge();
 *   const session = await bridge.startSession();
 *   const result  = await bridge.captureFingerprint(session.sessionId);
 *   // Enviar result.encryptedTemplate + result.signature para o backend
 */

"use strict";

const OUTBOUND_EVENT = "AR_BRIDGE:REQUEST";
const INBOUND_EVENT  = "AR_BRIDGE:RESPONSE";

class ArBiometricBridge {
  #pendingRequests = new Map(); // requestId -> { resolve, reject }

  constructor() {
    this.#setupResponseListener();
  }

  // ─────────────────────────────────────────────────────────────────────────
  // API pública
  // ─────────────────────────────────────────────────────────────────────────

  /**
   * Inicia uma sessão biométrica e obtém o sessionId + chaves públicas.
   * @returns {Promise<{ sessionId: string, ecdhPublicKey: object, signingPublicKey: object }>}
   */
  async startSession() {
    return this.#dispatch("START_SESSION", {});
  }

  /**
   * Solicita captura de impressão digital.
   * @param {string} sessionId
   * @returns {Promise<BiometricResult>}
   */
  async captureFingerprint(sessionId) {
    const { nonce, issuedAt } = this.#buildNoncePayload();
    return this.#dispatch("CAPTURE_FINGERPRINT", { sessionId, nonce, issuedAt });
  }

  /**
   * Solicita captura facial.
   * @param {string} sessionId
   * @returns {Promise<BiometricResult>}
   */
  async captureFace(sessionId) {
    const { nonce, issuedAt } = this.#buildNoncePayload();
    return this.#dispatch("CAPTURE_FACE", { sessionId, nonce, issuedAt });
  }

  /**
   * Aborta uma sessão em andamento.
   * @param {string} sessionId
   */
  async abortSession(sessionId) {
    return this.#dispatch("ABORT", { sessionId });
  }

  // ─────────────────────────────────────────────────────────────────────────
  // Internals
  // ─────────────────────────────────────────────────────────────────────────

  #dispatch(action, data) {
    return new Promise((resolve, reject) => {
      const requestId = this.#generateRequestId();
      const timeoutId = setTimeout(() => {
        this.#pendingRequests.delete(requestId);
        reject(new Error("AR_BRIDGE_TIMEOUT"));
      }, 35_000);

      this.#pendingRequests.set(requestId, {
        resolve: (val) => { clearTimeout(timeoutId); resolve(val); },
        reject:  (err) => { clearTimeout(timeoutId); reject(err);  },
      });

      document.dispatchEvent(new CustomEvent(OUTBOUND_EVENT, {
        detail: { action, requestId, data },
        bubbles: false,
        cancelable: false,
      }));
    });
  }

  #setupResponseListener() {
    document.addEventListener(INBOUND_EVENT, (event) => {
      const { requestId, ok, error, ...rest } = event?.detail ?? {};
      const pending = this.#pendingRequests.get(requestId);
      if (!pending) return;

      this.#pendingRequests.delete(requestId);

      if (ok) pending.resolve({ ok: true, ...rest });
      else pending.reject(Object.assign(new Error(error ?? "BRIDGE_ERROR"), { bridgeError: error }));
    }, { passive: true });
  }

  #buildNoncePayload() {
    return {
      nonce:    crypto.randomUUID(),
      issuedAt: Date.now(),
    };
  }

  #generateRequestId() {
    return `req-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Exemplo de uso completo em um fluxo de emissão de certificado
// ─────────────────────────────────────────────────────────────────────────────

async function exemploFluxoEmissao() {
  const bridge = new ArBiometricBridge();

  try {
    // 1. Iniciar sessão
    const session = await bridge.startSession();
    console.log("Sessão iniciada:", session.sessionId);

    // 2. Capturar digital (o leitor será acionado pelo host nativo)
    const result = await bridge.captureFingerprint(session.sessionId);

    if (!result.ok) {
      console.error("Captura falhou:", result.error);
      return;
    }

    // 3. Enviar o pacote criptografado para o backend da AR
    //    O backend irá:
    //    a) Verificar a assinatura ECDSA com a signingPublicKey
    //    b) Decifrar o template com a chave privada AES (ECDH com servidor)
    //    c) Validar o nonce (não reutilizado) e o timestamp
    //    d) Verificar o livenessScore >= 0.85
    //    e) Comparar o template com o cadastro do solicitante
    const backendResponse = await fetch("/api/certificado/validar-biometria", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        encryptedTemplate: result.encryptedTemplate,
        signature:         result.signature,
        signingPublicKey:  result.signingPublicKey,
        meta:              result.meta,
        // Inclua também o token CSRF e o ID da solicitação de certificado
      }),
    });

    const validation = await backendResponse.json();
    console.log("Validação biométrica:", validation);

  } catch (err) {
    if (err.bridgeError === "LIVENESS_FAILED") {
      alert("Detecção de vivacidade falhou. Certifique-se de que está olhando para o leitor.");
    } else if (err.bridgeError === "REPLAY_DETECTED") {
      alert("Sessão inválida. Recarregue a página e tente novamente.");
    } else {
      console.error("Erro no fluxo biométrico:", err);
    }
  }
}
