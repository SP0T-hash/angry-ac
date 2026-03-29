import React, { useState } from 'react';
import { Search, Filter, ArrowRight } from 'lucide-react';

export default function ProtocolQueue({ protocols, onSelect }: any) {
  const [searchTerm, setSearchTerm] = useState('');

  return (
    <div className="flex flex-col h-full bg-[#F8FAFC] text-gray-800">
      {/* Header Corporativo VEMAPI */}
      <div className="px-10 py-10 bg-white border-b border-gray-100 flex flex-col md:flex-row md:items-center justify-between gap-6 relative shadow-[0_1px_3px_rgba(0,0,0,0.02)]">
        <div className="relative z-10">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></div>
            <span className="text-[10px] font-black text-emerald-600 uppercase tracking-[0.2em]">Painel de Operações Real-time</span>
          </div>
          <h2 className="text-3xl font-black text-slate-900 tracking-tight mb-1">Fila de Validação</h2>
          <p className="text-sm font-medium text-slate-400">
            Agente, você possui <span className="font-bold text-emerald-600 underline decoration-emerald-200 underline-offset-4">{protocols.length} protocolos</span> aguardando sua assinatura.
          </p>
        </div>
        
        <div className="flex flex-col md:flex-row items-center gap-4 w-full md:w-auto relative z-10">
          <div className="relative w-full md:w-[400px]">
            <input 
              type="text" 
              placeholder="Buscar por CPF, Nome ou ID..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-slate-50 border-none rounded-xl py-3.5 pl-12 pr-4 text-sm text-slate-700 placeholder-slate-400 outline-none focus:ring-2 focus:ring-emerald-500/20 focus:bg-white transition-all shadow-inner"
            />
            <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" />
          </div>
          <button className="bg-white border border-slate-200 p-3.5 rounded-xl text-slate-500 hover:text-emerald-600 transition-all hover:bg-slate-50 shadow-sm flex items-center justify-center">
            <Filter size={18} />
          </button>
        </div>

        {/* Efeito Decorativo de Fundo */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-50/30 rounded-full -translate-y-1/2 translate-x-1/2 blur-3xl -z-0"></div>
      </div>

      {/* Tabela Clean Full-Width (Light Mode) / Cards on Mobile */}
      <div className="flex-1 overflow-y-auto custom-scrollbar p-4 lg:p-12">
        
        {/* Mobile-only Card View */}
        <div className="md:hidden space-y-4">
          {protocols.map((p: any) => (
            <div 
              key={p.id}
              onClick={() => onSelect(p)}
              className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm active:scale-[0.98] transition-all"
            >
              <div className="flex justify-between items-start mb-4">
                <div className="flex flex-col gap-1">
                  <span className="text-xs font-black text-slate-800 uppercase tracking-tight">{p.id}</span>
                  <span className="text-[8px] font-black text-emerald-500 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-100 w-fit">{p.product}</span>
                </div>
                <span className={`text-[8px] font-black px-2 py-1 rounded-md border uppercase tracking-widest ${
                  p.status === 'APROVADO' ? 'bg-emerald-50 text-emerald-700 border-emerald-100' : 
                  'bg-slate-50 text-slate-600 border-slate-100'
                }`}>
                  {p.status}
                </span>
              </div>
              <p className="text-sm font-black text-slate-900 mb-1">{p.titular.name}</p>
              <p className="text-[10px] text-slate-400 font-bold mb-4">{p.titular.cpf}</p>
              
              <div className="flex items-center justify-between pt-4 border-t border-slate-50">
                 <div className="flex items-center gap-2">
                    <div className={`w-1.5 h-1.5 rounded-full ${p.compliance.biometria === 'APROVADA' ? 'bg-emerald-500' : 'bg-amber-400'}`}></div>
                    <span className="text-[9px] font-bold text-slate-500 uppercase tracking-tighter">Bio: {p.compliance.biometria}</span>
                 </div>
                 <ArrowRight size={14} className="text-slate-300" />
              </div>
            </div>
          ))}
        </div>

        {/* Desktop Table View */}
        <div className="hidden md:block bg-white border border-slate-100 rounded-2xl overflow-hidden shadow-[0_8px_30px_rgb(0,0,0,0.04)]">
          
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50/50 border-b border-slate-100">
                <th className="py-5 px-8 text-[11px] font-black text-slate-400 uppercase tracking-[0.15em]">Identificação</th>
                <th className="py-5 px-8 text-[11px] font-black text-slate-400 uppercase tracking-[0.15em]">Titular / Empresa</th>
                <th className="py-5 px-8 text-[11px] font-black text-slate-400 uppercase tracking-[0.15em]">Compliance (KYC)</th>
                <th className="py-5 px-8 text-[11px] font-black text-slate-400 uppercase tracking-[0.15em]">Status Atual</th>
                <th className="py-5 px-8 text-[11px] font-black text-slate-400 uppercase tracking-[0.15em] text-right">Controle</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {protocols.map((p: any) => (
                <tr 
                  key={p.id} 
                  className="hover:bg-emerald-50/30 transition-all group cursor-pointer bg-white"
                  onClick={() => onSelect(p)}
                >
                  
                  {/* ID / Produto */}
                  <td className="py-6 px-8">
                    <div className="flex flex-col items-start gap-2">
                      <span className="text-sm font-black text-slate-800 group-hover:text-emerald-600 transition-colors uppercase tracking-tight">{p.id}</span>
                      <span className="text-[9px] font-black text-emerald-500 bg-emerald-50/50 px-2 py-0.5 rounded-full border border-emerald-100/50 uppercase tracking-widest">
                        {p.product}
                      </span>
                    </div>
                  </td>

                  {/* Titular */}
                  <td className="py-6 px-8">
                    <div className="flex items-center gap-4">
                      <div className="flex flex-col">
                        <span className="text-sm font-black text-slate-800 group-hover:translate-x-1 transition-transform inline-block">{p.titular.name}</span>
                        <div className="flex items-center gap-2 mt-1.5">
                           <span className="text-[11px] text-slate-400 font-bold tracking-tighter">{p.titular.cpf}</span>
                           {p.company && (
                             <>
                                <span className="text-slate-200">|</span>
                                <span className="text-[11px] text-slate-400 font-medium truncate max-w-[180px]">{p.company.razao_social}</span>
                             </>
                           )}
                        </div>
                      </div>
                    </div>
                  </td>

                  {/* Biometria */}
                  <td className="py-6 px-8">
                    <div className="flex flex-col gap-1.5">
                      <div className="flex items-center gap-2">
                        <div className={`w-1.5 h-1.5 rounded-full shadow-sm ${
                          p.compliance.biometria === 'APROVADA' ? 'bg-emerald-500 shadow-emerald-200' :
                          p.compliance.biometria === 'REPROVADA' ? 'bg-rose-500 shadow-rose-200' :
                          'bg-amber-500 shadow-amber-200'
                        }`}></div>
                        <span className="text-[10px] font-black text-slate-500 uppercase tracking-wider">
                          Biometria: {p.compliance.biometria}
                        </span>
                      </div>
                      <div className="w-24 h-1 bg-slate-100 rounded-full overflow-hidden">
                        <div className={`h-full rounded-full ${
                          p.compliance.biometria === 'APROVADA' ? 'w-full bg-emerald-500' :
                          p.compliance.biometria === 'REPROVADA' ? 'w-full bg-rose-500' :
                          'w-1/2 bg-amber-500'
                        }`}></div>
                      </div>
                    </div>
                  </td>

                  {/* Status */}
                  <td className="py-6 px-8">
                     <span className={`text-[10px] font-black px-3 py-1.5 rounded-lg border uppercase tracking-wider shadow-sm ${
                        p.status === 'APROVADO' ? 'bg-emerald-50 text-emerald-700 border-emerald-100' : 
                        p.status === 'REJEITADO' ? 'bg-rose-50 text-rose-700 border-rose-100' :
                        p.status === 'EMITIDO' ? 'bg-sky-50 text-sky-700 border-sky-100' :
                        p.status === 'AGUARDANDO_VIDEO' ? 'bg-amber-50 text-amber-700 border-amber-100' : 
                        'bg-slate-50 text-slate-600 border-slate-100'
                      }`}>
                        {p.status.replace('_', ' ')}
                     </span>
                  </td>

                  {/* Action */}
                  <td className="py-6 px-8 text-right">
                    <button 
                      onClick={(e) => {
                        e.stopPropagation();
                        onSelect({ ...p, assumed: true });
                      }}
                      className="bg-slate-900 hover:bg-emerald-600 text-white font-black text-[10px] uppercase tracking-[0.15em] px-5 py-3 rounded-xl transition-all shadow-lg hover:shadow-emerald-200 flex items-center gap-2 ml-auto"
                    >
                      Assumir <ArrowRight size={14} />
                    </button>
                  </td>

                </tr>
              ))}
            </tbody>
          </table>

        </div>
      </div>
    </div>
  );
}
