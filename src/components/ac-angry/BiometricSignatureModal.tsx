'use client';

import React, { useState, useEffect } from 'react';
import { Fingerprint, CheckCircle2, ShieldAlert, ShieldCheck, X, Activity, ServerCog } from 'lucide-react';

export default function BiometricSignatureModal({ isOpen, onClose, onApproved, titularName }: any) {
  const [step, setStep] = useState<'idle' | 'scanning' | 'processing' | 'success' | 'fail'>('idle');
  const [quality, setQuality] = useState(0);

  useEffect(() => {
    if (isOpen) {
      setStep('idle');
      setQuality(0);
    }
  }, [isOpen]);

  useEffect(() => {
    // Efeito de oscilação da qualidade da digital quando o dedo está na luz vermelha da leitora
    if (step === 'scanning') {
      const interval = setInterval(() => {
        setQuality(Math.floor(Math.random() * 60) + 40); // 40 a 100
      }, 400);
      return () => clearInterval(interval);
    }
  }, [step]);

  const handleCapture = () => {
    setStep('scanning');
    
    // Simula a invocação do WebSocket local: ws://127.0.0.1:9000 (Leitora Dedilheira Windows)
    setTimeout(() => {
      setStep('processing');
      setQuality(98); // Qualidade travada alta
      setTimeout(() => {
        setStep('success');
      }, 1500);
    }, 3000);
  };

  const handleFinish = () => {
    onApproved();
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/80 backdrop-blur-sm animate-in fade-in">
      <div className="bg-white w-full max-w-md rounded-3xl shadow-2xl border border-slate-200 overflow-hidden">
        
        {/* Header */}
        <div className="bg-indigo-900 px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-indigo-500 flex items-center justify-center">
              <ShieldCheck size={18} className="text-white" />
            </div>
            <h3 className="text-white font-bold tracking-tight">Assinatura Biométrica</h3>
          </div>
          <button onClick={onClose} className="text-indigo-200 hover:text-white transition-colors">
            <X size={20} />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-8 flex flex-col items-center text-center relative overflow-hidden">
          
          {step === 'idle' && (
            <div className="animate-in slide-in-from-bottom-4 flex flex-col items-center">
              <div className="w-24 h-24 bg-slate-100 rounded-full flex items-center justify-center mb-6 border border-slate-200">
                <Fingerprint size={48} className="text-slate-400" />
              </div>
              <h2 className="text-xl font-bold text-slate-800 mb-2">Autorização do Dossiê</h2>
              <p className="text-sm font-medium text-slate-500 mb-8 max-w-[250px]">
                Aprovação do certificado de <strong className="text-slate-700">{titularName}</strong>. Pressione o dedo no leitor óptico.
              </p>
              
              <button 
                onClick={handleCapture}
                className="w-full h-14 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl flex items-center justify-center gap-2 shadow-lg shadow-indigo-600/20 transition-all active:scale-95"
              >
                <ServerCog size={20} /> Acionar Leitora USB
              </button>
            </div>
          )}

          {step === 'scanning' && (
            <div className="animate-in fade-in flex flex-col items-center w-full">
              <div className="relative w-32 h-32 mb-6 flex items-center justify-center">
                {/* Olas de scanning pulsam */}
                <div className="absolute inset-0 bg-red-500/10 rounded-full animate-ping"></div>
                <div className="absolute w-28 h-28 border-4 border-red-500 border-t-transparent border-b-transparent rounded-full animate-spin"></div>
                <Fingerprint size={64} className="text-red-500 z-10 animate-pulse" />
              </div>

              <h2 className="text-lg font-bold text-slate-800 mb-1">Pressione o Dedo...</h2>
              <p className="text-sm font-medium text-slate-500 mb-6 flex items-center gap-2">
                <Activity size={16} className="text-red-500" />
                Lendo Scanner USB Local
              </p>

              <div className="w-full bg-slate-100 rounded-full h-2.5 mb-2 overflow-hidden">
                <div className={`h-2.5 rounded-full transition-all duration-300 ${quality > 85 ? 'bg-emerald-500' : 'bg-red-500'}`} style={{ width: `${quality}%` }}></div>
              </div>
              <span className="text-xs font-bold text-slate-400 tracking-wider">QUALIDADE DA CAPTURA: {quality}%</span>
            </div>
          )}

          {step === 'processing' && (
            <div className="animate-in zoom-in-95 flex flex-col items-center">
              <div className="w-24 h-24 bg-indigo-50 rounded-full flex items-center justify-center mb-6">
                <ServerCog size={40} className="text-indigo-600 animate-spin" />
              </div>
              <h2 className="text-lg font-bold text-slate-800 mb-2">Extraindo Minúcias</h2>
              <p className="text-sm text-slate-500">Compondo o PDF e assinando digitalmente...</p>
            </div>
          )}

          {step === 'success' && (
            <div className="animate-in slide-in-from-bottom-4 flex flex-col items-center w-full">
              <div className="w-24 h-24 bg-emerald-100 rounded-full flex items-center justify-center mb-6 shadow-lg shadow-emerald-500/20">
                <CheckCircle2 size={56} className="text-emerald-600" />
              </div>
              <h2 className="text-2xl font-bold text-slate-800 mb-2">Dossiê Aprovado!</h2>
              <p className="text-sm font-medium text-emerald-700 mb-8 bg-emerald-50 px-4 py-2 rounded-lg border border-emerald-200">
                Emissão Autorizada via Certificado A3 e pacote submetido à Raiz da AC.
              </p>

              <button 
                onClick={handleFinish}
                className="w-full h-14 bg-slate-900 hover:bg-black text-white font-bold rounded-xl flex items-center justify-center shadow-lg transition-transform active:scale-95"
              >
                Retornar à Fila de Atendimentos
              </button>
            </div>
          )}

        </div>
      </div>
    </div>
  );
}
