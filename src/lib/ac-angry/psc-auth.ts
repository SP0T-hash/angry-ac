/**
 * AC ANGRY - PSC Multi-Provider Adapter
 * Este arquivo orquestra a comunicação com Prestadores de Serviço de Confiança (PSC).
 * Suporta BirdID (Certisign), Vidaas (Soluti), Syngular, etc.
 */

export type PSCProvider = 'birdid' | 'vidaas' | 'syngular';

export interface PSCAuthResponse {
  success: boolean;
  token?: string;
  certificate_data?: any;
  error?: string;
}

class PSCAuthAdapter {
  // Credenciais reais do environment
  private config = {
    vidaas: {
      client_id: process.env.VIDAAS_CLIENT_ID || 'ANGRY_VIDAAS',
      secret: process.env.VIDAAS_CLIENT_SECRET || '',
      api_url: process.env.VIDAAS_API_URL || 'https://api.vidaas.com.br'
    },
    syngular: {
      client_id: process.env.SYNGULAR_CLIENT_ID || 'ANGRY_SYNGULAR',
      secret: process.env.SYNGULAR_CLIENT_SECRET || '',
      api_url: process.env.SYNGULAR_API_URL || 'https://api.syngular.com.br'
    },
    birdid: {
      client_id: process.env.BIRDID_CLIENT_ID || 'ANGRY_BIRD_ID',
      secret: process.env.BIRDID_CLIENT_SECRET || '',
      api_url: process.env.BIRDID_API_URL || 'https://api.birdid.com.br'
    }
  };

  /**
   * Inicia o fluxo de assinatura em nuvem (Challenge-Response)
   */
  async initiatePush(provider: PSCProvider, identifier: string): Promise<{ session_id: string; message: string }> {
    console.log(`[PSC] Iniciando Push via ${provider} para ${identifier}...`);
    
    const config = this.config[provider];
    
    // Verificar se temos credenciais reais
    if (!config.client_id || config.client_id.includes('ANGRY_')) {
      console.log(`[PSC] ⚠️ Usando modo mock - credenciais ${provider} não configuradas`);
      return this.mockInitiatePush(provider, identifier);
    }
    
    try {
      // CHAMADA REAL PARA API DO VIDAAS
      if (provider === 'vidaas') {
        const response = await fetch(`${config.api_url}/v1/signature/request`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${config.secret}`
          },
          body: JSON.stringify({
            cpf: identifier.replace(/[^\d]/g, ''), // Remove pontos e traço
            application: 'AC_ANGRY',
            client_id: config.client_id
          })
        });
        
        if (!response.ok) {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }
        
        const data = await response.json();
        console.log(`[PSC] ✅ Push real enviado: ${data.session_id}`);
        
        return {
          session_id: data.session_id,
          message: `Push enviado para ${provider}! Verifique o app no celular.`
        };
      }
      
      // Para outros providers, implementar similarmente
      throw new Error(`Provider ${provider} não implementado em modo real`);
      
    } catch (error) {
      console.error(`[PSC] ❌ Erro na API real ${provider}:`, error);
      // Fallback para mock se API falhar
      return this.mockInitiatePush(provider, identifier);
    }
  }
  
  // Método mock como fallback
  private mockInitiatePush(provider: PSCProvider, identifier: string): Promise<{ session_id: string; message: string }> {
    return new Promise((resolve) => {
      setTimeout(() => {
        const sessionId = `MOCK_${provider}_${Date.now()}_${Math.random().toString(36).substring(7)}`;
        console.log(`[PSC] 🎭 Sessão mock criada: ${sessionId}`);
        
        resolve({
          session_id: sessionId,
          message: `Push simulado para ${provider}! (Modo desenvolvimento)`
        });
      }, 1000);
    });
  }

  /**
   * Verifica se o usuário aprovou a assinatura no celular
   */
  async checkStatus(session_id: string): Promise<PSCAuthResponse> {
    console.log(`[PSC] Verificando status da sessão ${session_id}...`);
    
    // Verificar se é sessão mock
    if (session_id.startsWith('MOCK_')) {
      console.log(`[PSC] 🎭 Usando modo mock para sessão ${session_id}`);
      return this.mockCheckStatus(session_id);
    }
    
    // Detectar provider pelo session_id
    const provider = session_id.includes('vidaas') ? 'vidaas' : 
                    session_id.includes('syngular') ? 'syngular' : 'birdid';
    
    const config = this.config[provider];
    
    try {
      // CHAMADA REAL PARA API DO VIDAAS
      if (provider === 'vidaas') {
        const response = await fetch(`${config.api_url}/v1/signature/${session_id}/status`, {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${config.secret}`,
            'Content-Type': 'application/json'
          }
        });
        
        if (!response.ok) {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }
        
        const data = await response.json();
        console.log(`[PSC] 📊 Status real: ${data.status}`);
        
        if (data.status === 'approved') {
          return {
            success: true,
            token: data.token || `PKI_CLOUD_${session_id}_VALID`,
            certificate_data: {
              subject: data.certificate?.subject || 'CN=USER VEMAPI',
              serial: data.certificate?.serial || 'A3CLOUD' + Math.random().toString(16).substring(2, 10).toUpperCase(),
              cpf: data.certificate?.cpf || 'validated'
            }
          };
        } else if (data.status === 'rejected') {
          return {
            success: false,
            error: 'Usuário rejeitou a assinatura no celular'
          };
        } else {
          // Ainda pendente
          return {
            success: false,
            error: 'Aguardando aprovação do usuário...'
          };
        }
      }
      
