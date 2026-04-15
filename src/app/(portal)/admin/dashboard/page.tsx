'use client';

import React, { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { 
  LayoutDashboard, 
  Users, 
  MessageSquare, 
  LogOut, 
  Search, 
  ChevronRight, 
  Shield, 
  AlertTriangle, 
  CheckCircle2, 
  X,
  Save
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';

export default function AdminDashboard() {
  const [tickets, setTickets] = useState<any[]>([]);
  const [loadingTickets, setLoadingTickets] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedTicket, setSelectedTicket] = useState<any>(null);
  const [adminResponse, setAdminResponse] = useState('');
  const [ticketStatus, setTicketStatus] = useState('');
  const [submitLoading, setSubmitLoading] = useState(false);
  const [adminUser, setAdminUser] = useState<any>(null);
  const router = useRouter();

  useEffect(() => {
    checkAdmin();
    fetchTickets();
  }, []);

  const checkAdmin = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      router.push('/portal/login');
      return;
    }
    setAdminUser(user);
  };

  const fetchTickets = async () => {
    setLoadingTickets(true);
    try {
      const { data, error } = await supabase
        .from('tickets')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setTickets(data || []);
    } catch (error: any) {
      console.error('Erro ao buscar chamados:', error.message);
    } finally {
      setLoadingTickets(false);
    }
  };

  const handleUpdateTicket = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTicket) return;
    
    setSubmitLoading(true);
    try {
      const { error } = await supabase
        .from('tickets')
        .update({ 
          admin_response: adminResponse,
          status: ticketStatus
        })
        .eq('id', selectedTicket.id);
  
      if (error) throw error;

      // Aqui poderíamos adicionar uma notificação de sucesso
      setSelectedTicket(null);
      fetchTickets();
    } catch (error: any) {
      alert("Erro ao atualizar chamado: " + error.message);
    } finally {
      setSubmitLoading(false);
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
    (t.title?.toLowerCase().includes(searchTerm.toLowerCase()) || 
    t.id?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    t.category?.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const pendingTicketsCount = tickets.filter(t => t.status !== 'Resolvido').length;
  const resolvedTicketsCount = tickets.filter(t => t.status === 'Resolvido').length;

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col md:flex-row font-sans selection:bg-emerald-500/30 text-slate-900">
      
      {/* SIDEBAR */}
      <aside className="w-full md:w-64 border-r border-slate-200 bg-white p-6 flex flex-col hidden md:flex sticky top-0 h-screen shadow-sm">
        <Link href="/admin/dashboard" className="flex items-center gap-3 mb-10 group">
          <div className="w-10 h-10 bg-emerald-600 rounded-xl flex items-center justify-center shadow-md">
            <Shield size={20} className="text-white fill-white" />
          </div>
          <div className="flex flex-col">
            <span className="text-xl font-black tracking-tight uppercase italic leading-none text-slate-900">VEMAPI</span>
            <span className="text-[7px] tracking-[0.4em] font-bold uppercase leading-none mt-1 text-emerald-600">Admin Panel</span>
          </div>
        </Link>

        <nav className="flex-1 space-y-1">
          <a href="#" className="flex items-center gap-3 px-4 py-3 bg-emerald-50 text-emerald-700 rounded-xl text-xs font-bold uppercase tracking-wider">
            <LayoutDashboard size={18} /> Dashboard
          </a>
          <a href="#" className="flex items-center gap-3 px-4 py-3 text-slate-600 hover:bg-slate-50 rounded-xl text-xs font-bold uppercase tracking-wider transition-colors">
            <Users size={18} /> Usuários
          </a>
          <a href="#" className="flex items-center gap-3 px-4 py-3 text-slate-600 hover:bg-slate-50 rounded-xl text-xs font-bold uppercase tracking-wider transition-colors">
            <MessageSquare size={18} /> Chamados
          </a>
        </nav>

        <div className="mt-auto border-t border-slate-100 pt-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-full bg-emerald-100 flex items-center justify-center text-sm font-bold text-emerald-700 border border-emerald-200">
              {adminUser?.email?.charAt(0).toUpperCase() || 'A'}
            </div>
            <div className="overflow-hidden">
              <p className="text-xs font-bold text-slate-900 uppercase truncate">{adminUser?.email?.split('@')[0] || 'Admin'}</p>
              <p className="text-[10px] text-slate-500 uppercase tracking-widest truncate">Suporte</p>
            </div>
          </div>
          <button onClick={handleLogout} className="w-full flex items-center justify-center gap-2 py-3 bg-slate-50 text-slate-600 hover:text-red-600 hover:bg-red-50 rounded-xl text-[10px] font-bold uppercase tracking-widest transition-all">
            <LogOut size={14} /> Sair
          </button>
        </div>
      </aside>

      {/* HEADER MOBILE */}
      <header className="md:hidden flex items-center justify-between p-4 border-b border-slate-200 bg-white sticky top-0 z-50">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-emerald-600 rounded-lg flex items-center justify-center shadow-sm">
            <Shield size={16} fill="white" className="text-white" />
          </div>
          <span className="text-sm font-black tracking-tighter uppercase italic text-slate-900">VEMAPI ADMIN</span>
        </div>
        <button onClick={handleLogout} className="p-2 text-slate-500">
          <LogOut size={20} />
        </button>
      </header>

      {/* ÁREA PRINCIPAL */}
      <main className="flex-1 p-6 lg:p-10 overflow-y-auto w-full max-w-[1600px] mx-auto">
        <div className="space-y-8">
          
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-200 pb-8">
            <div>
              <h1 className="text-3xl font-black uppercase tracking-tight text-slate-900 mb-1">Central de Atendimento</h1>
              <p className="text-sm text-slate-500">Gerencie as solicitações e tickets de suporte dos clientes.</p>
            </div>
            
            <div className="flex items-center gap-4">
               <div className="relative group">
                  <input 
                    type="text" 
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    placeholder="Buscar ticket..." 
                    className="bg-white border border-slate-200 rounded-2xl py-3 pl-4 pr-10 text-sm outline-none focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/5 w-full md:w-80 transition-all shadow-sm" 
                  />
                  <Search size={18} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-emerald-500 transition-colors" />
                </div>
            </div>
          </div>

          {/* DASHBOARD CARDS */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm hover:shadow-md transition-shadow">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center">
                  <AlertTriangle size={24} />
                </div>
                <div>
                  <p className="text-[11px] font-black uppercase tracking-widest text-slate-400">Pendentes</p>
                  <p className="text-3xl font-black text-slate-900 leading-none mt-1">{pendingTicketsCount}</p>
                </div>
              </div>
            </div>

            <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm hover:shadow-md transition-shadow">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
                  <CheckCircle2 size={24} />
                </div>
                <div>
                  <p className="text-[11px] font-black uppercase tracking-widest text-slate-400">Resolvidos</p>
                  <p className="text-3xl font-black text-slate-900 leading-none mt-1">{resolvedTicketsCount}</p>
                </div>
              </div>
            </div>

            <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm hover:shadow-md transition-shadow">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center">
                  <Users size={24} />
                </div>
                <div>
                  <p className="text-[11px] font-black uppercase tracking-widest text-slate-400">Total Geral</p>
                  <p className="text-3xl font-black text-slate-900 leading-none mt-1">{tickets.length}</p>
                </div>
              </div>
            </div>
          </div>

          {/* LISTA DE CHAMADOS GERAL */}
          <div className="bg-white border border-slate-200 rounded-[32px] overflow-hidden shadow-sm border-separate">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50/50 border-b border-slate-100">
                    <th className="px-6 py-5 text-[10px] font-black uppercase tracking-widest text-slate-400 w-24">ID</th>
                    <th className="px-6 py-5 text-[10px] font-black uppercase tracking-widest text-slate-400">Cliente / Ticket</th>
                    <th className="px-6 py-5 text-[10px] font-black uppercase tracking-widest text-slate-400 hidden lg:table-cell">Categoria</th>
                    <th className="px-6 py-5 text-[10px] font-black uppercase tracking-widest text-slate-400 text-center">Status</th>
                    <th className="px-6 py-5 text-[10px] font-black uppercase tracking-widest text-slate-400 text-right">Ação</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {loadingTickets ? (
                    <tr>
                      <td colSpan={5} className="py-20 text-center">
                        <div className="inline-block w-8 h-8 rounded-full border-2 border-emerald-500 border-t-transparent animate-spin"></div>
                      </td>
                    </tr>
                  ) : displayedTickets.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="py-32 text-center">
                        <div className="flex flex-col items-center">
                           <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center text-slate-300 mb-4">
                              <Search size={32} />
                           </div>
                           <p className="font-bold text-slate-400 uppercase text-xs tracking-widest">Nenhum chamado encontrado</p>
                        </div>
                      </td>
                    </tr>
                  ) : (
                    displayedTickets.map((ticket) => (
                      <tr key={ticket.id} onClick={() => openTicketModal(ticket)} className="hover:bg-slate-50/80 cursor-pointer transition-colors group">
                        <td className="px-6 py-6">
                           <span className="font-mono text-xs text-slate-400 font-bold">#{ticket.id.substring(0,4).toUpperCase()}</span>
                        </td>
                        <td className="px-6 py-6">
                           <div className="flex flex-col">
                              <span className="text-sm font-bold text-slate-900 group-hover:text-emerald-600 transition-colors uppercase tracking-tight">{ticket.title}</span>
                              <span className="text-[10px] text-slate-500 font-medium">{new Date(ticket.created_at).toLocaleString('pt-BR')}</span>
                           </div>
                        </td>
                        <td className="px-6 py-6 hidden lg:table-cell">
                           <span className="px-3 py-1 bg-slate-100 text-slate-600 rounded-full text-[10px] font-bold uppercase tracking-wider">{ticket.category}</span>
                        </td>
                        <td className="px-6 py-6">
                           <div className="flex justify-center">
                              <span className={`px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest inline-flex items-center gap-2 ${
                                 ticket.status === 'Em Análise' ? 'bg-amber-100 text-amber-700' :
                                 ticket.status === 'Respondido' ? 'bg-blue-100 text-blue-700' :
                                 ticket.status === 'Resolvido' ? 'bg-emerald-100 text-emerald-700' :
                                 'bg-slate-100 text-slate-600'
                              }`}>
                                {ticket.status}
                              </span>
                           </div>
                        </td>
                        <td className="px-6 py-6 text-right">
                           <div className="inline-flex items-center justify-center w-10 h-10 rounded-full bg-slate-50 text-slate-400 group-hover:bg-emerald-600 group-hover:text-white transition-all shadow-sm">
                              <ChevronRight size={18} />
                           </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </main>

      {/* MODAL ADMIN */}
      <AnimatePresence>
        {selectedTicket && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 md:p-6 lg:p-10">
            <motion.div 
              initial={{ opacity: 0 }} 
              animate={{ opacity: 1 }} 
              exit={{ opacity: 0 }}
              onClick={() => setSelectedTicket(null)}
              className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
            ></motion.div>
            
            <motion.div 
              initial={{ opacity: 0, scale: 0.98, y: 10 }} 
              animate={{ opacity: 1, scale: 1, y: 0 }} 
              exit={{ opacity: 0, scale: 0.98, y: 10 }}
              className="w-full max-w-6xl bg-white rounded-[40px] shadow-2xl shadow-slate-900/10 overflow-hidden relative z-10 flex flex-col h-[85vh]"
            >
              <div className="flex-1 flex flex-col md:flex-row overflow-hidden">
                {/* Lado Esquerdo - Detalhes */}
                <div className="w-full md:w-2/5 p-8 lg:p-12 overflow-y-auto border-r border-slate-100 flex flex-col">
                   <div className="flex items-center justify-between mb-8">
                     <span className="px-4 py-1.5 bg-emerald-50 text-emerald-700 rounded-full text-[10px] font-bold uppercase tracking-widest border border-emerald-100">
                       Ticket #{selectedTicket.id.substring(0,8).toUpperCase()}
                     </span>
                     <button onClick={() => setSelectedTicket(null)} className="md:hidden p-2 text-slate-400">
                        <X size={24} />
                     </button>
                   </div>

                   <h2 className="text-3xl font-black text-slate-900 uppercase tracking-tight mb-8 leading-tight">{selectedTicket.title}</h2>
                   
                   <div className="space-y-8">
                      <div>
                        <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-3">Mensagem do Cliente</h4>
                        <div className="bg-slate-50 rounded-3xl p-6 text-sm text-slate-600 leading-relaxed font-medium">
                          {selectedTicket.description}
                        </div>
                      </div>

                      {selectedTicket.attachment && (
                        <div>
                          <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-3">Anexo</h4>
                          <div className="rounded-3xl overflow-hidden border border-slate-100">
                             <img src={selectedTicket.attachment} alt="Anexo" className="w-full h-auto cursor-zoom-in" onClick={() => window.open(selectedTicket.attachment, '_blank')} />
                          </div>
                        </div>
                      )}

                      <div className="grid grid-cols-2 gap-4">
                        <div className="bg-slate-50 p-5 rounded-3xl">
                           <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Contato</p>
                           <p className="text-xs font-bold text-slate-700">{selectedTicket.phone || '(00) 00000-0000'}</p>
                        </div>
                        <div className="bg-slate-50 p-5 rounded-3xl">
                           <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Abertura</p>
                           <p className="text-xs font-bold text-slate-700">{new Date(selectedTicket.created_at).toLocaleDateString('pt-BR')}</p>
                        </div>
                      </div>
                   </div>
                </div>

                {/* Lado Direito - Ação */}
                <div className="flex-1 p-8 lg:p-12 bg-slate-50/50 flex flex-col relative">
                  <button onClick={() => setSelectedTicket(null)} className="hidden md:flex absolute top-8 right-8 w-12 h-12 bg-white rounded-full items-center justify-center text-slate-400 hover:text-slate-900 shadow-sm transition-all">
                    <X size={20} />
                  </button>

                  <div className="mb-10">
                    <h3 className="text-xl font-black text-slate-900 uppercase tracking-tight">Responder Chamado</h3>
                    <p className="text-sm text-slate-500 mt-1">Atualize o status e envie uma nota técnica.</p>
                  </div>

                  <form onSubmit={handleUpdateTicket} className="flex-1 flex flex-col space-y-8">
                    <div className="space-y-3">
                      <label className="text-[10px] font-black uppercase tracking-widest text-slate-900 ml-1">Alterar Status</label>
                      <select 
                        value={ticketStatus} 
                        onChange={(e) => setTicketStatus(e.target.value)}
                        className="w-full bg-white border border-slate-200 text-slate-900 p-5 rounded-3xl outline-none focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/5 transition-all text-sm font-bold uppercase tracking-wide appearance-none cursor-pointer"
                      >
                        <option value="Em Análise">Em Análise</option>
                        <option value="Respondido">Respondido</option>
                        <option value="Resolvido">Resolvido</option>
                      </select>
                    </div>

                    <div className="space-y-3 flex-1 flex flex-col">
                      <label className="text-[10px] font-black uppercase tracking-widest text-slate-900 ml-1">Observação do Suporte</label>
                      <textarea 
                        value={adminResponse} 
                        onChange={(e) => setAdminResponse(e.target.value)}
                        placeholder="Digite aqui..." 
                        className="w-full flex-1 bg-white border border-slate-200 text-slate-900 p-6 rounded-[32px] outline-none focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/5 transition-all text-sm font-medium resize-none shadow-sm"
                      ></textarea>
                    </div>

                    <button 
                      type="submit" 
                      disabled={submitLoading} 
                      className="w-full py-6 bg-slate-900 text-white rounded-3xl font-black uppercase tracking-[0.2em] text-xs shadow-xl shadow-slate-900/20 hover:bg-emerald-600 hover:shadow-emerald-600/30 transition-all duration-300 flex items-center justify-center gap-3 disabled:opacity-50"
                    >
                      {submitLoading ? (
                        <>
                          <div className="w-5 h-5 rounded-full border-t-2 border-r-2 border-white animate-spin"></div>
                          <span>APLICANDO ALTERAÇÕES...</span>
                        </>
                      ) : (
                        <>
                          <Save size={20} /> Salvar Alterações
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
