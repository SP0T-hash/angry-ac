import React from 'react';
import { Search, Filter, Download, User, Calendar, ShieldCheck } from 'lucide-react';

export default function ClientCRM() {
  const clients = [
    { id: 1, name: 'João da Silva Sauro', cpf: '123.***.***-01', product: 'e-CPF A1', status: 'ATIVO', expires: '28/03/2027' },
    { id: 2, name: 'Empresa Alpha LTDA', cnpj: '12.***.***/0001-90', product: 'e-CNPJ A3', status: 'ATIVO', expires: '15/05/2026' },
    { id: 3, name: 'Maria Oliveira', cpf: '456.***.***-82', product: 'e-CPF A3', status: 'EXPIRADO', expires: '10/01/2026' },
    { id: 4, name: 'Carlos Alberto Costa', cpf: '789.***.***-44', product: 'e-CPF A1', status: 'REJEITADO', expires: '-' },
  ];

  return (
    <div className="animate-in fade-in duration-500">
      <div className="flex items-center justify-between mb-8">
        <h2 className="text-2xl font-black text-slate-800 uppercase tracking-tight">Gestão de Clientes (CRM)</h2>
        <div className="flex items-center gap-3">
          <button className="flex items-center gap-2 px-4 py-2 border border-slate-200 rounded-xl text-xs font-bold text-slate-500 hover:bg-slate-50 transition-all">
            <Filter size={14} /> Filtrar
          </button>
          <button className="flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white rounded-xl text-xs font-bold hover:bg-emerald-700 transition-all shadow-lg shadow-emerald-100">
            <Download size={14} /> Exportar Base
          </button>
        </div>
      </div>

      {/* Search Bar */}
      <div className="relative mb-8">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
        <input 
          type="text" 
          placeholder="Buscar por Nome, CPF ou Serial Number..." 
          className="w-full pl-12 pr-4 py-4 bg-white border border-slate-100 rounded-2xl shadow-sm focus:ring-2 focus:ring-emerald-500/20 outline-none font-bold text-slate-700 transition-all"
        />
      </div>

      {/* Clients Table */}
      <div className="bg-white border border-slate-100 rounded-2xl shadow-sm overflow-hidden">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-slate-50/50 border-b border-slate-100">
              <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Titular / Documento</th>
              <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Produto</th>
              <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Status</th>
              <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Vencimento</th>
              <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">Ações</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-50">
            {clients.map(client => (
              <tr key={client.id} className="hover:bg-slate-50/30 transition-colors group">
                <td className="px-6 py-5">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl bg-slate-100 flex items-center justify-center text-slate-500 group-hover:bg-emerald-100 group-hover:text-emerald-600 transition-all">
                      <User size={18} />
                    </div>
                    <div>
                      <p className="text-sm font-black text-slate-800 tracking-tight">{client.name}</p>
                      <p className="text-[10px] font-bold text-slate-400 uppercase">{client.cpf || client.cnpj}</p>
                    </div>
                  </div>
                </td>
                <td className="px-6 py-5">
                   <span className="text-xs font-bold text-slate-600 bg-slate-100 px-2 py-1 rounded-lg">{client.product}</span>
                </td>
                <td className="px-6 py-5">
                  <span className={`text-[10px] font-black px-2.5 py-1 rounded-full border uppercase tracking-tighter ${
                    client.status === 'ATIVO' ? 'bg-emerald-50 text-emerald-700 border-emerald-100' :
                    client.status === 'EXPIRADO' ? 'bg-amber-50 text-amber-700 border-amber-100' :
                    'bg-rose-50 text-rose-700 border-rose-100'
                  }`}>
                    {client.status}
                  </span>
                </td>
                <td className="px-6 py-5">
                  <div className="flex items-center gap-2 text-xs font-bold text-slate-500">
                    <Calendar size={14} className="opacity-40" />
                    {client.expires}
                  </div>
                </td>
                <td className="px-6 py-5 text-right">
                  <button className="text-[10px] font-black text-emerald-600 hover:text-emerald-800 uppercase tracking-widest bg-emerald-50/50 hover:bg-emerald-50 px-3 py-1.5 rounded-lg transition-all">
                    Visualizar
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Stats Summary */}
      <div className="grid grid-cols-3 gap-6 mt-8">
        <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm flex items-center gap-4">
           <div className="w-12 h-12 bg-emerald-50 rounded-2xl flex items-center justify-center text-emerald-600 border border-emerald-100">
             <ShieldCheck size={24} />
           </div>
           <div>
             <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Certificados Ativos</p>
             <p className="text-2xl font-black text-slate-800">1.284</p>
           </div>
        </div>
        {/* ... more stats */}
      </div>
    </div>
  );
}
