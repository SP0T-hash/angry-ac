import React from 'react';
import { DocItem } from './CommonComponents';

interface DocumentsTabProps {
  isLocked: boolean;
  setShowNewDocModal: (val: boolean) => void;
}

export const DocumentsTab: React.FC<DocumentsTabProps> = ({ isLocked, setShowNewDocModal }) => {
  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <h3 className="text-lg font-bold text-gray-800 uppercase tracking-tight">Documentos</h3>
        <div className="flex items-center gap-2">
          <button className="px-4 py-1.5 border border-gray-300 rounded font-bold text-[10px] uppercase tracking-widest text-slate-500 hover:bg-gray-50 shadow-sm transition-colors">
            Atualizar
          </button>
          <button 
            onClick={() => setShowNewDocModal(true)}
            disabled={!isLocked}
            className="px-4 py-1.5 bg-emerald-800 text-white rounded font-bold text-[10px] uppercase tracking-widest hover:bg-emerald-700 shadow-sm transition-colors disabled:opacity-20"
          >
            Novo
          </button>
        </div>
      </div>

      <div className="border-b border-gray-200 mb-4 flex gap-6">
        <button className="text-sm font-semibold border-b-[3px] border-emerald-700 text-emerald-800 pb-2">Documentos</button>
        <button className="text-sm font-semibold text-gray-500 pb-2">Excluídos</button>
      </div>

      <div className="flex flex-col">
        <DocItem name="Documento de identificação" status="Novo" date="27/03/2026 09:40:41" showMenu />
        <DocItem name="Evidência de verificação biográfica" status="Novo" date="27/03/2026 09:39:54" />
        <DocItem name="Evidência de coleta biométrica" status="Novo" date="27/03/2026 09:35:54" />
        <DocItem name="Foto do solicitante" status="Novo" date="27/03/2026 09:39:33" />
        <DocItem name="Videoconferência" status="Novo" date="27/03/2026 10:01:13" />
      </div>
      <div className="mt-6 flex justify-end">
        <button 
          onClick={() => setShowNewDocModal(true)}
          disabled={!isLocked}
          className="bg-slate-900 hover:bg-slate-800 text-white text-[10px] font-black uppercase tracking-widest px-4 py-2 rounded-lg shadow-lg disabled:opacity-20 transition-all"
        >
          Anexar Novo Dossiê
        </button>
      </div>
    </div>
  );
};
