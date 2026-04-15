import React, { useState } from 'react';
import { X, AlertTriangle, Fingerprint, Check } from 'lucide-react';

export const RejectionAuthModal = ({ isOpen, onClose, onConfirm }: any) => {
  const [pin, setPin] = useState('');
  const [isCapturing, setIsCapturing] = useState(false);
  const [captured, setCaptured] = useState(false);

  if (!isOpen) return null;

  const handleCapture = () => {
    setIsCapturing(true);
    setTimeout(() => {
      setIsCapturing(false);
      setCaptured(true);
    }, 2000);
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-300">
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-300 border border-emerald-100">
        <div className="bg-emerald-600 px-8 py-6 text-white relative">
          <button onClick={onClose} className="absolute right-6 top-6 text-white/50 hover:text-white transition-colors">
            <X size={20} />
          </button>
          <div className="w-12 h-12 bg-white/20 rounded-2xl flex items-center justify-center mb-4 backdrop-blur-md">
            <AlertTriangle size={24} />
          </div>
          <h3 className="text-xl font-black uppercase tracking-tight">Confirmar Rejeição</h3>
          <p className="text-emerald-100 text-xs font-bold mt-1 uppercase tracking-widest opacity-80">Autenticação do Agente (AGR)</p>
        </div>

        <div className="p-8 space-y-6">
          <div>
            <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Digite seu PIN (Certificado A3)</label>
            <input 
              type="password" 
              value={pin}
              onChange={(e) => setPin(e.target.value)}
              placeholder="****"
              className="w-full bg-slate-50 border-2 border-slate-100 rounded-xl px-4 py-3 text-center text-lg font-black tracking-[0.5em] focus:border-emerald-500 focus:outline-none transition-all"
            />
          </div>

          <div className="bg-slate-50 rounded-2xl p-6 border-2 border-dashed border-slate-200 text-center">
            <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-4">Validar Biometria do AGR</p>
            <button 
              onClick={handleCapture}
              disabled={isCapturing || captured}
              className={`w-20 h-20 rounded-full mx-auto flex items-center justify-center transition-all ${
                captured ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-100' : 
                isCapturing ? 'bg-emerald-100 text-emerald-600 animate-pulse' : 
                'bg-white border-2 border-slate-200 text-slate-300 hover:border-emerald-400 hover:text-emerald-500'
              }`}
            >
              <Fingerprint size={32} className={isCapturing ? 'animate-bounce' : ''} />
            </button>
            <p className="text-[10px] font-black text-slate-400 uppercase mt-4">
              {captured ? 'Biometria Validada' : isCapturing ? 'Capturando digital...' : 'Toque no sensor biométrico'}
            </p>
          </div>

          <button 
            disabled={!captured || pin.length < 4}
            onClick={() => onConfirm(pin)}
            className="w-full bg-slate-900 hover:bg-emerald-600 text-white font-black py-4 rounded-2xl shadow-xl shadow-slate-100 transition-all uppercase tracking-widest text-xs disabled:opacity-20 flex items-center justify-center gap-2"
          >
            <Check size={16} /> Confirmar Rejeição Definitiva
          </button>
        </div>
      </div>
    </div>
  );
};
