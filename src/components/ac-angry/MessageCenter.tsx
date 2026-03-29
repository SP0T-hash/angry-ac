import React from 'react';
import { Mail, Send, Bell, Star, Trash2, Search, User, CheckCircle2 } from 'lucide-react';

export default function MessageCenter() {
  const messages = [
    { id: 1, sender: 'Suporte VEMAPI', subject: 'Atualização de Normas ICP-Brasil', date: 'Hoje, 09:30', read: false },
    { id: 2, sender: 'Carlos Alberto Costa', subject: 'Dúvida sobre renovação e-CPF', date: 'Ontem, 14:20', read: true },
    { id: 3, sender: 'Sistema ANGRY', subject: 'Alerta: Certificado expira em 5 dias', date: '25/03/2026', read: true },
  ];

  return (
    <div className="flex h-[calc(100vh-140px)] bg-white border border-slate-100 rounded-3xl overflow-hidden shadow-sm animate-in fade-in duration-700">
      
      {/* Sidebar de Mensagens */}
      <div className="w-[320px] border-r border-slate-50 flex flex-col">
        <div className="p-6 border-b border-slate-50">
          <h3 className="text-xl font-black text-slate-800 mb-4 tracking-tight uppercase">Mensagens</h3>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={14} />
            <input type="text" placeholder="Buscar conversas..." className="w-full pl-9 pr-3 py-2.5 bg-slate-50 border-none rounded-xl text-xs font-bold focus:ring-2 focus:ring-emerald-500/20 outline-none" />
          </div>
        </div>
        
        <div className="flex-1 overflow-y-auto">
          {messages.map(msg => (
            <div key={msg.id} className={`p-5 border-b border-slate-50 cursor-pointer transition-all hover:bg-slate-50/50 ${!msg.read ? 'bg-emerald-50/20' : ''}`}>
              <div className="flex justify-between items-start mb-1">
                <span className={`text-[10px] font-black uppercase tracking-widest ${!msg.read ? 'text-emerald-700' : 'text-slate-400'}`}>
                  {msg.sender}
                </span>
                <span className="text-[9px] font-bold text-slate-300">{msg.date}</span>
              </div>
              <p className={`text-sm tracking-tight truncate ${!msg.read ? 'font-black text-slate-900' : 'font-bold text-slate-500'}`}>
                {msg.subject}
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* Área de Leitura */}
      <div className="flex-1 flex flex-col bg-slate-50/30">
        <div className="p-6 border-b border-white flex justify-between items-center bg-white/50 backdrop-blur-sm">
           <div className="flex items-center gap-4">
              <div className="w-10 h-10 rounded-2xl bg-emerald-600 text-white flex items-center justify-center font-black shadow-lg shadow-emerald-100">V</div>
              <div>
                <h4 className="text-sm font-black text-slate-900">VEMAPI Suporte Técnico</h4>
                <p className="text-[10px] font-bold text-emerald-600 uppercase">Verificado • Auditoria AC</p>
              </div>
           </div>
           <div className="flex items-center gap-2">
              <button className="p-2.5 bg-white border border-slate-100 rounded-xl text-slate-400 hover:text-rose-500 transition-all shadow-sm"><Trash2 size={16} /></button>
              <button className="p-2.5 bg-white border border-slate-100 rounded-xl text-slate-400 hover:text-emerald-600 transition-all shadow-sm"><Star size={16} /></button>
           </div>
        </div>

        <div className="flex-1 p-8 overflow-y-auto">
           <div className="bg-white p-8 rounded-3xl shadow-sm border border-slate-100 max-w-2xl mx-auto">
              <h2 className="text-xl font-black text-slate-800 mb-6 border-b border-slate-50 pb-4">Atualização de Normas ICP-Brasil</h2>
              <div className="space-y-4 text-sm font-bold text-slate-500 leading-relaxed">
                <p>Olá Vitor,</p>
                <p>Comunicamos que novas diretrizes de coleta biométrica entrarão em vigor a partir da próxima semana. Favor revisar os manuais na aba de Conformidade.</p>
                <p>Atenciosamente,<br/><span className="text-emerald-700">Equipe de Compliance VEMAPI</span></p>
              </div>
           </div>
        </div>

        <div className="p-6 bg-white/50 backdrop-blur-sm border-t border-white">
           <div className="max-w-2xl mx-auto flex gap-3">
              <input type="text" placeholder="Escrever resposta rápida..." className="flex-1 px-4 py-3 bg-white border border-slate-100 rounded-2xl text-xs font-bold outline-none focus:ring-2 focus:ring-emerald-500/10" />
              <button className="px-6 py-3 bg-emerald-700 text-white rounded-2xl flex items-center gap-2 font-black text-[10px] uppercase tracking-widest hover:bg-emerald-800 transition-all shadow-lg shadow-emerald-100">
                <Send size={14} /> Enviar
              </button>
           </div>
        </div>
      </div>

    </div>
  );
}
