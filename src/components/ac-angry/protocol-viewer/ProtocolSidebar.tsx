import React from 'react';
import { ArrowLeft, Lock, Unlock } from 'lucide-react';

interface ProtocolSidebarProps {
  protocol: any;
  onBack: () => void;
  isLocked: boolean;
  lockedBy: string | null;
  toggleCadeado: () => void;
  currentStatus: string;
  hwStatus: 'connected' | 'disconnected' | 'connecting';
  isPJ: boolean;
}

export const ProtocolSidebar: React.FC<ProtocolSidebarProps> = ({
  protocol,
  onBack,
  isLocked,
  lockedBy,
  toggleCadeado,
  currentStatus,
  hwStatus,
  isPJ
}) => {
  return (
    <div className="hidden lg:flex lg:col-span-3 xl:col-span-2 shrink-0 border-r border-gray-100 bg-white/40 backdrop-blur-xl flex-col p-6 overflow-y-auto relative z-20">
      <button
        onClick={onBack}
        className="self-start text-[10px] font-black tracking-widest uppercase text-slate-400 hover:text-slate-900 mb-8 flex items-center gap-2 transition-all group"
      >
        <ArrowLeft size={14} className="group-hover:-translate-x-1 transition-transform" /> Voltar
      </button>

      <div className="mb-8">
        <div className="flex justify-between items-start mb-1 gap-2">
          <h2 className="text-xl font-black text-slate-800 leading-tight tracking-tight">
            {protocol.titular.name}
          </h2>
          <button 
            onClick={toggleCadeado}
            className={`w-9 h-9 rounded-lg flex items-center justify-center transition-all ${
              isLocked 
                ? 'bg-amber-100 text-amber-600 border border-amber-200 shadow-sm hover:bg-amber-200' 
                : 'bg-emerald-50 text-emerald-600 border border-emerald-100 shadow-sm hover:bg-emerald-100'
            }`}
            title={isLocked ? "Pedido Seguro (Sua edição)" : "Clique para assumir este pedido"}
          >
            {isLocked ? <Lock size={16} /> : <Unlock size={16} />}
          </button>
        </div>
        
        <div className="h-6 flex items-center mb-4">
           {isLocked ? (
             <div className="bg-emerald-50/80 border border-emerald-100 rounded-lg px-2 py-1 flex items-center gap-1.5 animate-in fade-in slide-in-from-left-2 transition-all">
               <div className="w-4 h-4 rounded-full bg-emerald-600 text-white flex items-center justify-center text-[8px] font-black">VC</div>
               <span className="text-[10px] font-black text-emerald-700 uppercase tracking-tighter">BLOQUEADO POR: {lockedBy || 'VITOR MATHEUS'}</span>
             </div>
           ) : (
             <div className="flex items-center gap-1 text-[10px] font-bold text-slate-400 uppercase tracking-widest pl-1">
               <div className="w-1.5 h-1.5 rounded-full bg-slate-300"></div>
               Pendente de Assunção
             </div>
           )}
        </div>

        <div className="mb-4">
          <div className={`inline-flex items-center gap-1.5 px-2 py-1 rounded-md text-[9px] font-black uppercase tracking-tighter border ${
            hwStatus === 'connected' ? 'bg-emerald-50 text-emerald-600 border-emerald-100' :
            hwStatus === 'connecting' ? 'bg-amber-50 text-amber-600 border-amber-100' :
            'bg-gray-50 text-gray-400 border-gray-100'
          }`}>
            <div className={`w-1.5 h-1.5 rounded-full ${
              hwStatus === 'connected' ? 'bg-emerald-600' :
              hwStatus === 'connecting' ? 'bg-amber-500 animate-pulse' :
              'bg-gray-300'
            }`}></div>
            Hardware: {hwStatus === 'connected' ? 'Pronto' : hwStatus === 'connecting' ? 'Buscando...' : 'Desconectado'}
          </div>
        </div>

        <p className="text-sm font-bold text-slate-500 mb-3 tracking-tighter">{protocol.titular.cpf}</p>
        
        <div className="flex">
          <span className={`text-[10px] font-black px-3 py-1 rounded-lg border uppercase tracking-wider shadow-sm transition-all ${
            currentStatus === 'EMITIDO' ? 'bg-emerald-50 text-emerald-700 border-emerald-100 shadow-emerald-50' :
            currentStatus === 'APROVADO' ? 'bg-emerald-50 text-emerald-700 border-emerald-100 shadow-emerald-50' :
            currentStatus === 'REJEITADO' ? 'bg-rose-50 text-rose-700 border-rose-100 shadow-rose-50' :
            'bg-slate-100 text-slate-600 border-slate-200'
          }`}>
            {currentStatus}
          </span>
        </div>
      </div>

      <div className="flex flex-col gap-5 mt-4">
        <div className="space-y-0.5">
           <label className="text-[8px] font-black text-slate-300 uppercase tracking-[0.2em]">Produto</label>
           <p className="text-[11px] font-bold text-slate-600 uppercase tracking-tight">{isPJ ? "e-CNPJ A1" : "e-CPF A3"}</p>
        </div>
        <div className="space-y-0.5">
           <label className="text-[8px] font-black text-slate-300 uppercase tracking-[0.2em]">Protocolo</label>
           <p className="text-[11px] font-bold text-slate-600 tracking-tight">{protocol.id}</p>
        </div>
        
        <div className="h-[1px] bg-slate-50"></div>

        <div className="grid grid-cols-1 gap-4">
          <div className="flex flex-col gap-0.5">
             <span className="text-[8px] font-black text-slate-300 uppercase tracking-widest">AR Emissora</span>
             <span className="text-[10px] font-bold text-slate-400 uppercase">{protocol.ar || 'AR VEMAPI'}</span>
          </div>
          <div className="flex flex-col gap-0.5">
             <span className="text-[8px] font-black text-slate-300 uppercase tracking-widest">Ponto de Atendimento</span>
             <span className="text-[10px] font-bold text-slate-400 uppercase">{protocol.pa || 'Matriz Central'}</span>
          </div>
          <div className="flex flex-col gap-0.5">
             <span className="text-[8px] font-black text-slate-300 uppercase tracking-widest">Data Solicitação</span>
             <span className="text-[10px] font-bold text-slate-400 uppercase">27/03/2026</span>
          </div>
        </div>
      </div>
    </div>
  );
};
