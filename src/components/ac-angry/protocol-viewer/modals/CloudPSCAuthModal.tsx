import React, { useState } from 'react';
import { X, UploadCloud, Fingerprint, Check, ArrowLeft } from 'lucide-react';

export const CloudPSCAuthModal = ({ isOpen, onClose, onConfirm }: any) => {
  const [status, setStatus] = useState<'idle' | 'sending' | 'waiting' | 'signed' | 'error'>('idle');

  if (!isOpen) return null;

  const handleStartPush = async () => {
    setStatus('sending');
    setTimeout(() => setStatus('waiting'), 1500);
    setTimeout(() => setStatus('signed'), 5000);
    setTimeout(() => onConfirm(), 6500);
  };

  return (
    <div className="fixed inset-0 z-[120] flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-md animate-in fade-in duration-300">
      <div className="bg-white rounded-[2rem] shadow-2xl w-full max-w-sm overflow-hidden animate-in zoom-in-95 duration-300 border border-emerald-100">
        <div className="bg-emerald-600 px-8 py-8 text-white text-center">
          <button onClick={onClose} className="absolute right-6 top-6 text-white/50 hover:text-white">
            <X size={20} />
          </button>
          <div className="w-16 h-16 bg-white/20 rounded-2xl flex items-center justify-center mx-auto mb-4 backdrop-blur-md">
            <UploadCloud size={32} />
          </div>
          <h3 className="text-xl font-black uppercase tracking-tight">Assinatura A3 Nuvem</h3>
          <p className="text-emerald-100 text-[10px] font-black mt-1 uppercase tracking-widest opacity-80">Rito PSC (Vidaas / BirdID)</p>
        </div>

        <div className="p-8 text-center space-y-6">
          {status === 'idle' && (
            <>
              <p className="text-sm font-bold text-slate-600 leading-relaxed">
                Você receberá uma solicitação de assinatura no seu smartphone vinculado.
              </p>
              <button 
                onClick={handleStartPush}
                className="w-full bg-slate-900 hover:bg-emerald-600 text-white font-black py-4 rounded-2xl shadow-xl transition-all uppercase tracking-widest text-xs flex items-center justify-center gap-2"
              >
                Solicitar Push no Celular <ArrowLeft className="rotate-180" size={14} />
              </button>
            </>
          )}

          {status === 'sending' && (
            <div className="py-8 flex flex-col items-center">
               <div className="w-12 h-12 border-4 border-emerald-100 border-t-emerald-600 rounded-full animate-spin mb-4" />
               <p className="text-xs font-black text-slate-400 uppercase">Conectando ao PSC...</p>
            </div>
          )}

          {status === 'waiting' && (
            <div className="py-8 flex flex-col items-center animate-pulse">
               <div className="w-16 h-16 bg-amber-50 rounded-full flex items-center justify-center mb-4 text-amber-500">
                  <Fingerprint size={40} />
               </div>
               <p className="text-sm font-bold text-slate-900">Aguardando no Smartphone...</p>
               <p className="text-[10px] font-black text-slate-400 mt-2">AUTORIZE COM SUA BIOMETRIA</p>
            </div>
          )}

          {status === 'signed' && (
            <div className="py-8 flex flex-col items-center">
               <div className="w-16 h-16 bg-emerald-500 rounded-full flex items-center justify-center mb-4 text-white shadow-lg shadow-emerald-100">
                  <Check size={32} />
               </div>
               <p className="text-sm font-bold text-emerald-600">Dossier Assinado com Sucesso</p>
               <p className="text-[10px] font-black text-slate-400 mt-2 uppercase">CHAVE CRIPTOGRÁFICA GERADA</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
