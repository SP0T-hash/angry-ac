import React from 'react';
import { X, UploadCloud, Check, Lock } from 'lucide-react';

interface NewDocModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedDocType: string;
  setSelectedDocType: (val: string) => void;
  certidaoCode: string;
  setCertidaoCode: (val: string) => void;
}

export const NewDocModal: React.FC<NewDocModalProps> = ({
  isOpen,
  onClose,
  selectedDocType,
  setSelectedDocType,
  certidaoCode,
  setCertidaoCode
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-xl flex flex-col overflow-hidden animate-in zoom-in-95 duration-200 border border-gray-100">
        
        <div className="px-8 py-6 flex justify-between items-start pb-4">
          <div>
            <h2 className="text-xl font-extrabold text-gray-900 flex items-center gap-3 mb-1">
              <div className="w-10 h-10 rounded-full bg-emerald-50 flex items-center justify-center border border-emerald-100">
                <UploadCloud size={20} className="text-emerald-600" />
              </div>
              Anexar Documento ou Consulta
            </h2>
            <p className="text-sm font-semibold text-gray-500 ml-[52px]">Preencha os dados e anexe a documentação para a trilha.</p>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-800 bg-gray-50 hover:bg-gray-100 rounded-full p-2 transition-colors">
            <X size={18} />
          </button>
        </div>

        <div className="px-8 py-2 pb-6 space-y-6">
          <div>
            <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2 ml-1">Classificação do Documento / Consulta</label>
            <div className="relative">
              <select 
                value={selectedDocType}
                onChange={(e) => setSelectedDocType(e.target.value)}
                className="w-full border-2 border-gray-200 rounded-xl p-3.5 text-[15px] font-bold text-emerald-900 focus:border-emerald-600 focus:ring-0 outline-none transition-colors appearance-none cursor-pointer bg-white shadow-sm"
              >
                <optgroup label="Identificação Pessoal">
                  <option>Documento de Identificação (RG / CNH / Passaporte)</option>
                  <option>Foto do Solicitante / Biometria Facial</option>
                </optgroup>
                <optgroup label="Ativos Empresariais">
                  <option>Contrato Social / Estatuto / Requerimento</option>
                  <option>Ata de Eleição / Termo de Posse</option>
                  <option>Cartão CNPJ</option>
                </optgroup>
                <optgroup label="Cadastros & Certidões ICP-Brasil">
                  <option>Consultas de Certidão (RFB, Trabalhista, Estadual, etc.)</option>
                  <option>Comprovante de Situação Cadastral (CPF)</option>
                  <option>CEI (Cadastro Específico do INSS)</option>
                  <option>CAEPF (Atividade Econômica PF)</option>
                  <option>CNO (Cadastro Nacional de Obras)</option>
                  <option>Título de Eleitor</option>
                </optgroup>
                <optgroup label="Conformidade & PSBIO">
                  <option>Dossiê de Verificação (Background Check)</option>
                  <option>Laudo de Risco Antifraude (SAF)</option>
                  <option>Evidência de Coleta Biométrica</option>
                  <option>Evidência de Verificação Biográfica</option>
                  <option>Procuração / Termo de Representação legal</option>
                </optgroup>
              </select>
              <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-emerald-600">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="m6 9 6 6 6-6"/></svg>
              </div>
            </div>
          </div>

          {selectedDocType.includes('Certidão') && (
             <div className="animate-in fade-in slide-in-from-top-2">
                <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2 ml-1">Chave / Código de Autenticidade (Opcional)</label>
                <input 
                  type="text" 
                  value={certidaoCode}
                  onChange={(e) => setCertidaoCode(e.target.value)}
                  placeholder="Ex: 1A2B.3C4D.5E6F.7G8H"
                  className="w-full border-2 border-emerald-100 bg-emerald-50/30 rounded-xl p-3.5 text-[15px] font-bold text-emerald-900 focus:border-emerald-600 focus:bg-white focus:ring-0 outline-none transition-colors placeholder:text-emerald-300"
                />
                <p className="mt-2 text-[11px] font-semibold text-emerald-600/70 ml-1">Se preenchido, o sistema poderá automatizar a validação e atrelar a consulta ao laudo.</p>
             </div>
          )}

          <div>
            <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2 ml-1">Arquivo Eletrônico</label>
            <div className="border-2 border-dashed border-emerald-200 bg-emerald-50/40 hover:bg-emerald-50/80 hover:border-emerald-500 transition-all duration-300 rounded-2xl p-8 flex flex-col items-center justify-center cursor-pointer group shadow-sm">
              <div className="w-14 h-14 bg-white shadow-sm border border-emerald-50 rounded-full flex items-center justify-center mb-4 group-hover:scale-110 group-hover:shadow-md transition-all duration-300">
                <UploadCloud size={24} className="text-emerald-600" />
              </div>
              <p className="text-[15px] font-extrabold text-emerald-950 mb-1 group-hover:text-emerald-700 transition-colors">Clique e procure ou arraste o arquivo aqui</p>
              <p className="text-xs text-emerald-800/60 font-semibold px-4 text-center">Somente formatos PDF, JPG, PNG e arquivos assinados P7S são suportados (Máx. 10MB)</p>
            </div>
          </div>
        </div>

        <div className="px-8 py-5 bg-gray-50 border-t border-gray-100 flex justify-between items-center rounded-b-2xl">
          <p className="text-[11px] font-bold text-gray-400 max-w-[200px] leading-tight flex items-center gap-1.5"><Lock size={10} /> Operação registrada e rastreável</p>
          <div className="flex gap-3">
            <button 
              onClick={onClose}
              className="px-5 py-2.5 bg-white border border-gray-200 text-gray-600 font-bold rounded-xl text-sm hover:bg-gray-50 hover:text-gray-900 transition-colors shadow-sm"
            >
              Cancelar
            </button>
            <button onClick={onClose} className="px-6 py-2.5 bg-emerald-700 text-white font-bold rounded-xl text-sm hover:bg-emerald-800 transition-colors shadow-sm flex items-center gap-2">
              <Check size={16} /> Finalizar Inclusão
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
