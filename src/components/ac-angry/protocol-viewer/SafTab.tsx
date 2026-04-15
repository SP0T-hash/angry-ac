import React from 'react';
import { Check, FileText } from 'lucide-react';

interface SafTabProps {
  isLocked: boolean;
  setShowFiltersModal: (val: boolean) => void;
  isBiometriaColetada: boolean;
  safStatus: 'idle' | 'searching' | 'clean' | 'attached';
  setSafStatus: (val: any) => void;
}

export const SafTab: React.FC<SafTabProps> = ({
  isLocked,
  setShowFiltersModal,
  isBiometriaColetada,
  safStatus,
  setSafStatus
}) => {
  return (
    <div>
      <div className="flex items-center gap-3">
        <button 
          disabled={!isLocked}
          className="px-4 py-1.5 border border-gray-300 text-gray-600 rounded font-semibold text-sm hover:bg-gray-50 transition-colors shadow-sm bg-white disabled:opacity-20"
        >
          Comunicar fraude
        </button>
        <button
          onClick={() => setShowFiltersModal(true)}
          className={`px-4 py-1.5 rounded font-semibold text-sm shadow-sm transition-colors ${!isBiometriaColetada || !isLocked ? 'bg-gray-300 text-gray-500 cursor-not-allowed opacity-20' : 'bg-emerald-800 text-white hover:bg-emerald-700'}`}
          disabled={!isBiometriaColetada || safStatus === 'searching' || safStatus === 'attached' || !isLocked}
          title={!isBiometriaColetada ? "Necessário realizar Coleta Biométrica primeiro" : !isLocked ? "Assuma o pedido para buscar" : ""}
        >
          Busca com filtros
        </button>
      </div>

      {safStatus === 'idle' && (
        <div className="h-64 border-2 border-dashed border-gray-100 rounded-xl mt-8 flex items-center justify-center bg-gray-50/50">
          <p className="text-gray-400 font-medium text-sm">Área de visualização vazia (Sem SAF)</p>
        </div>
      )}

      {safStatus === 'searching' && (
        <div className="h-64 border border-emerald-100 rounded-xl mt-8 flex flex-col items-center justify-center bg-emerald-50/30">
          <div className="animate-spin w-8 h-8 border-4 border-emerald-200 border-t-emerald-600 rounded-full mb-4"></div>
          <p className="text-emerald-800 font-bold text-sm">Buscando em bases de restrição...</p>
          <p className="text-emerald-500 font-medium text-xs mt-1">Comparando características físicas informadas.</p>
        </div>
      )}

      {safStatus === 'clean' && (
        <div className="border border-emerald-200 rounded-xl mt-8 bg-emerald-50/30 p-8 flex flex-col items-center text-center animate-in fade-in zoom-in-95">
          <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mb-4 text-emerald-600">
            <Check size={32} strokeWidth={3} />
          </div>
          <h3 className="text-lg font-extrabold text-emerald-900 mb-2">Nenhum Registro Encontrado</h3>
          <p className="text-emerald-700 font-medium text-sm max-w-md mx-auto mb-6">
            A varredura nas listas de fraudadores não resultou em matches positivos com as características físicas selecionadas.
          </p>
          <button 
            onClick={() => setSafStatus('attached')}
            className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-lg shadow-sm transition-colors text-sm"
          >
            Confirmar e Anexar Consulta ao SAF
          </button>
        </div>
      )}

      {safStatus === 'attached' && (
        <div className="border border-emerald-200 rounded-xl mt-8 bg-white p-6 flex flex-col shadow-sm animate-in fade-in zoom-in-95">
          <div className="flex items-center gap-3 border-b border-gray-100 pb-4 mb-4">
            <div className="w-10 h-10 bg-emerald-100 rounded-full flex items-center justify-center text-emerald-600 shrink-0">
              <FileText size={20} />
            </div>
            <div>
              <h4 className="text-sm font-bold text-gray-900">Laudo Técnico SAF anexado</h4>
              <p className="text-xs text-gray-500 font-medium">Validado por Vitor Matheus em {new Date().toLocaleDateString()}</p>
            </div>
            <div className="ml-auto flex items-center gap-2">
               <span className="bg-emerald-50 text-emerald-700 px-3 py-1 rounded text-xs font-bold border border-emerald-100">
                 Risco Baixo
               </span>
            </div>
          </div>
          <div className="text-sm text-gray-600 font-medium flex flex-col gap-2">
             <p>• As características informadas não coincidem com o banco de fraudes.</p>
             <p>• Vínculo anexado ao dossiê de auditoria principal do titular.</p>
          </div>
        </div>
      )}
    </div>
  );
};