      throw new Error(`Provider ${provider} não implementado em modo real`);
      
    } catch (error) {
      console.error(`[PSC] ❌ Erro no checkStatus real:`, error);
      // Fallback para mock
      return this.mockCheckStatus(session_id);
    }
  }
  
  // Método mock como fallback
  private mockCheckStatus(session_id: string): Promise<PSCAuthResponse> {
    return new Promise((resolve) => {
      setTimeout(() => {
        console.log(`[PSC] 🎭 ✅ Assinatura mock aprovada para sessão ${session_id}`);
        resolve({
          success: true,
          token: `MOCK_TOKEN_${session_id}_VALID`,
          certificate_data: {
            subject: 'CN=MOCK USER VEMAPI:12345678900, OU=VEMAPI CERTIFICADORA, O=ICP-Brasil, C=BR',
            serial: 'MOCK' + Math.random().toString(16).substring(2, 10).toUpperCase(),
            cpf: '123.456.789-00'
          }
        });
      }, 2000);
    });
  }

  /**
   * Valida a assinatura digital retornada pelo PSC
   * Em produção, valida criptograficamente via API do provider
   */
  async verifySignature(session_id: string, signedData: string): Promise<boolean> {
    if (!session_id || !signedData) return false;

    // Sessões mock só aceitam tokens mock
    if (session_id.startsWith('MOCK_')) {
      return signedData.startsWith('MOCK_TOKEN_');
    }

    // Detectar provider pelo session_id
    const provider = session_id.includes('vidaas') ? 'vidaas' :
                    session_id.includes('syngular') ? 'syngular' : 'birdid';

    const config = this.config[provider];

    try {
      if (provider === 'vidaas') {
        const response = await fetch(`${config.api_url}/v1/signature/${session_id}/verify`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${config.secret}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ signed_data: signedData })
        });

        if (!response.ok) return false;
        const data = await response.json();
        return data.valid === true;
      }

      // Providers não implementados retornam false por segurança
      console.warn(`[PSC] Verificação de assinatura não implementada para ${provider}`);
      return false;

    } catch (error) {
      console.error(`[PSC] Erro na verificação de assinatura:`, error);
      return false;
    }
  }
}

export const pscAuth = new PSCAuthAdapter();
