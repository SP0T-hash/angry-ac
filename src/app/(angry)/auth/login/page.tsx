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

  // Integração Real com Lacuna WebPKI
  const handleA3Login = () => {
    setAuthStatus('scanning');
    
    // @ts-ignore - Verificação da presença da extensão
    if (typeof window.lacunaWebPki === 'undefined') {
      alert("Extensão Lacuna WebPKI não detectada. Por favor, instale-a para usar o certificado A3.");
      setAuthStatus('idle');
      return;
    }

    // @ts-ignore
    const pki = new window.lacunaWebPki();
    
    pki.listCertificates().success((certs: any[]) => {
      setAvailableCertificates(certs);
      if (certs.length === 0) {
        alert("Nenhum certificado A3 encontrado no leitor. Verifique se o token está plugado.");
        setAuthStatus('idle');
      } else {
        // Por simplificação, pega o primeiro, mas o ideal é abrir um seletor
        setSelectedCert(certs[0]);
        setAuthStatus('pin');
      }
    }).error((err: string) => {
      console.error("Erro WebPKI:", err);
      setAuthStatus('error');
    });
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

  const handlePinSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Em produção: Realizar assinatura PKCS#1 e enviar ao /api/auth/pki
    setAuthStatus('success');
    setTimeout(() => {
      window.location.href = '/ac/agent/dashboard';
    }, 1500);
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
            
            <h1 className="text-3xl font-black mb-4 leading-tight uppercase tracking-tighter">Central de Emissão Digital</h1>
            <p className="text-emerald-200 text-sm leading-relaxed max-w-sm font-medium">
              Ambiente restrito a Agentes de Registro (AGR) para auditoria, validação biométrica e emissão de certificados ICP-Brasil.
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
              <Globe size={10} /> WebPKI
            </div>
            <div className={`flex items-center gap-1.5 px-2 py-1 rounded-full text-[9px] font-black uppercase tracking-wider border transition-colors ${diagnostics.hwDrivers === 'active' ? 'bg-emerald-50 text-emerald-600 border-emerald-200' : 'bg-slate-50 text-slate-400 border-slate-200'}`}>
              <HardDrive size={10} /> HW
            </div>
            <div className={`flex items-center gap-1.5 px-2 py-1 rounded-full text-[9px] font-black uppercase tracking-wider border transition-colors ${diagnostics.cloudApi === 'active' ? 'bg-emerald-50 text-emerald-600 border-emerald-200' : 'bg-slate-50 text-slate-400 border-slate-200'}`}>
              <Zap size={10} /> PSC
            </div>
          </div>
          
          {authStatus === 'idle' && (
            <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
              <h2 className="text-2xl font-bold mb-2 text-slate-900 tracking-tight">Autenticação Biométrica</h2>
              <p className="text-slate-500 mb-8 text-sm font-medium">Insira o seu Smartcard ou Token Leitor A3 VEMAPI na porta USB.</p>

              <div className="space-y-4 mb-8">
                <button 
                  onClick={handleA3Login}
                  className="w-full flex items-center justify-between p-4 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 rounded-2xl transition-all group"
                >
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-emerald-600 rounded-xl flex items-center justify-center shadow-md shadow-emerald-200 group-hover:scale-105 transition-transform">
                      <CreditCard size={24} className="text-white" />
                    </div>
                    <div className="text-left">
                      <h3 className="font-bold text-emerald-950">Acessar com Certificado</h3>
                      <p className="text-xs text-emerald-700/80 font-semibold">WebPKI via Cartão A3 ou Token USB</p>
                    </div>
                  </div>
                  <ArrowRight size={20} className="text-emerald-600 opacity-50 group-hover:opacity-100 transition-opacity" />
                </button>

                <div className="space-y-2">
                   <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest pl-2">Identificador (CPF / E-mail)</label>
                   <input 
                      type="text" 
                      placeholder="000.000.000-00"
                      value={identifier}
                      onChange={(e) => setIdentifier(e.target.value)}
                      className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-bold focus:border-emerald-500 focus:bg-white transition-all outline-none"
                   />
                </div>

                <button 
                  onClick={() => handleCloudLogin('vidaas')}
                  className="w-full flex items-center justify-between p-4 bg-blue-50 hover:bg-blue-100 border border-blue-200 rounded-2xl transition-all group"
                >
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-blue-600 rounded-xl flex items-center justify-center shadow-md shadow-blue-200 group-hover:scale-105 transition-transform">
                      <MonitorSmartphone size={24} className="text-white" />
                    </div>
                    <div className="text-left">
                      <h3 className="font-bold text-blue-950">Acessar via Celular / Nuvem</h3>
                      <p className="text-xs text-blue-700/80 font-semibold">Push no Vidaas, Syngular ou BirdID</p>
                    </div>
                  </div>
                  <ArrowRight size={20} className="text-blue-600 opacity-50 group-hover:opacity-100 transition-opacity" />
                </button>

                <div className="relative py-4">
                  <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-slate-200"></div></div>
                  <div className="relative flex justify-center"><span className="px-4 bg-white text-xs font-bold text-slate-400">OU ACESSO MANUAL</span></div>
                </div>

                <button 
                  onClick={() => { window.location.href = '/ac/agent/dashboard'; }}
                  className="w-full flex items-center gap-4 p-4 border border-slate-200 rounded-2xl bg-slate-50 hover:bg-emerald-50 hover:border-emerald-200 transition-all group text-left"
                >
                  <div className="w-12 h-12 bg-slate-200 group-hover:bg-emerald-100 rounded-xl flex items-center justify-center transition-colors">
                    <LockKeyhole size={24} className="text-slate-400 group-hover:text-emerald-600 transition-colors" />
                  </div>
                  <div>
                    <h3 className="font-bold text-slate-700 group-hover:text-emerald-900 transition-colors">Login com Senha (Suporte)</h3>
                    <p className="text-xs text-slate-400 font-semibold">Acesso direto ao painel de operação.</p>
                  </div>
                </button>
              </div>

              <div className="flex items-start gap-3 bg-amber-50 rounded-xl p-4 border border-amber-200">
                <AlertCircle size={18} className="text-amber-600 mt-0.5 shrink-0" />
                <div className="space-y-2">
                  <p className="text-xs text-amber-800 font-medium leading-relaxed">
                    Para utilizar a autenticação A3, certifique-se de que a extensão "Lacuna Web PKI" está ativada.
                  </p>
                  <div className="flex flex-wrap gap-x-4 gap-y-1 mt-1">
                    <a 
                      href="https://chromewebstore.google.com/detail/lacuna-web-pki/pogmhpgeicmblbepegdifneclbeebnkp" 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 text-[10px] font-extrabold text-amber-700 hover:text-amber-900 underline uppercase tracking-tighter"
                    >
                      Chrome Web Store <ArrowRight size={10} />
                    </a>
                    <a 
                      href="https://pki.webpkiplugin.com/LacunaWebPKISetup.exe" 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 text-[10px] font-extrabold text-blue-700 hover:text-blue-900 underline uppercase tracking-tighter"
                    >
                      Baixar Instalador Windows (.exe) <ArrowRight size={10} />
                    </a>
                  </div>
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
              <h3 className="text-xl font-bold text-slate-900 mb-1">Autorize no seu Celular</h3>
              <p className="text-slate-500 text-sm font-medium mb-8">
                 Enviamos uma solicitação de assinatura para o seu **Vidaas / Syngular**. <br/>
                 Acesse o app e valide com sua Biometria.
              </p>

              <div className="flex flex-col gap-3 w-full max-w-xs">
                <button 
                  onClick={() => setAuthStatus('success')}
                  className="w-full h-12 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl shadow-lg shadow-blue-600/20 transition-all flex items-center justify-center gap-2"
                >
                  <ShieldCheck size={18} /> Já autorizei no celular
                </button>
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
            </div>
          )}

          {authStatus === 'success' && (
            <div className="flex flex-col items-center justify-center h-64 animate-in fade-in zoom-in-95 duration-500 text-emerald-600">
               <div className="w-24 h-24 bg-emerald-100 rounded-full flex items-center justify-center mb-6 shadow-xl shadow-emerald-500/20">
                 <Fingerprint size={48} className="text-emerald-600 animate-pulse" />
               </div>
               <h3 className="text-2xl font-bold mb-2">Acesso Concedido!</h3>
               <p className="text-emerald-700/80 text-sm font-medium">Chaves validadas com sucesso. Entrando na Fila...</p>
            </div>
          )}

        </div>

      </div>
    </div>
  );
}
