/**
 * angry-integration.js
 *
 * Módulo de integração entre a aplicação web ANGRY (Autoridade de Registro)
 * e a extensão AR Biometric Bridge.
 *
 * Este script é carregado pela própria aplicação ANGRY para invocar
 * a biometria + assinatura AGR através da extensão.
 *
 * Fluxo:
 *   1. ANGRY carrega este módulo.
 *   2. Cada operação (login, aprovação, revogação) dispara um CustomEvent.
 *   3. O content-script escuta e abre o overlay biométrico.
 *   4. O resultado retorna via outro CustomEvent.
 *
 * Uso:
 *   import { angryBiometric } from './angry-integration.js';
 *   const result = await angryBiometric.login({ nonce: '...' });
 *
 * Ou via script tag:
 *   <script src="angry-integration.js"></script>
 *   window.ARBiometric.login({ nonce: '...' }).then(console.log);
 */

"use strict";

(function (global) {
  // ───────────────────────────────────────────────────────────────────────────
  // Constantes
  // ───────────────────────────────────────────────────────────────────────────

  const REQUEST_EVENT  = "AR_BRIDGE:REQUEST";
  const RESPONSE_EVENT = "AR_BRIDGE:RESPONSE";
  const TIMEOUT_MS     = 120_000; // 2 min timeout for full flows

  // ───────────────────────────────────────────────────────────────────────────
  // API pública exposta
  // ───────────────────────────────────────────────────────────────────────────

  const angryBiometric = {
    /**
     * Login AGR via biometria + senha do token.
     * @param {object} params
     * @param {string} params.nonce  — nonce anti-replay fornecido pelo backend
     * @returns {Promise<object>}   — { ok, token, session, ... }
     */
    login(params = {}) {
      return sendCommand("AGR_LOGIN", {
        nonce: params.nonce,
        issuedAt: Date.now(),
      });
    },

    /**
     * Aprovação de pedido de certificado.
     * @param {object} params
     * @param {string} params.protocolId    — ID do protocolo
     * @param {string} params.sessionToken  — token da sessão AGR atual
     * @returns {Promise<object>}
     */
    approveOrder(params = {}) {
      if (!params.protocolId) {
        return Promise.reject(new Error("protocolId é obrigatório"));
      }
      return sendCommand("AGR_APPROVE_ORDER", {
        protocolId: params.protocolId,
        sessionToken: params.sessionToken,
        nonce: params.nonce,
        issuedAt: Date.now(),
      });
    },

    /**
     * Revogação de certificado A3.
     * @param {object} params
     * @param {string} params.protocolId    — ID do protocolo
     * @param {string} [params.reason]      — motivo da revogação
     * @param {string} params.sessionToken  — token da sessão AGR atual
     * @returns {Promise<object>}
     */
    revokeCert(params = {}) {
      if (!params.protocolId) {
        return Promise.reject(new Error("protocolId é obrigatório"));
      }
      return sendCommand("AGR_REVOKE_CERT", {
        protocolId: params.protocolId,
        reason: params.reason || "Revogado pelo AGR",
        sessionToken: params.sessionToken,
        nonce: params.nonce,
        issuedAt: Date.now(),
      });
    },

    /**
     * Captura biométrica simples (5 dedos + face).
     * @returns {Promise<object>}
     */
    captureBiometrics() {
      return sendCommand("CAPTURE_FINGERPRINT", { issuedAt: Date.now() });
    },

    /**
     * Aborta a operação atual.
     */
    abort() {
      dispatchRequest("ABORT", {});
    },

    /**
     * Verifica se a extensão está disponível.
     * @returns {Promise<boolean>}
     */
    async isAvailable() {
      try {
        const result = await sendCommand("START_SESSION", {});
        return result && result.ok === true;
      } catch {
        return false;
      }
    },
  };

  // ───────────────────────────────────────────────────────────────────────────
  // Core: enviar comando e aguardar resposta
  // ───────────────────────────────────────────────────────────────────────────

  let requestIdCounter = 0;
  const pendingRequests = new Map();

  /**
   * Dispara um comando para a extensão via CustomEvent e aguarda resposta.
   * @param {string} action
   * @param {object} data
   * @returns {Promise<object>}
   */
  function sendCommand(action, data = {}) {
    return new Promise((resolve, reject) => {
      const requestId = `ar_${Date.now()}_${++requestIdCounter}`;

      const timeoutId = setTimeout(() => {
        pendingRequests.delete(requestId);
        reject(new Error(`Timeout: extensão não respondeu em ${TIMEOUT_MS / 1000}s`));
      }, TIMEOUT_MS);

      pendingRequests.set(requestId, { resolve, reject, timeoutId });

      // Registrar listener de resposta (one-shot)
      const handler = (event) => {
        const detail = event?.detail;
        if (!detail || detail.requestId !== requestId) return;

        clearTimeout(timeoutId);
        pendingRequests.delete(requestId);
        document.removeEventListener(RESPONSE_EVENT, handler);

        if (detail.ok) {
          resolve(detail);
        } else {
          reject(new Error(detail.error || "ERRO_DESCONHECIDO"));
        }
      };

      document.addEventListener(RESPONSE_EVENT, handler);

      // Disparar comando
      dispatchRequest(action, data, requestId);
    });
  }

  function dispatchRequest(action, data, requestId) {
    const detail = {
      action,
      data: data || {},
      requestId: requestId || `ar_${Date.now()}_${++requestIdCounter}`,
    };

    document.dispatchEvent(new CustomEvent(REQUEST_EVENT, {
      detail,
      bubbles: false,
      cancelable: false,
    }));
  }

  // ───────────────────────────────────────────────────────────────────────────
  // Hash de senha AGR (SHA-256) — feito no contexto da página
  // ───────────────────────────────────────────────────────────────────────────

  /**
   * Calcula SHA-256 de uma string (para hashear a senha do token AGR
   * antes de enviá-la para a extensão).
   * @param {string} password  — senha do token A3
   * @returns {Promise<string>}  — hash hex (64 caracteres)
   */
  angryBiometric.hashPassword = async function hashPassword(password) {
    if (!password || password.length < 4) {
      throw new Error("Senha do token AGR inválida");
    }
    const encoded = new TextEncoder().encode(password);
    const hashBuffer = await crypto.subtle.digest("SHA-256", encoded);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, "0")).join("");
  };

  // ───────────────────────────────────────────────────────────────────────────
  // Exposição global
  // ───────────────────────────────────────────────────────────────────────────

  global.ARBiometric = angryBiometric;
  if (typeof module !== "undefined" && module.exports) {
    module.exports = { angryBiometric };
  }

})(typeof window !== "undefined" ? window : globalThis);
