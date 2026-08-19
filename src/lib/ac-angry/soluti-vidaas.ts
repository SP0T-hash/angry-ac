/**
 * AC ANGRY - Soluti Vidaas Adapter (Produção)
 * Implementação do rito OAuth2 para autenticação via Certificado em Nuvem.
 */

export interface SolutiVidaasConfig {
  clientId: string;
  clientSecret: string;
  redirectUri: string;
  authUrl: string;
  tokenUrl: string;
}

export interface SolutiVidaasTokenResponse {
  access_token?: string;
  token_type?: string;
  expires_in?: number;
  [key: string]: unknown;
}

export interface SolutiVidaasPushResponse {
  success: boolean;
  request_id?: string;
  error?: string;
}

class SolutiVidaasAdapter {
  /**
   * Redireciona para o portal da Soluti para autorização do usuário
   */
  getAuthorizationUrl(config: SolutiVidaasConfig, state: string): string {
    const params = new URLSearchParams({
      response_type: 'code',
      client_id: config.clientId,
      redirect_uri: config.redirectUri,
      scope: 'signature', // Escopo necessário para assinar o desafio
      state: state,
    });
    return `${config.authUrl}?${params.toString()}`;
  }

  /**
   * Troca o 'code' retornado pelo 'access_token'
   */
  async exchangeCodeForToken(config: SolutiVidaasConfig, code: string): Promise<SolutiVidaasTokenResponse> {
    console.log('[SOLUTI] Trocando CODE por ACCESS_TOKEN...');
    
    // Chamada real de backend (Server-side only)
    const response = await fetch(config.tokenUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        grant_type: 'authorization_code',
        code: code,
        client_id: config.clientId,
        client_secret: config.clientSecret,
        redirect_uri: config.redirectUri,
      }),
    });

    return response.json();
  }

  /**
   * Solicita a assinatura de um desafio (Hash) via Push
   */
  async requestPushSignature(accessToken: string, hashToSign: string): Promise<SolutiVidaasPushResponse> {
    // INTEGRAÇÃO NÃO IMPLEMENTADA — fail-safe por design.
    // Não simula aprovação nem resposta de API de PSC. O fluxo de assinatura em
    // nuvem (Soluti Vidaas) depende de credencial, contrato e homologação formal.
    // TODO(PENDING_PROVIDER): implementar a chamada real ao endpoint de push
    // quando a AC/DPC e o provedor estiverem formalmente contratados.
    console.warn('[SOLUTI] requestPushSignature não implementado — PENDING_PROVIDER', {
      hasAccessToken: Boolean(accessToken),
      hashLength: hashToSign?.length ?? 0,
    });
    throw new Error(
      'Integração Soluti Vidaas (requestPushSignature) não implementada. ' +
        'Status: PENDING_PROVIDER / PENDING_HOMOLOGATION. ' +
        `Contexto: accessToken=${accessToken ? 'presente' : 'ausente'}, ` +
        `hashToSign=${hashToSign ? 'presente' : 'ausente'}. ` +
        'Nenhuma aprovação ou resposta de API é simulada.',
    );
  }
}

export const solutiVidaas = new SolutiVidaasAdapter();
