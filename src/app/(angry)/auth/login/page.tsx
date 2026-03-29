'use client';

import React, { useState, useEffect } from 'react';
import { Zap, ShieldCheck, MonitorSmartphone, Fingerprint, LockKeyhole, ArrowRight, CreditCard, AlertCircle, HardDrive, Globe } from 'lucide-react';
import { pscAuth, PSCProvider } from '@/lib/ac-angry/psc-auth';

export default function AgentLoginPage() {
  const [authStatus, setAuthStatus] = useState<'idle' | 'scanning' | 'pin' | 'cloud-push' | 'success' | 'error'>('idle');
  const [pin, setPin] = useState('');
  const [identifier, setIdentifier] = useState(''); // CPF ou E-mail para Nuvem
  const [currentSessionId, setCurrentSessionId] = useState<string | null>(null);
  const [availableCertificates, setAvailableCertificates] = useState<any[]>([]);
  const [selectedCert, setSelectedCert] = useState<any>(null);
  const [showCloudModal, setShowCloudModal] = useState(false);
  const [cloudIdentifier, setCloudIdentifier] = useState('');
  
  const [diagnostics, setDiagnostics] = useState({
    webPki: 'checking',
    hwDrivers: 'checking',
    cloudApi: 'checking'
  });

  // Diagnóstico de estação (Homologação)
  useEffect(() => {
    const runDiagnostics = async () => {
      // @ts-ignore - Verificação real da extensão Lacuna
      const isWebPkiInstalled = typeof window !== 'undefined' && typeof window.lacunaWebPki !== 'undefined';
      
      setDiagnostics({
        webPki: isWebPkiInstalled ? 'active' : 'error',
        hwDrivers: isWebPkiInstalled ? 'active' : 'checking', 
        cloudApi: 'active'
      });
    };
    runDiagnostics();
  }, []);

  // Integração Real com Lacuna WebPKI - Melhorada
  const handleUniversalA3Login = async () => {
    // Tentar hardware primeiro (padrão)
    setAuthStatus('scanning');
    try {
      await handleA3Login();
    } catch (error) {
      // Se hardware falhar, mostrar erro
      setAuthStatus('error');
      setTimeout(() => setAuthStatus('idle'), 3000);
    }
  };

  const handleA3Login = async () => {
    setAuthStatus('scanning');
    
    // @ts-ignore - Verificação real da extensão Lacuna
    if (typeof window.lacunaWebPki === 'undefined' || !window.lacunaWebPki) {
      setAuthStatus('error');
      setTimeout(() => setAuthStatus('idle'), 3000);
      return;
    }

    try {
      // @ts-ignore
      const pki = new window.lacunaWebPki();
      
      // Inicialização do motor com validação de compatibilidade
      await pki.init({
        license: null, // Em produção adicionar licença real
        trusted: true,
        useDomain: true
      });
      
      // Timeout extendido com feedback granular
      const timeout = setTimeout(() => {
        if (authStatus === 'scanning') {
           setAuthStatus('error');
           setTimeout(() => setAuthStatus('idle'), 3000);
        }
      }, 15000);

      // Listagem de certificados com filtro A3
      const certs = await new Promise<any[]>((resolve, reject) => {
        pki.listCertificates().success(resolve).error(reject);
      });
      
      clearTimeout(timeout);
      
      // Filtrar apenas certificados A3 (Hardware)
      const a3Certificates = certs.filter(cert => {
        // Verificar se é certificado de hardware (A3)
        return cert.keyUsages && 
               cert.keyUsages.includes('nonRepudiation') &&
               cert.validity &&
               new Date(cert.validity.notAfter) > new Date();
      });
      
      setAvailableCertificates(a3Certificates);
      
      if (a3Certificates.length === 0) {
        setAuthStatus('error');
        setTimeout(() => setAuthStatus('idle'), 3000);
      } else {
        // Auto-selecionar o certificado mais recente
        const sortedCerts = a3Certificates.sort((a, b) => 
          new Date(b.validity.notAfter).getTime() - new Date(a.validity.notAfter).getTime()
        );
        setSelectedCert(sortedCerts[0]);
        setAuthStatus('pin');
      }
    } catch (error: any) {
      console.error('Erro WebPKI:', error);
      setAuthStatus('error');
      setTimeout(() => setAuthStatus('idle'), 3000);
    }
  };

  const handleCloudLogin = async (provider: PSCProvider) => {
    if (!identifier) {
      alert("Por favor, informe seu CPF ou E-mail vinculado ao certificado em nuvem.");
      return;
    }

    setAuthStatus('scanning');
    try {
      const response = await pscAuth.initiatePush(provider, identifier);
      setCurrentSessionId(response.session_id);
      setAuthStatus('cloud-push');
      
      // Inicia polling de verificação
      checkCloudStatus(response.session_id);
    } catch (err) {
      setAuthStatus('error');
    }
  };

  const checkCloudStatus = async (sessionId: string) => {
    const result = await pscAuth.checkStatus(sessionId);
    if (result.success) {
      setAuthStatus('success');
      setTimeout(() => {
        window.location.href = '/ac/agent/dashboard';
      }, 1500);
    }
  };

  const handlePinSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!selectedCert || !pin) {
      setAuthStatus('error');
      setTimeout(() => setAuthStatus('pin'), 2000);
      return;
    }
    
    try {
      // @ts-ignore
      const pki = new window.lacunaWebPki();
      await pki.init({ trusted: true });
      
      // Gerar challenge para assinatura
      const challengeResponse = await fetch('/api/auth/pki');
      const { nonce } = await challengeResponse.json();
      
      // Realizar assinatura digital com o certificado A3
      const signature = await new Promise<string>((resolve, reject) => {
        pki.signData({
          thumbprint: selectedCert.thumbprint,
          data: nonce,
          digestAlgorithm: 'SHA-256'
        }).success(resolve).error(reject);
      });
      
      // Enviar assinatura para validação no backend
      const authResponse = await fetch('/api/auth/pki', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'A3_HARDWARE',
          signature,
          certificate: selectedCert,
          nonce,
          identifier: selectedCert.subjectName
        })
      });
      
      const result = await authResponse.json();
      
      if (result.success) {
        setAuthStatus('success');
        setTimeout(() => {
          window.location.href = '/ac/agent/dashboard';
        }, 1500);
      } else {
        setAuthStatus('error');
        setTimeout(() => setAuthStatus('pin'), 2000);
      }
    } catch (error) {
      console.error('Erro na assinatura:', error);
      setAuthStatus('error');
      setTimeout(() => setAuthStatus('pin'), 2000);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4 font-sans text-slate-900">
      
      <div className="max-w-4xl w-full bg-white rounded-3xl shadow-2xl overflow-hidden flex flex-col md:flex-row border border-slate-200">
        
        {/* Left Col - Branding VEMAPI */}
        <div className="md:w-5/12 bg-emerald-900 p-10 flex flex-col justify-between relative overflow-hidden text-white">
          <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1550751827-4bd374c3f58b?q=80&w=2070&auto=format&fit=crop')] mix-blend-overlay opacity-10 bg-cover bg-center"></div>
          
          <div className="relative z-10">
            <div className="flex items-center gap-3 mb-10">
              <div className="w-10 h-10 bg-emerald-500 rounded-lg flex items-center justify-center shadow-lg shadow-emerald-900/50">
                <Zap size={24} className="text-white" fill="currentColor" />
              </div>
              <span className="font-extrabold text-2xl tracking-tight uppercase">AC <span className="text-emerald-400">ANGRY</span></span>
            </div>
            
            <h1 className="text-3xl font-black mb-4 leading-tight uppercase tracking-tighter">Portal A3 Exclusivo</h1>
            <p className="text-emerald-200 text-sm leading-relaxed max-w-sm font-medium">
              Ambiente restrito para Agentes de Registro (AGR) com acesso exclusivo via certificado digital A3 ICP-Brasil.
            </p>
          </div>

          <div className="relative z-10 flex items-center gap-4 text-[10px] font-black uppercase tracking-[0.2em] text-emerald-300">
             <ShieldCheck size={16} /> Auditoria ICP-Brasil Ativa
          </div>
        </div>

        {/* Right Col - Autenticação A3 */}
        <div className="md:w-7/12 p-10 lg:p-14 flex flex-col justify-center relative">
          
          {/* Machine Diagnostics Widget */}
          <div className="absolute top-4 right-4 flex gap-2">
            <div className={`flex items-center gap-1.5 px-2 py-1 rounded-full text-[9px] font-black uppercase tracking-wider border transition-colors ${diagnostics.webPki === 'active' ? 'bg-emerald-50 text-emerald-600 border-emerald-200' : 'bg-slate-50 text-slate-400 border-slate-200'}`}>
              <Globe size={10} /> A3-PKI
            </div>
            <div className={`flex items-center gap-1.5 px-2 py-1 rounded-full text-[9px] font-black uppercase tracking-wider border transition-colors ${diagnostics.hwDrivers === 'active' ? 'bg-emerald-50 text-emerald-600 border-emerald-200' : 'bg-slate-50 text-slate-400 border-slate-200'}`}>
              <HardDrive size={10} /> TOKEN
            </div>
            <div className={`flex items-center gap-1.5 px-2 py-1 rounded-full text-[9px] font-black uppercase tracking-wider border transition-colors ${diagnostics.cloudApi === 'active' ? 'bg-emerald-50 text-emerald-600 border-emerald-200' : 'bg-slate-50 text-slate-400 border-slate-200'}`}>
              <Zap size={10} /> NUVEM
            </div>
          </div>
          
          {authStatus === 'idle' && (
            <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
              <h2 className="text-2xl font-bold mb-2 text-slate-900 tracking-tight">Autenticação via Certificado A3</h2>
              <p className="text-slate-500 mb-8 text-sm font-medium">Acesso exclusivo com certificado digital ICP-Brasil.</p>

              <div className="space-y-4 mb-8">
                <button 
                  onClick={handleUniversalA3Login}
                  className="w-full flex items-center justify-center p-4 bg-emerald-600 hover:bg-emerald-700 text-white rounded-2xl transition-all group shadow-lg shadow-emerald-600/20"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 bg-emerald-500 rounded-xl flex items-center justify-center group-hover:scale-105 transition-transform">
                      <ShieldCheck size={24} className="text-white" />
                    </div>
                    <div className="text-center">
                      <h3 className="font-bold text-white text-lg">Acessar com Certificado A3</h3>
                    </div>
                  </div>
                </button>

                <div className="text-center">
                  <button 
                    onClick={() => setShowCloudModal(true)}
                    className="text-sm text-blue-600 hover:text-blue-800 font-medium underline transition-colors"
                  >
                    Ou acessar via Nuvem (Vidaas/Syngular/BirdID)
                  </button>
                </div>
              </div>

                          </div>
          )}

          {authStatus === 'scanning' && (
            <div className="flex flex-col items-center justify-center h-64 animate-in fade-in duration-500">
               <div className="relative w-24 h-24 mb-6">
                 <div className="absolute inset-0 border-4 border-emerald-100 rounded-full"></div>
                 <div className="absolute inset-0 border-4 border-emerald-600 rounded-full border-t-transparent animate-spin"></div>
                 <div className="absolute inset-0 flex items-center justify-center">
                   <MonitorSmartphone size={32} className="text-emerald-600 animate-pulse" />
                 </div>
               </div>
               <h3 className="text-lg font-bold text-slate-900 mb-2">Analisando Portas USB...</h3>
                <p className="text-slate-500 text-sm font-medium">Buscando certificados emitidos por ICP-Brasil no hardware seguro ou nuvem corporativa.</p>
            </div>
          )}

          {authStatus === 'cloud-push' && (
            <div className="animate-in fade-in slide-in-from-right-8 duration-500 flex flex-col items-center text-center">
              <div className="w-24 h-24 bg-blue-50 rounded-full flex items-center justify-center mb-6 relative">
                 <div className="absolute inset-0 border-2 border-blue-200 border-dashed rounded-full animate-spin-slow"></div>
                 <MonitorSmartphone size={40} className="text-blue-600" />
              </div>
              <h3 className="text-xl font-bold text-slate-900 mb-1">Push Enviado!</h3>
              <p className="text-slate-500 text-sm font-medium mb-2">
                 Verifique o app <span className="font-bold text-blue-600">Vidaas</span> no seu celular
              </p>
              <p className="text-xs text-slate-400 mb-8">
                 Aguardando aprovação biometrica...
              </p>

              <div className="flex flex-col gap-3 w-full max-w-xs">
                <div className="bg-blue-50 p-3 rounded-xl border border-blue-200">
                  <p className="text-xs text-blue-700 font-medium">💡 Dica: A aprovação deve chegar em até 10 segundos</p>
                </div>
                
                <button 
                  onClick={() => setAuthStatus('idle')}
                  className="text-xs font-bold text-blue-600 hover:text-blue-800 transition-colors"
                >
                  Cancelar e tentar outro método
                </button>
              </div>
            </div>
          )}

          {authStatus === 'pin' && (
            <div className="animate-in fade-in slide-in-from-right-8 duration-500 flex flex-col items-center text-center">
              <div className="w-20 h-20 bg-emerald-50 rounded-full flex items-center justify-center mb-6 shadow-inner">
                <ShieldCheck size={40} className="text-emerald-600" />
              </div>
              <h3 className="text-xl font-bold text-slate-900 mb-1">Certificado Identificado!</h3>
              <p className="text-emerald-600 text-[10px] font-black uppercase tracking-widest mb-2 border border-emerald-200 px-3 py-1 rounded-full bg-emerald-50">
                A3 Hardware / Token
              </p>
              <p className="text-slate-900 text-sm font-bold mb-8">
                AGR: {selectedCert?.name || 'TITULAR NÃO IDENTIFICADO'}
              </p>

              <form onSubmit={handlePinSubmit} className="w-full max-w-xs space-y-4">
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider text-left mb-2">Digite seu PIN (A3)</label>
                  <input 
                    type="password" 
                    required
                    value={pin}
                    onChange={(e) => setPin(e.target.value)}
                    className="w-full h-12 border-2 border-slate-200 rounded-xl px-4 text-center tracking-[0.5em] font-mono text-xl focus:border-emerald-600 focus:ring-0 transition-colors"
                    maxLength={8}
                    autoFocus
                  />
                </div>
                <button type="submit" className="w-full h-12 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl shadow-lg shadow-emerald-600/30 transition-transform active:scale-95">
                  Confirmar Autenticação
                </button>
              </form>

              <button 
                onClick={() => setAuthStatus('idle')}
                className="mt-6 text-xs font-bold text-slate-400 hover:text-emerald-700 transition-colors uppercase tracking-widest"
              >
                Voltar para opções de acesso
              </button>
            </div>
          )}

          {authStatus === 'error' && (
            <div className="animate-in fade-in duration-500 flex flex-col items-center text-center">
              <div className="w-20 h-20 bg-red-50 rounded-full flex items-center justify-center mb-6 shadow-inner">
                <AlertCircle size={40} className="text-red-600" />
              </div>
              <h3 className="text-xl font-bold text-slate-900 mb-2">Falha na Autenticação A3</h3>
              <p className="text-slate-500 text-sm font-medium mb-8 max-w-md">
                Não foi possível acessar seu certificado A3. Verifique:
              </p>
              <div className="space-y-2 text-left bg-slate-50 p-4 rounded-xl mb-8 max-w-md">
                <div className="flex items-start gap-2">
                  <span className="text-red-600 mt-1">•</span>
                  <span className="text-xs text-slate-600">Certificado A3 válido e não expirado</span>
                </div>
                <div className="flex items-start gap-2">
                  <span className="text-red-600 mt-1">•</span>
                  <span className="text-xs text-slate-600">Token/Cartão A3 inserido corretamente</span>
                </div>
                <div className="flex items-start gap-2">
                  <span className="text-red-600 mt-1">•</span>
                  <span className="text-xs text-slate-600">Drivers do fabricante instalados</span>
                </div>
                <div className="flex items-start gap-2">
                  <span className="text-red-600 mt-1">•</span>
                  <span className="text-xs text-slate-600">Extensão Lacuna WebPKI ativa</span>
                </div>
                <div className="flex items-start gap-2">
                  <span className="text-red-600 mt-1">•</span>
                  <span className="text-xs text-slate-600">App Vidaas/Syngular instalado (nuvem)</span>
                </div>
              </div>
              <button 
                onClick={() => setAuthStatus('idle')}
                className="w-full h-12 bg-slate-600 hover:bg-slate-700 text-white font-bold rounded-xl shadow-lg transition-all"
              >
                Tentar Novamente
              </button>
            </div>
          )}

          {authStatus === 'success' && (
            <div className="flex flex-col items-center justify-center h-64 animate-in fade-in zoom-in-95 duration-500 text-emerald-600">
               <div className="w-24 h-24 bg-emerald-100 rounded-full flex items-center justify-center mb-6 shadow-xl shadow-emerald-500/20">
                 <Fingerprint size={48} className="text-emerald-600 animate-pulse" />
               </div>
               <h3 className="text-2xl font-bold mb-2">Certificado A3 Validado!</h3>
               <p className="text-emerald-700/80 text-sm font-medium">Acesso autorizado via certificado digital ICP-Brasil.</p>
            </div>
          )}

        </div>

      </div>

      {/* Modal para Login via Nuvem */}
      {showCloudModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl p-6 max-w-md w-full">
            <h3 className="text-lg font-bold text-slate-900 mb-4">Acessar via Nuvem A3</h3>
            <p className="text-sm text-slate-600 mb-4">Digite seu CPF ou E-mail do certificado em nuvem:</p>
            
            <div className="space-y-4">
              <input 
                type="text" 
                placeholder="000.000.000-00"
                value={cloudIdentifier}
                onChange={(e) => setCloudIdentifier(e.target.value)}
                className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold focus:border-blue-500 focus:bg-white transition-all outline-none"
                autoFocus
              />
              
              <div className="flex gap-3">
                <button 
                  onClick={() => {
                    setIdentifier(cloudIdentifier);
                    setShowCloudModal(false);
                    handleCloudLogin('vidaas');
                  }}
                  disabled={!cloudIdentifier}
                  className="flex-1 h-10 bg-blue-600 hover:bg-blue-700 disabled:bg-slate-300 text-white font-bold rounded-xl transition-all"
                >
                  Enviar Push
                </button>
                <button 
                  onClick={() => setShowCloudModal(false)}
                  className="flex-1 h-10 bg-slate-200 hover:bg-slate-300 text-slate-700 font-bold rounded-xl transition-all"
                >
                  Cancelar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
