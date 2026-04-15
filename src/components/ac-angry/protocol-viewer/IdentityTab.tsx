import React from 'react';
import { Edit2, Check, Search, Save, ShieldCheck } from 'lucide-react';

interface IdentityTabProps {
  protocol: any;
  isEditingDados: boolean;
  setIsEditingDados: (val: boolean) => void;
  editableData: any;
  setEditableData: (val: any) => void;
  handleConsultarCPF: () => Promise<void>;
  isVerificandoCpf: boolean;
  isLocked: boolean;
  handleConsultarPJ: () => Promise<void>;
  isVerificandoPj: boolean;
  isPJ: boolean;
  isSalvando: boolean;
  handleSalvarDados: () => Promise<void>;
  currentStatus: string;
  formatDate: (date: string) => string;
  maskCNPJ: (v: string) => string;
  maskPhone: (v: string) => string;
}

export const IdentityTab: React.FC<IdentityTabProps> = ({
  protocol,
  isEditingDados,
  setIsEditingDados,
  editableData,
  setEditableData,
  handleConsultarCPF,
  isVerificandoCpf,
  isLocked,
  handleConsultarPJ,
  isVerificandoPj,
  isPJ,
  isSalvando,
  handleSalvarDados,
  currentStatus,
  formatDate,
  maskCNPJ,
  maskPhone
}) => {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-bold text-gray-800">Dados Cadastrais</h3>
        {!isLocked ? (
          <span className="text-[11px] text-amber-600 font-semibold bg-amber-50 px-2 py-1 rounded border border-amber-100 flex items-center gap-1.5 opacity-80">
            <Search size={12} className="rotate-90" /> Assuma o pedido para habilitar a edição
          </span>
        ) : (
          <button 
            onClick={() => setIsEditingDados(!isEditingDados)} 
            className="flex items-center gap-1.5 text-xs font-bold px-3 py-1.5 rounded transition-colors bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-100 shadow-sm"
          >
            {isEditingDados ? <><Check size={14} /> Salvar Edição</> : <><Edit2 size={14} /> Editar Dados</>}
          </button>
        )}
      </div>
      <div className="grid grid-cols-2 gap-x-8 gap-y-6 max-w-2xl">
        <div>
          <p className="text-xs text-gray-500 font-semibold mb-1">Nome Completo {isPJ ? '(Responsável)' : ''}</p>
          {isEditingDados ? (
            <input 
              type="text" 
              value={editableData.name}
              onChange={(e) => setEditableData({...editableData, name: e.target.value})}
              className="w-full text-sm font-bold text-emerald-900 border-b-2 border-emerald-200 focus:border-emerald-600 focus:outline-none bg-emerald-50/50 px-2 py-1 transition-colors rounded-t-sm"
            />
          ) : (
            <p className="text-sm font-bold text-gray-800 px-2 py-1 -ml-2">{editableData.name}</p>
          )}
        </div>
        <div className="flex flex-col">
          <p className="text-xs text-gray-500 font-semibold mb-1">CPF {isPJ ? '(Responsável)' : ''}</p>
          <div className="flex items-center gap-3">
            <p className="text-sm font-bold text-gray-800 px-2 py-1 -ml-2">{protocol.titular.cpf}</p>
            <button 
              onClick={handleConsultarCPF}
              disabled={isVerificandoCpf || !isLocked}
              className="text-[10px] font-bold text-emerald-600 hover:text-emerald-800 disabled:opacity-30 flex items-center gap-1 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-100 transition-colors"
            >
              {isVerificandoCpf ? <div className="w-2.5 h-2.5 border-2 border-emerald-400 border-t-emerald-600 rounded-full animate-spin"></div> : <Search size={10} />}
              Validar KYC
            </button>
          </div>
        </div>
        <div>
          <p className="text-xs text-gray-500 font-semibold mb-1">Data de Nascimento</p>
          {isEditingDados ? (
            <input 
              type="text" 
              value={editableData.birthdate}
              onChange={(e) => {
                const val = e.target.value.replace(/\D/g, '');
                let masked = val;
                if (val.length > 2) masked = val.slice(0, 2) + '/' + val.slice(2);
                if (val.length > 4) masked = masked.slice(0, 5) + '/' + masked.slice(5, 9);
                setEditableData({...editableData, birthdate: masked.slice(0, 10)});
              }}
              className="w-full text-sm font-bold text-emerald-900 border-b-2 border-emerald-200 focus:border-emerald-600 focus:outline-none bg-emerald-50/50 px-2 py-1 transition-colors rounded-t-sm"
              placeholder="DD/MM/AAAA"
            />
          ) : (
            <p className="text-sm font-bold text-gray-800 px-2 py-1 -ml-2">{formatDate(editableData.birthdate)}</p>
          )}
        </div>
        <div className="col-span-1">
           <p className="text-xs text-gray-500 font-semibold mb-1 uppercase tracking-tighter">Situação CPF</p>
           <span className={`text-[10px] font-bold px-2 py-0.5 rounded border ${
             editableData.situacaoCpf === 'REGULAR' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-gray-50 text-gray-500 border-gray-200'
           }`}>
             {editableData.situacaoCpf}
           </span>
        </div>
        <div>
          <p className="text-xs text-gray-500 font-semibold mb-1">E-mail</p>
          {isEditingDados ? (
            <input 
              type="email" 
              value={editableData.email}
              onChange={(e) => setEditableData({...editableData, email: e.target.value.replace(/\s/g, '')})}
              className="w-full text-sm font-bold text-emerald-900 border-b-2 border-emerald-200 focus:border-emerald-600 focus:outline-none bg-emerald-50/50 px-2 py-1 transition-colors rounded-t-sm"
            />
          ) : (
            <p className="text-sm font-bold text-gray-800 px-2 py-1 -ml-2">{editableData.email}</p>
          )}
        </div>
        <div>
          <p className="text-xs text-gray-500 font-semibold mb-1">Telefone</p>
          {isEditingDados ? (
            <input 
              type="text" 
              value={editableData.phone}
              onChange={(e) => setEditableData({...editableData, phone: maskPhone(e.target.value)})}
              className="w-full text-sm font-bold text-emerald-900 border-b-2 border-emerald-200 focus:border-emerald-600 focus:outline-none bg-emerald-50/50 px-2 py-1 transition-colors rounded-t-sm"
            />
          ) : (
            <p className="text-sm font-bold text-gray-800 px-2 py-1 -ml-2">{maskPhone(editableData.phone)}</p>
          )}
        </div>
        {isPJ && protocol.company && (
          <>
            <div className="col-span-2">
               <p className="text-xs text-gray-500 font-semibold mb-1">Nome Empresarial (Razão Social)</p>
               {isEditingDados ? (
                 <input 
                   type="text" 
                   value={editableData.companyName}
                   onChange={(e) => setEditableData({...editableData, companyName: e.target.value})}
                   className="w-full text-sm font-bold text-emerald-900 border-b-2 border-emerald-200 focus:border-emerald-600 focus:outline-none bg-emerald-50/50 px-2 py-1 transition-colors rounded-t-sm"
                 />
               ) : (
                 <p className="text-sm font-bold text-gray-800 px-2 py-1 -ml-2">{editableData.companyName}</p>
               )}
            </div>
            {protocol.company.cnpj && (
              <div className="col-span-1">
                <p className="text-xs text-gray-500 font-semibold mb-1">CNPJ</p>
                <p className="text-sm font-bold text-gray-800 px-2 py-1 -ml-2">{maskCNPJ(protocol.company.cnpj)}</p>
              </div>
            )}
            <div className="col-span-1 flex items-end">
               <button 
                 onClick={handleConsultarPJ}
                 disabled={isVerificandoPj || !isLocked}
                 className="mb-1 text-[10px] font-bold text-emerald-600 hover:text-emerald-800 disabled:opacity-30 flex items-center gap-1"
               >
                 <Search size={10} /> Validar na RFB
               </button>
            </div>
          </>
        )}

        {/* SPECIAL SECTION: Documento Reservado para 9002 */}
        {protocol.id === 'PRT-2026-9002' && currentStatus === 'EMITIDO' && (
          <div className="col-span-2 mt-8 p-6 bg-slate-900 rounded-3xl border-4 border-amber-400/30 animate-in zoom-in duration-500 shadow-2xl shadow-amber-900/20">
            <div className="flex items-center gap-4 mb-6">
              <div className="w-14 h-14 bg-amber-400 rounded-2xl flex items-center justify-center text-slate-900 shadow-lg shadow-amber-400/20">
                <ShieldCheck size={32} />
              </div>
              <div>
                <h4 className="text-amber-400 font-black text-lg uppercase tracking-tight">Documento Reservado</h4>
                <p className="text-slate-400 text-[10px] font-bold uppercase tracking-widest">Confidencial • Auditoria Nível 5</p>
              </div>
            </div>
            <div className="bg-slate-800/50 rounded-2xl p-6 border border-slate-700/50 mb-6 text-left">
               <p className="text-slate-300 text-xs font-medium leading-relaxed mb-4">
                 Este documento contém o hash de integridade e a trilha de auditoria reservada para a titular Maria Eduarda Fernandes. 
                 As evidências biométricas foram seladas com carimbo de tempo da Autoridade Certificadora.
               </p>
               <div className="flex items-center gap-2 text-emerald-400 text-[10px] font-black uppercase tracking-tighter">
                 <Check size={14} /> Integridade do Dossiê Verificada
               </div>
            </div>
            <button 
              onClick={() => alert("Baixando Dossiê Reservado (Criptografado)...")}
              className="w-full py-4 bg-amber-400 text-slate-900 font-black text-xs uppercase tracking-widest rounded-2xl hover:bg-white transition-all shadow-xl shadow-amber-400/10"
            >
              Acessar Dossiê Reservado (.SECURE)
            </button>
          </div>
        )}
      </div>

      {isEditingDados && (
        <div className="mt-8 pt-6 border-t border-gray-100 flex justify-end gap-3">
           <button 
            onClick={() => setIsEditingDados(false)}
            className="px-4 py-2 text-sm font-bold text-gray-500 hover:text-gray-700"
           >
             Descartar
           </button>
           <button 
            onClick={handleSalvarDados}
            disabled={isSalvando}
            className="px-6 py-2 bg-emerald-600 text-white text-sm font-bold rounded-xl shadow-lg shadow-emerald-200 hover:bg-emerald-700 disabled:opacity-50 flex items-center gap-2"
           >
             {isSalvando ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div> : <Save size={16} />}
             Salvar Alterações
           </button>
        </div>
      )}
    </div>
  );
};
