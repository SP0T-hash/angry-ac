'use client';

import React, { useState, useEffect } from 'react';
import { 
  Shield, Users, Search, MessageSquare, Clock, CheckCircle2, 
  AlertTriangle, LogOut, ChevronRight, ChevronDown, X, Phone, ImagePlus, Save, LayoutDashboard
} from 'lucide-react';
import Link from 'next/link';
import { AnimatePresence, motion } from 'framer-motion';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'next/navigation';

export default function AdminDashboard() {
  const router = useRouter();
  const [adminUser, setAdminUser] = useState<any>(null);
  const [tickets, setTickets] = useState<any[]>([]);
  const [loadingTickets, setLoadingTickets] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  
  const [selectedTicket, setSelectedTicket] = useState<any>(null);
  const [adminResponse, setAdminResponse] = useState('');
  const [ticketStatus, setTicketStatus] = useState('');
  const [submitLoading, setSubmitLoading] = useState(false);

  useEffect(() => {
    const checkUser = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        router.push('/portal/login');
      } else {
        setAdminUser(session.user);
        fetchTickets();
      }
    };
    checkUser();
  }, [router]);

  const fetchTickets = async () => {
    setLoadingTickets(true);
    // Fetch ALL tickets because this is the admin view
    const { data, error } = await supabase
      .from('tickets')
      .select('*')
      .order('created_at', { ascending: false });
    
    if (data) setTickets(data);
    setLoadingTickets(false);
  };

  const handleUpdateTicket = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTicket) return;
    
    setSubmitLoading(true);
    const { error } = await supabase
      .from('tickets')
      .update({ 
        admin_response: adminResponse,
        status: ticketStatus
      })
      .eq('id', selectedTicket.id);

    setSubmitLoading(false);
    
    if (!error) {
      setSelectedTicket(null);
      fetchTickets(); // Refresh list to show new status
      alert('Chamado respondido! O cliente já consegue ver essa atualização no portal dele.');
    } else {
      alert("Erro ao atualizar chamado: " + error.message);
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push('/portal/login');
  };

  const openTicketModal = (ticket: any) => {
    setSelectedTicket(ticket);
    setTicketStatus(ticket.status || 'Em Análise');
    setAdminResponse(ticket.admin_response || '');
  };

  const displayedTickets = tickets.filter(t => 
    t.title?.toLowerCase().includes(searchTerm.toLowerCase()) || 
    t.id?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    t.category?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const pendingTicketsCount = tickets.filter(t => t.status !== 'Resolvido').length;
  const resolvedTicketsCount = tickets.filter(t => t.status === 'Resolvido').length;

  return (
    <div className="min-h-screen bg-[#020617] flex flex-col md:flex-row font-sans selection:bg-[#10b981]/30">
      
      {/* SIDEBAR */}
      <aside className="w-full md:w-64 border-r border-white/10 bg-[#020617]/50 backdrop-blur-xl p-6 flex flex-col hidden md:flex sticky top-0 h-screen">
        <Link href="/admin/dashboard" className="flex items-center gap-3 mb-12 group">
          <div className="w-10 h-10 bg-[#10b981] rounded-xl flex items-center justify-center group-hover:shadow-[0_0_15px_rgba(16,185,129,0.5)] transition-all">
            <Shield size={20} fill="white" className="text-white" />
          </div>
          <div className="flex flex-col">
            <span className="text-xl font-black tracking-tighter uppercase italic leading-none text-white">VEMAPI</span>
            <span className="text-[7px] tracking-[0.4em] font-bold uppercase leading-none mt-1 text-[#10b981]">Equipe Admin</span>
          </div>
        </Link>

        <nav className="flex-1 space-y-2">
          <a href="#" className="flex items-center gap-3 px-4 py-3 bg-[#10b981]/10 text-[#10b981] rounded-xl text-xs font-black uppercase tracking-widest border border-[#10b981]/20">
            <LayoutDashboard size={16} /> Gestão Total
          </a>
        </nav>

        <div className="mt-auto border-t border-white/10 pt-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-8 h-8 rounded-full bg-slate-800 flex items-center justify-center text-xs font-bold text-white border border-white/10">
              {adminUser?.email?.charAt(0).toUpperCase() || 'A'}
            </div>
            <div className="overflow-hidden">
              <p className="text-xs font-bold text-white uppercase truncate">{adminUser?.email?.split('@')[0] || 'Admin'}</p>
              <p className="text-[10px] text-[#10b981] uppercase tracking-widest truncate">Suporte VEMAPI</p>
            </div>
          </div>
          <button onClick={handleLogout} className="flex items-center gap-2 text-[10px] text-slate-400 hover:text-red-400 font-bold uppercase tracking-widest transition-colors">
            <LogOut size={14} /> Sair do Painel
          </button>
        </div>
      </aside>

      {/* HEADER MOBILE */}
      <header className="md:hidden flex items-center justify-between p-4 border-b border-white/10 bg-[#020617]/80 backdrop-blur-md sticky top-0 z-50">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-[#10b981] rounded-lg flex items-center justify-center">
            <Shield size={16} fill="white" className="text-white" />
          </div>
          <span className="text-sm font-black tracking-tighter uppercase italic text-white flex flex-col leading-none">VEMAPI <span className="text-[6px] text-[#10b981] tracking-[0.3em] font-normal not-italic mt-0.5">ADMIN</span></span>
        </div>
        <button onClick={handleLogout} className="w-8 h-8 rounded-full bg-slate-800 flex items-center justify-center text-xs font-bold text-white border border-white/10">
          {adminUser?.email?.charAt(0).toUpperCase() || 'A'}
        </button>
      </header>

      {/* ÁREA PRINCIPAL */}
      <main className="flex-1 p-6 lg:p-12 overflow-y-auto w-full">
        <div className="max-w-6xl mx-auto space-y-8">
          
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <h1 className="text-2xl md:text-3xl font-black uppercase tracking-tight text-white mb-2">Central de Suporte</h1>
              <p className="text-sm text-slate-400">Painel administrativo para gestão e resposta dos chamados.</p>
            </div>
          </div>

          {/* DASHBOARD CARDS */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-amber-500/5 border border-amber-500/20 rounded-2xl p-5 flex items-center gap-4">
              <div className="w-12 h-12 rounded-full bg-amber-500/10 text-amber-500 flex items-center justify-center">
                <AlertTriangle size={20} />
              </div>
              <div>
                <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Chamados Pendentes</p>
                <p className="text-2xl font-black text-white mt-1">{pendingTicketsCount < 10 ? `0${pendingTicketsCount}` : pendingTicketsCount}</p>
              </div>
            </div>
            <div className="bg-emerald-500/5 border border-emerald-500/20 rounded-2xl p-5 flex items-center gap-4">
              <div className="w-12 h-12 rounded-full bg-emerald-500/10 text-[#10b981] flex items-center justify-center">
                <CheckCircle2 size={20} />
              </div>
              <div>
                <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Resolvidos Geral</p>
                <p className="text-2xl font-black text-white mt-1">{resolvedTicketsCount < 10 ? `0${resolvedTicketsCount}` : resolvedTicketsCount}</p>
              </div>
            </div>
            <div className="bg-white/5 border border-white/10 rounded-2xl p-5 flex items-center gap-4">
              <div className="w-12 h-12 rounded-full bg-blue-500/10 text-blue-400 flex items-center justify-center">
                <Users size={20} />
              </div>
              <div>
                <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Total de Registros</p>
                <p className="text-2xl font-black text-white mt-1">{tickets.length < 10 ? `0${tickets.length}` : tickets.length}</p>
              </div>
            </div>
          </div>

          {/* LISTA DE CHAMADOS GERAL */}
          <div className="bg-[#0f172a]/50 border border-white/10 rounded-[24px] overflow-hidden backdrop-blur-xl">
            <div className="p-6 md:p-8 border-b border-white/5 flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <h3 className="text-lg font-black uppercase tracking-wider text-white">Todos os Tíquetes</h3>
                <p className="text-xs text-slate-500 tracking-wide mt-1">Fila global de atendimento aos clientes</p>
              </div>
              
              <div className="flex items-center gap-2">
                <div className="relative">
                  <input 
                    type="text" 
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    placeholder="Buscar por ID, Categoria..." 
                    className="bg-black/20 border border-white/10 rounded-lg py-2 pl-3 pr-8 text-xs text-white placeholder-slate-500 outline-none focus:border-[#10b981] w-full md:w-64 transition-all" 
                  />
                  <Search size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500" />
                </div>
              </div>
            </div>
            
            <div className="divide-y divide-white/5">
              {loadingTickets ? (
                <div className="p-12 text-center flex flex-col items-center justify-center gap-4">
                  <div className="w-8 h-8 rounded-full border-t-2 border-r-2 border-[#10b981] animate-spin"></div>
                  <span className="text-slate-500 text-xs font-black uppercase tracking-widest mt-2">Carregando banco de dados...</span>
                </div>
              ) : displayedTickets.length === 0 ? (
                <div className="p-16 text-center flex flex-col items-center justify-center">
                  <div className="w-16 h-16 rounded-full bg-slate-800/50 text-slate-600 flex items-center justify-center mb-4 border border-white/5">
                    <Shield size={28} />
                  </div>
                  <h4 className="text-white font-black uppercase tracking-wider mb-2">Fila limpa!</h4>
                  <p className="text-xs text-slate-500 max-w-xs">Nenhum chamado pendente ou correspondente à sua busca.</p>
                </div>
              ) : (
                displayedTickets.map((ticket, i) => (
                  <div key={ticket.id || i} onClick={() => openTicketModal(ticket)} className="p-5 md:p-6 hover:bg-white/5 transition-all cursor-pointer group flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div className="flex items-start gap-4 md:gap-6 w-full">
                      <div className="w-12 h-12 rounded-xl bg-[#020617] backdrop-blur-md border border-white/10 flex flex-col items-center justify-center flex-shrink-0 group-hover:border-[#10b981] transition-all">
                        <span className="text-[8px] text-slate-500 font-bold uppercase tracking-widest mb-0.5">ID</span>
                        <span className="text-[10px] text-white font-black">{ticket.id.substring(0,4).toUpperCase()}</span>
                      </div>
                      
                      <div className="flex-1 min-w-0">
                        <div className="flex flex-wrap items-center gap-2 mb-2">
                          <span className={`px-2.5 py-1 rounded-md text-[9px] font-black uppercase tracking-widest border ${
                            ticket.priority === 'Baixa' ? 'bg-slate-800 text-slate-300 border-slate-700' :
                            ticket.priority === 'Média' ? 'bg-blue-500/10 text-blue-400 border-blue-500/20' :
                            ticket.priority === 'Alta' ? 'bg-orange-500/10 text-orange-400 border-orange-500/20' :
                            'bg-red-500/10 text-red-500 border-red-500/20'
                          }`}>
                            {ticket.priority}
                          </span>
                          <span className="text-[10px] text-slate-400 font-bold flex items-center gap-1.5 bg-black/30 px-2 py-1 rounded-md">
                            <Clock size={10} /> {new Date(ticket.created_at).toLocaleDateString('pt-BR')}
                          </span>
                        </div>
                        <h4 className="text-sm font-black text-white tracking-wide truncate pr-4 group-hover:text-[#10b981] transition-colors">{ticket.title}</h4>
                        <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider truncate mt-1">{ticket.category}</p>
                      </div>
                    </div>
                    
                    <div className="flex items-center justify-between w-full md:w-auto md:flex-shrink-0 gap-4 mt-2 md:mt-0 pt-4 md:pt-0 border-t border-white/5 md:border-0">
                      <div className={`px-4 py-2 rounded-lg text-[10px] font-black uppercase tracking-widest border flex items-center justify-center ${
                          ticket.status === 'Em Análise' ? 'bg-amber-500/10 text-amber-500 border-amber-500/20' :
                          ticket.status === 'Respondido' ? 'bg-blue-500/10 text-blue-400 border-blue-500/20' :
                          ticket.status === 'Resolvido' ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20' :
                          'bg-slate-800 text-slate-300 border-slate-700'
                      }`}>
                        {ticket.status}
                      </div>
                      <ChevronRight size={16} className="text-slate-600 group-hover:text-[#10b981] transition-colors" />
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </main>

      {/* MODAL ADMIN PARA RESPONDER CHAMADOS */}
      <AnimatePresence>
        {selectedTicket && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 md:p-6">
            <motion.div 
              initial={{ opacity: 0 }} 
              animate={{ opacity: 1 }} 
              exit={{ opacity: 0 }}
              onClick={() => setSelectedTicket(null)}
              className="absolute inset-0 bg-[#020617]/90 backdrop-blur-md"
            ></motion.div>
            
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 20 }} 
              animate={{ opacity: 1, scale: 1, y: 0 }} 
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="w-full max-w-5xl bg-[#0a0f1c] border border-white/10 rounded-[32px] shadow-2xl shadow-black/50 overflow-hidden relative z-10 flex flex-col h-[90vh] md:h-[85vh]"
            >
              {/* HEADER DO MODAL */}
              <div className="p-6 md:px-10 md:py-6 border-b border-white/5 flex flex-col md:flex-row md:items-center justify-between gap-6 bg-gradient-to-r from-[#10b981]/10 to-transparent">
                <div>
                  <div className="flex items-center gap-3 mb-3">
                    <span className="text-slate-400 text-[10px] font-black uppercase tracking-widest bg-black/40 px-3 py-1.5 rounded-full border border-white/5">
                      ID: <span className="text-white">{selectedTicket.id.substring(0,8).toUpperCase()}</span>
                    </span>
                    <span className={`px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest border ${
                      selectedTicket.status === 'Em Análise' ? 'bg-amber-500/10 text-amber-500 border-amber-500/20' :
                      selectedTicket.status === 'Respondido' ? 'bg-blue-500/10 text-blue-400 border-blue-500/20 shadow-[0_0_15px_rgba(59,130,246,0.2)]' :
                      selectedTicket.status === 'Resolvido' ? 'bg-emerald-500/10 text-[#10b981] border-emerald-500/20 shadow-[0_0_15px_rgba(16,185,129,0.2)]' :
                      'bg-slate-800 text-slate-300 border-slate-700'
                    }`}>
                      {selectedTicket.status}
                    </span>
                  </div>
                  <h2 className="text-2xl md:text-3xl font-black uppercase tracking-tight text-white pr-8">{selectedTicket.title}</h2>
                </div>
                <button 
                  onClick={() => setSelectedTicket(null)}
                  className="absolute top-6 right-6 md:static w-12 h-12 rounded-full bg-white/5 hover:bg-red-500/20 hover:text-red-500 flex items-center justify-center text-slate-400 transition-all flex-shrink-0"
                >
                  <X size={20} />
                </button>
              </div>

              {/* CORPO DO MODAL */}
              <div className="flex flex-col md:flex-row flex-1 overflow-hidden">
                
                {/* LADO ESQUERDO: INFOS DO CHAMADO (CLIENTE) */}
                <div className="w-full md:w-1/2 p-6 md:p-10 overflow-y-auto custom-scrollbar border-r border-white/5 bg-[#020617]/50 relative">
                  
                  {/* Cards de info */}
                  <div className="grid grid-cols-2 gap-4 mb-8">
                     <div className="bg-white/5 p-5 rounded-2xl border border-white/10 hover:border-[#10b981]/30 transition-colors shadow-inner">
                       <p className="text-[10px] font-black uppercase tracking-widest text-[#10b981] mb-2 flex items-center gap-2">
                         <LayoutDashboard size={12} /> Categoria
                       </p>
                       <p className="text-xs md:text-sm font-bold text-white truncate" title={selectedTicket.category}>{selectedTicket.category}</p>
                     </div>
                     <div className="bg-white/5 p-5 rounded-2xl border border-white/10 hover:border-[#10b981]/30 transition-colors shadow-inner">
                       <p className="text-[10px] font-black uppercase tracking-widest text-[#10b981] mb-2 flex items-center gap-2">
                         <Phone size={12} /> Contato
                       </p>
                       <p className="text-xs md:text-sm font-bold text-white truncate">{selectedTicket.phone || 'Não informado'}</p>
                     </div>
                  </div>

                  <div className="space-y-4 mb-8">
                    <h3 className="text-xs font-black uppercase tracking-widest text-slate-400 border-b border-white/10 pb-3 flex items-center gap-2">
                      <MessageSquare size={14} className="text-slate-500" />
                      Problema relatado pelo Cliente
                    </h3>
                    <div className="bg-black/40 rounded-2xl p-6 border border-white/5 shadow-inner">
                      <p className="text-sm text-slate-300 whitespace-pre-wrap leading-relaxed">{selectedTicket.description}</p>
                    </div>
                  </div>

                  {selectedTicket.attachment && (
                    <div className="space-y-4 pb-8">
                      <h3 className="text-xs font-black uppercase tracking-widest text-slate-400 border-b border-white/10 pb-3 flex items-center gap-2">
                        <ImagePlus size={14} className="text-slate-500" />
                        Anexo do Cliente (Print/Foto)
                      </h3>
                      <div className="rounded-2xl overflow-hidden border border-white/10 bg-black/60 p-2 group relative">
                        <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center pointer-events-none z-10">
                          <span className="bg-[#10b981] text-white text-xs font-bold px-4 py-2 rounded-full shadow-lg">Clique para Ampliar</span>
                        </div>
                        <img 
                           src={selectedTicket.attachment} 
                           alt="Anexo do chamado" 
                           className="w-full h-auto object-contain max-h-[350px] rounded-xl cursor-zoom-in transition-transform duration-500 group-hover:scale-[1.02]" 
                           onClick={() => window.open(selectedTicket.attachment, '_blank')} 
                        />
                      </div>
                    </div>
                  )}
                </div>

                {/* LADO DIREITO: RESPOSTA DO ADMIN (SUPORTE) */}
                <div className="w-full md:w-1/2 bg-gradient-to-b from-[#10b981]/5 to-[#020617] p-6 md:p-10 flex flex-col h-full overflow-y-auto custom-scrollbar">
                  
                  <div className="mb-8 flex items-center gap-4 bg-black/20 p-5 rounded-2xl border border-[#10b981]/20">
                    <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-[#10b981] to-emerald-600 flex items-center justify-center shadow-[0_0_15px_rgba(16,185,129,0.3)]">
                      <Shield size={20} className="text-white" />
                    </div>
                    <div>
                      <h3 className="text-base font-black uppercase tracking-wide text-white">Painel de Resolução</h3>
                      <p className="text-xs text-[#10b981] mt-0.5 font-medium">Trate e responda este ticket abaixo</p>
                    </div>
                  </div>

                  <form onSubmit={handleUpdateTicket} className="flex flex-col flex-1 space-y-6">
                    
                    <div className="space-y-3">
                      <label className="text-[10px] font-black uppercase tracking-widest text-[#10b981] pl-1 drop-shadow-[0_0_8px_rgba(16,185,129,0.5)]">1. Ação / Status do Ticket</label>
                      <div className="relative group">
                        <select 
                          value={ticketStatus} 
                          onChange={(e) => setTicketStatus(e.target.value)}
                          className="w-full bg-black/40 border border-white/10 text-white p-5 rounded-2xl outline-none focus:border-[#10b981] focus:ring-2 focus:ring-[#10b981]/20 transition-all text-sm appearance-none cursor-pointer group-hover:border-white/20 relative z-10"
                        >
                          <option value="Em Análise" className="bg-[#0f172a] text-slate-300">Em Análise (Investigando o problema)</option>
                          <option value="Respondido" className="bg-[#0f172a] text-blue-400">Respondido (Aguardando Cliente)</option>
                          <option value="Resolvido" className="bg-[#0f172a] text-[#10b981]">Resolvido (Problema Fechado)</option>
                        </select>
                        <div className="absolute right-5 top-1/2 -translate-y-1/2 w-8 h-8 bg-white/5 rounded-full flex items-center justify-center group-hover:bg-[#10b981]/20 transition-colors z-20 pointer-events-none">
                          <ChevronDown size={14} className="text-[#10b981]" />
                        </div>
                      </div>
                    </div>

                    <div className="space-y-3 flex-1 flex flex-col">
                      <label className="text-[10px] font-black uppercase tracking-widest text-[#10b981] pl-1 drop-shadow-[0_0_8px_rgba(16,185,129,0.5)]">2. Resposta Técnica ao Cliente</label>
                      <textarea 
                        value={adminResponse} 
                        onChange={(e) => setAdminResponse(e.target.value)}
                        placeholder="Escreva de forma clara a solução ou as instruções. O cliente verá este texto decorado no painel dele..." 
                        className="w-full flex-1 min-h-[200px] bg-black/40 border border-white/10 placeholder-slate-600 text-white p-5 rounded-2xl outline-none focus:border-[#10b981] focus:ring-2 focus:ring-[#10b981]/20 transition-all text-sm resize-none custom-scrollbar shadow-inner"
                      ></textarea>
                    </div>

                    <button 
                      type="submit" 
                      disabled={submitLoading} 
                      className="w-full py-5 mt-auto bg-gradient-to-r from-[#10b981] to-emerald-500 text-white rounded-2xl font-black uppercase tracking-[0.2em] text-[11px] md:text-xs shadow-[0_0_20px_rgba(16,185,129,0.3)] hover:shadow-[0_0_30px_rgba(16,185,129,0.5)] hover:-translate-y-1 transition-all duration-300 flex items-center justify-center gap-3 disabled:opacity-50 disabled:hover:translate-y-0 disabled:shadow-none"
                    >
                      {submitLoading ? (
                         <>
                           <div className="w-5 h-5 rounded-full border-t-2 border-r-2 border-white animate-spin"></div>
                           <span>APLICANDO ALTERAÇÕES...</span>
                         </>
                      ) : (
                         <>
                           <Save size={18} /> ATUALIZAR STATUS E ENVIAR
                         </>
                      )}
                    </button>
                  </form>

                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
