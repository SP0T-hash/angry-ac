"use client";

import React, { useState, useEffect } from 'react';
import { 
  Zap, Bell, Plus, MessageSquare, Clock, CheckCircle2, 
  AlertTriangle, MonitorCog, Shield, HeartHandshake, LogOut, ChevronRight, X, Phone, ImagePlus
} from 'lucide-react';
import Link from 'next/link';
import { AnimatePresence, motion } from 'framer-motion';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'next/navigation';

const MOCK_ANNOUNCEMENT = {
  title: 'Manutenção Programada',
  message: 'Atualização do sistema de servidores na quinta-feira das 23:00 às 02:00. Algumas instabilidades podem ocorrer.',
  type: 'warning',
  date: '12/03/2026'
};

const SUBCATEGORIES = {
  cliente: [
    { id: 'duvida', label: 'Dúvida Geral' },
    { id: 'financeiro', label: 'Financeiro / Pagamentos' },
    { id: 'acesso', label: 'Problema de Acesso' }
  ],
  agro: [
    { id: 'operacao', label: 'Máquinas / Operação' },
    { id: 'logistica', label: 'Logística / Entregas' },
    { id: 'sistema', label: 'Erro no Sistema' }
  ],
  ti: [
    { id: 'auditoria', label: 'Auditoria' },
    { id: 'maquina', label: 'Verificar Máquina' },
    { id: 'certificado', label: 'Instalar Certificado' },
    { id: 'rede', label: 'Problema de Rede' }
  ]
};

export default function PortalDashboard() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [tickets, setTickets] = useState<any[]>([]);
  const [loadingTickets, setLoadingTickets] = useState(true);

  // States do Modal e Filtro
  const [searchTerm, setSearchTerm] = useState('');
  const [isNewTicketModalOpen, setIsNewTicketModalOpen] = useState(false);
  const [ticketCategory, setTicketCategory] = useState<'cliente' | 'agro' | 'ti' | ''>('');
  const [ticketSubcategory, setTicketSubcategory] = useState('');
  const [ticketPriority, setTicketPriority] = useState('Média');
  const [ticketTitle, setTicketTitle] = useState('');
  const [ticketPhone, setTicketPhone] = useState('');
  const [ticketFile, setTicketFile] = useState<File | null>(null);
  const [ticketFileBase64, setTicketFileBase64] = useState<string>('');
  const [ticketDesc, setTicketDesc] = useState('');
  const [submitLoading, setSubmitLoading] = useState(false);
  const [selectedTicket, setSelectedTicket] = useState<any>(null);

  const formatPhone = (val: string) => {
    let v = val.replace(/\D/g, '');
    if (v.length > 11) v = v.substring(0, 11);
    if (v.length <= 2) return v;
    if (v.length <= 6) return `(${v.substring(0, 2)}) ${v.substring(2)}`;
    if (v.length <= 10) return `(${v.substring(0, 2)}) ${v.substring(2, 6)}-${v.substring(6)}`;
    return `(${v.substring(0, 2)}) ${v.substring(2, 7)}-${v.substring(7)}`;
  };

  const openTicketsCount = tickets.filter(t => t.status !== 'Resolvido').length;
  const resolvedTicketsCount = tickets.filter(t => t.status === 'Resolvido').length;
  const slaText = tickets.length > 0 ? '100%' : '--';

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setTicketFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setTicketFileBase64(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const displayedTickets = tickets.filter(t => 
    t.title?.toLowerCase().includes(searchTerm.toLowerCase()) || 
    t.id?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    t.category?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  useEffect(() => {
    const checkUser = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        router.push('/portal/login');
      } else {
        setUser(session.user);
        fetchTickets(session.user.id);
      }
    };
    checkUser();
  }, [router]);

  const fetchTickets = async (userId: string) => {
    setLoadingTickets(true);
    const { data, error } = await supabase
      .from('tickets')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });
      
    if (!error && data) {
      setTickets(data);
    }
    setLoadingTickets(false);
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push('/portal/login');
  };

  const handleSubmitTicket = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!ticketCategory || !ticketSubcategory || !ticketTitle || !ticketDesc || !user) return;
    
    setSubmitLoading(true);
    const categoryName = ticketCategory === 'cliente' ? 'Cliente Final' : ticketCategory === 'agro' ? 'Agro' : 'T.I / Devs';
    const subcategoryName = SUBCATEGORIES[ticketCategory as keyof typeof SUBCATEGORIES].find(s => s.id === ticketSubcategory)?.label || ticketSubcategory;

    const { error } = await supabase.from('tickets').insert([{
      user_id: user.id,
      title: ticketTitle,
      description: ticketDesc,
      category: `${categoryName} - ${subcategoryName}`,
      status: 'Em Análise',
      priority: ticketPriority,
      phone: ticketPhone,
      attachment: ticketFileBase64
    }]);

    setSubmitLoading(false);
    if (!error) {
      setIsNewTicketModalOpen(false);
      setTicketTitle('');
      setTicketDesc('');
      setTicketCategory('');
      setTicketSubcategory('');
      setTicketPhone('');
      setTicketFile(null);
      setTicketFileBase64('');
      fetchTickets(user.id); // Refresh lista
    } else {
      console.error("Supabase Error:", error);
      alert(`Erro detalhado do banco de dados: ${error.message || JSON.stringify(error)}`);
    }
  };

  return (
    <div className="min-h-screen relative z-10 flex flex-col md:flex-row">
      
      {/* SIDEBAR LATERAL (Navegação) */}
      <aside className="w-full md:w-64 border-b md:border-b-0 md:border-r border-white/10 bg-[#020617]/50 backdrop-blur-xl p-6 flex flex-col hidden md:flex h-screen sticky top-0">
        <Link href="/" className="flex items-center gap-3 mb-12 group">
          <div className="w-10 h-10 bg-[#10b981] rounded-lg flex items-center justify-center shadow-[0_0_15px_rgba(16,185,129,0.3)]">
            <Zap size={20} fill="white" className="text-white" />
          </div>
          <div className="flex flex-col">
            <span className="text-xl font-black tracking-tighter uppercase italic leading-none text-white">VEMAPI</span>
            <span className="text-[7px] tracking-[0.4em] font-bold uppercase leading-none mt-1 text-[#10b981]">Painel Cliente</span>
          </div>
        </Link>

        <nav className="flex-1 space-y-2">
          <a href="#" className="flex items-center gap-3 px-4 py-3 bg-[#10b981]/10 text-[#10b981] rounded-xl text-xs font-black uppercase tracking-widest border border-[#10b981]/20">
            <MessageSquare size={16} /> Meus Chamados
          </a>
          <a href="#" className="flex items-center gap-3 px-4 py-3 text-slate-400 hover:bg-white/5 hover:text-white transition-colors rounded-xl text-xs font-bold uppercase tracking-widest border border-transparent">
            <MonitorCog size={16} /> Meus Serviços
          </a>
        </nav>

        <div className="mt-8 mb-4">
          <a href="https://wa.me/5541999999999" target="_blank" rel="noreferrer" className="flex items-center justify-between p-4 bg-emerald-500/10 border border-emerald-500/20 rounded-xl group hover:bg-emerald-500/20 transition-all">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-emerald-500/20 flex items-center justify-center text-emerald-500">
                {/* Ícone de Telefone/Whats improvisado */}
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/></svg>
              </div>
              <div className="flex flex-col">
                <span className="text-[10px] font-black uppercase text-emerald-500 tracking-wider">Emergência</span>
                <span className="text-[9px] text-emerald-500/70 uppercase">Suporte Rápido</span>
              </div>
            </div>
          </a>
        </div>

        <div className="mt-auto border-t border-white/10 pt-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-8 h-8 rounded-full bg-slate-800 flex items-center justify-center text-xs font-bold text-white border border-white/10 overflow-hidden">
              {user?.email?.charAt(0).toUpperCase() || 'C'}
            </div>
            <div className="overflow-hidden">
              <p className="text-xs font-bold text-white uppercase truncate">{user?.email?.split('@')[0] || 'Cliente'}</p>
              <p className="text-[10px] text-slate-500 uppercase tracking-widest truncate">{user?.email?.split('@')[1] || 'Empresa'}</p>
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
            <Zap size={16} fill="white" className="text-white" />
          </div>
          <span className="text-sm font-black tracking-tighter uppercase italic text-white flex flex-col leading-none">VEMAPI <span className="text-[6px] text-[#10b981] tracking-[0.3em] font-normal not-italic mt-0.5">PAINEL</span></span>
        </div>
        <button onClick={handleLogout} className="w-8 h-8 rounded-full bg-slate-800 flex items-center justify-center text-xs font-bold text-white border border-white/10 hover:bg-slate-700">
          {user?.email?.charAt(0).toUpperCase() || 'C'}
        </button>
      </header>

      {/* ÁREA PRINCIPAL */}
      <main className="flex-1 p-6 lg:p-12 overflow-y-auto">
        <div className="max-w-5xl mx-auto space-y-8">
          
          {/* HEADER DA PÁGINA (Resumo e Ação) */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <h1 className="text-2xl md:text-3xl font-black uppercase tracking-tight text-white mb-2">Visão Geral</h1>
              <p className="text-sm text-slate-400">Gerencie seus tíquetes de suporte e acompanhe o SLA.</p>
            </div>
            <button 
              onClick={() => setIsNewTicketModalOpen(true)}
              className="px-6 py-3 md:py-4 bg-[#10b981] text-white rounded-xl font-black uppercase tracking-[0.1em] text-[11px] hover:scale-[1.02] hover:shadow-[0_0_20px_rgba(16,185,129,0.3)] transition-all flex items-center justify-center gap-2"
            >
              <Plus size={16} /> ABRIR NOVO CHAMADO
            </button>
          </div>

          {/* DASHBOARD CARDS (MÉTRICAS) */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-white/5 border border-white/10 rounded-2xl p-5 flex items-center gap-4">
              <div className="w-12 h-12 rounded-full bg-[#10b981]/10 text-[#10b981] flex items-center justify-center">
                <MessageSquare size={20} />
              </div>
              <div>
                <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Chamados Abertos</p>
                <p className="text-2xl font-black text-white mt-1">{openTicketsCount < 10 ? `0${openTicketsCount}` : openTicketsCount}</p>
              </div>
            </div>
            <div className="bg-white/5 border border-white/10 rounded-2xl p-5 flex items-center gap-4">
              <div className="w-12 h-12 rounded-full bg-blue-500/10 text-blue-400 flex items-center justify-center">
                <CheckCircle2 size={20} />
              </div>
              <div>
                <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Resolvidos (Mês)</p>
                <p className="text-2xl font-black text-white mt-1">{resolvedTicketsCount < 10 ? `0${resolvedTicketsCount}` : resolvedTicketsCount}</p>
              </div>
            </div>
            <div className="bg-white/5 border border-white/10 rounded-2xl p-5 flex items-center gap-4">
              <div className="w-12 h-12 rounded-full bg-purple-500/10 text-purple-400 flex items-center justify-center">
                <Shield size={20} />
              </div>
              <div>
                <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Garantia SLA</p>
                <p className="text-2xl font-black text-white mt-1">{slaText}</p>
              </div>
            </div>
          </div>

          {/* CARD DE AVISO GLOBAL (Announcements) */}
          <div className="bg-amber-500/10 border border-amber-500/20 rounded-2xl p-5 md:p-6 flex items-start gap-4 relative overflow-hidden">
            <div className="absolute top-0 left-0 w-1 h-full bg-amber-500"></div>
            <div className="p-2 bg-amber-500/20 rounded-lg text-amber-500 flex-shrink-0 mt-0.5">
              <AlertTriangle size={20} />
            </div>
            <div>
              <h3 className="text-amber-500 font-bold text-sm tracking-wide uppercase mb-1 flex items-center gap-2">
                Aviso VEMAPI <span className="text-[10px] text-amber-500/60 font-medium">• {MOCK_ANNOUNCEMENT.date}</span>
              </h3>
              <p className="text-amber-100/80 text-sm leading-relaxed">{MOCK_ANNOUNCEMENT.message}</p>
            </div>
          </div>

          {/* CONTROLES DE FILTRO E LISTAGEM DE TICKETS */}
          <div className="bg-white/5 border border-white/10 rounded-[24px] overflow-hidden backdrop-blur-xl">
            <div className="p-6 border-b border-white/5 flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <Clock className="text-[#10b981]" size={20} />
                <h2 className="text-lg font-bold text-white tracking-wide uppercase">Histórico de Chamados</h2>
              </div>
              
              <div className="flex items-center gap-2">
                <div className="relative">
                  <input 
                    type="text" 
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    placeholder="Buscar ticket (ID, Nome)..." 
                    className="bg-black/20 border border-white/10 rounded-lg py-2 pl-3 pr-8 text-xs text-white placeholder-slate-500 outline-none focus:border-[#10b981] w-full md:w-56 transition-all" 
                  />
                  <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/></svg>
                </div>
                {searchTerm && (
                  <button onClick={() => setSearchTerm('')} className="px-3 py-2 bg-red-500/10 border border-red-500/20 rounded-lg text-[10px] text-red-500 font-bold uppercase tracking-wider hover:bg-red-500/20 transition-colors hidden sm:block">Limpar</button>
                )}
              </div>
            </div>
            
            <div className="divide-y divide-white/5">
              {loadingTickets ? (
                <div className="p-8 md:p-12 text-center flex flex-col items-center justify-center gap-4">
                  <div className="w-8 h-8 rounded-full border-t-2 border-r-2 border-[#10b981] animate-spin"></div>
                  <span className="text-slate-500 text-xs font-black uppercase tracking-widest mt-2">Carregando seus tickets...</span>
                </div>
              ) : displayedTickets.length === 0 ? (
                <div className="p-8 md:p-16 text-center flex flex-col items-center justify-center">
                  <div className="w-16 h-16 rounded-full bg-slate-800/50 text-slate-600 flex items-center justify-center mb-4 border border-white/5">
                    <MessageSquare size={28} />
                  </div>
                  <h4 className="text-white font-black uppercase tracking-wider mb-2">Nenhum chamado encontrado</h4>
                  <p className="text-xs text-slate-500 max-w-xs">{searchTerm ? 'Sua busca não retornou nenhum ticket correspondente. Tente usar outras palavras.' : 'Você não possui nenhum chamado de suporte ativo no momento.'}</p>
                </div>
              ) : (
                displayedTickets.map((ticket, i) => (
                  <div key={ticket.id || i} onClick={() => setSelectedTicket(ticket)} className="p-5 md:p-6 hover:bg-white/5 transition-all cursor-pointer group flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div className="flex items-start gap-4 md:gap-6 w-full">
                      <div className="w-12 h-12 rounded-xl bg-[#020617] backdrop-blur-md border border-white/10 flex flex-col items-center justify-center flex-shrink-0 group-hover:border-[#10b981] group-hover:shadow-[0_0_15px_rgba(16,185,129,0.2)] transition-all">
                        <span className="text-[8px] text-slate-500 font-bold uppercase tracking-widest mb-0.5">ID</span>
                        <span className="text-[10px] text-white font-black">{ticket.id.substring(0,4).toUpperCase()}</span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <h4 className="text-white font-medium text-sm md:text-base mb-1.5 group-hover:text-[#10b981] transition-colors truncate">{ticket.title}</h4>
                        <div className="flex flex-wrap items-center gap-3 text-[10px] md:text-[11px] font-bold uppercase tracking-wider">
                          <span className="text-slate-400 flex items-center gap-1.5 whitespace-nowrap">
                            {ticket.category?.includes('T.I') && <MonitorCog size={12} className="text-[#10b981]" />}
                            {ticket.category?.includes('Cliente Final') && <HeartHandshake size={12} className="text-blue-400" />}
                            {ticket.category?.includes('Agro') && <Shield size={12} className="text-amber-500" />}
                            {ticket.category}
                          </span>
                          <span className="w-1 h-1 rounded-full bg-slate-600 flex-shrink-0"></span>
                          <span className="text-slate-500 font-medium normal-case tracking-normal whitespace-nowrap">
                            {new Date(ticket.created_at).toLocaleDateString('pt-BR')}
                          </span>
                          <span className="w-1 h-1 rounded-full bg-slate-600 flex-shrink-0"></span>
                          {/* BADGE DE PRIORIDADE */}
                          <span className={`px-2 py-0.5 rounded-[4px] border border-transparent whitespace-nowrap ${
                            ticket.priority === 'Baixa' ? 'text-slate-400 bg-slate-800' :
                            ticket.priority === 'Média' ? 'text-blue-400 bg-blue-500/10' :
                            ticket.priority === 'Alta' ? 'text-orange-400 bg-orange-500/10 border-orange-500/20' :
                            ticket.priority === 'Crítica' ? 'text-red-500 bg-red-500/10 border-red-500/30' : 
                            'text-slate-500 bg-slate-800'
                          }`}>
                            Prioridade {ticket.priority || 'Média'}
                          </span>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center justify-between md:justify-end gap-6 w-full md:w-auto mt-2 md:mt-0 flex-shrink-0">
                      <span className={`px-3 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest border ${
                        ticket.status === 'Em Análise' ? 'bg-amber-500/10 text-amber-500 border-amber-500/20' :
                        ticket.status === 'Respondido' ? 'bg-blue-500/10 text-blue-400 border-blue-500/20' :
                        ticket.status === 'Resolvido' ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20' :
                        'bg-slate-800 text-slate-300 border-slate-700'
                      }`}>
                        {ticket.status}
                      </span>
                      <ChevronRight size={18} className="text-slate-600 group-hover:text-[#10b981] group-hover:translate-x-1 transition-all" />
                    </div>
                  </div>
                ))
              )}
            </div>
            <div className="p-4 bg-black/20 text-center border-t border-white/5">
              <button className="text-xs font-bold text-[#10b981] hover:text-emerald-400 uppercase tracking-widest transition-colors">Ver todos os chamados</button>
            </div>
          </div>
        </div>
      </main>

      {/* MODAL DE NOVO CHAMADO */}
      <AnimatePresence>
        {isNewTicketModalOpen && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }} 
              animate={{ opacity: 1 }} 
              exit={{ opacity: 0 }}
              onClick={() => setIsNewTicketModalOpen(false)}
              className="absolute inset-0 bg-black/80 backdrop-blur-sm"
            ></motion.div>
            
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 20 }} 
              animate={{ opacity: 1, scale: 1, y: 0 }} 
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="w-full max-w-2xl bg-[#020617] border border-white/10 rounded-[32px] shadow-2xl overflow-hidden relative z-10 flex flex-col max-h-[90vh]"
            >
              <div className="p-6 md:p-8 border-b border-white/5 flex items-center justify-between bg-white/5">
                <div>
                  <h2 className="text-xl md:text-2xl font-black uppercase tracking-tight text-white mb-1">Abrir Chamado</h2>
                  <p className="text-xs text-slate-400">Descreva o problema para que nosso time técnico atue.</p>
                </div>
                <button 
                  onClick={() => setIsNewTicketModalOpen(false)}
                  className="w-10 h-10 rounded-full bg-white/5 hover:bg-white/10 flex items-center justify-center text-slate-400 transition-colors"
                >
                  <X size={20} />
                </button>
              </div>

              <div className="p-6 md:p-8 overflow-y-auto custom-scrollbar">
                <form onSubmit={handleSubmitTicket} className="space-y-6">
                  
                  {/* SELEÇÃO DE CATEGORIA */}
                  <div className="space-y-3">
                    <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 pl-1">Área de Suporte</label>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      <button type="button" onClick={() => { setTicketCategory('cliente'); setTicketSubcategory(''); }} className={`p-4 rounded-xl border flex flex-col items-center gap-3 text-center transition-all ${ticketCategory === 'cliente' ? 'bg-[#10b981]/10 border-[#10b981] text-[#10b981]' : 'bg-white/5 border-white/10 text-slate-400 hover:bg-white/10 hover:text-white'}`}>
                        <HeartHandshake size={24} />
                        <div>
                          <p className="text-xs font-bold uppercase">Cliente Final</p>
                          <span className="text-[9px] opacity-70">Atendimento e dúvidas</span>
                        </div>
                      </button>
                      
                      <button type="button" onClick={() => { setTicketCategory('agro'); setTicketSubcategory(''); }} className={`p-4 rounded-xl border flex flex-col items-center gap-3 text-center transition-all ${ticketCategory === 'agro' ? 'bg-[#10b981]/10 border-[#10b981] text-[#10b981]' : 'bg-white/5 border-white/10 text-slate-400 hover:bg-white/10 hover:text-white'}`}>
                        <Shield size={24} />
                        <div>
                          <p className="text-xs font-bold uppercase">Agro / Campo</p>
                          <span className="text-[9px] opacity-70">Operações e Logística</span>
                        </div>
                      </button>

                      <button type="button" onClick={() => { setTicketCategory('ti'); setTicketSubcategory(''); }} className={`p-4 rounded-xl border flex flex-col items-center gap-3 text-center transition-all ${ticketCategory === 'ti' ? 'bg-[#10b981]/10 border-[#10b981] text-[#10b981]' : 'bg-white/5 border-white/10 text-slate-400 hover:bg-white/10 hover:text-white'}`}>
                        <MonitorCog size={24} />
                        <div>
                          <p className="text-xs font-bold uppercase">T.I & Devs</p>
                          <span className="text-[9px] opacity-70">Infra e Sistemas</span>
                        </div>
                      </button>
                    </div>
                  </div>

                  {/* SELEÇÃO DE SUBCATEGORIA */}
                  <AnimatePresence>
                    {ticketCategory && (
                      <motion.div 
                        initial={{opacity: 0, height: 0, marginTop: 0}} 
                        animate={{opacity: 1, height: 'auto', marginTop: 16}} 
                        exit={{opacity: 0, height: 0, marginTop: 0}}
                        className="space-y-3 overflow-hidden"
                      >
                         <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 pl-1">Tipo de Solicitação</label>
                         <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                           {SUBCATEGORIES[ticketCategory as keyof typeof SUBCATEGORIES].map(sub => (
                             <button
                               key={sub.id}
                               type="button"
                               onClick={() => setTicketSubcategory(sub.id)}
                               className={`p-3 rounded-lg border text-xs font-bold uppercase tracking-wider transition-all ${
                                ticketSubcategory === sub.id 
                                  ? 'bg-[#10b981]/10 border-[#10b981] text-[#10b981]' 
                                  : 'bg-white/5 border-white/5 text-slate-500 hover:bg-white/10 hover:text-white'
                               }`}
                             >
                               {sub.label}
                             </button>
                           ))}
                         </div>
                      </motion.div>
                    )}
                  </AnimatePresence>

                  {/* SELEÇÃO DE PRIORIDADE */}
                  <div className="space-y-3">
                    <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 pl-1">Prioridade</label>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                      {['Baixa', 'Média', 'Alta', 'Crítica'].map((priority) => (
                        <button 
                          key={priority}
                          type="button" 
                          onClick={() => setTicketPriority(priority)} 
                          className={`p-3 rounded-lg border text-xs font-bold uppercase tracking-wider transition-all ${
                            ticketPriority === priority 
                              ? priority === 'Baixa' ? 'bg-slate-800 border-slate-600 text-white' :
                                priority === 'Média' ? 'bg-blue-500/20 border-blue-500/50 text-blue-400' :
                                priority === 'Alta' ? 'bg-orange-500/20 border-orange-500/50 text-orange-400' :
                                'bg-red-500/20 border-red-500/50 text-red-500'
                              : 'bg-white/5 border-white/5 text-slate-500 hover:bg-white/10'
                          }`}
                        >
                          {priority}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 pl-1">Título Resumido</label>
                    <input type="text" value={ticketTitle} onChange={(e) => setTicketTitle(e.target.value)} required placeholder="Ex: Sistema X não abre no RH" className="w-full bg-black/20 border-white/10 placeholder-slate-600 text-white border p-4 rounded-xl outline-none focus:border-[#10b981] transition-all text-sm" />
                  </div>

                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 pl-1">Descrição Detalhada</label>
                    <textarea rows={4} value={ticketDesc} onChange={(e) => setTicketDesc(e.target.value)} required placeholder="Descreva o máximo de detalhes possível, incluindo mensagens de erro se houver..." className="w-full bg-black/20 border-white/10 placeholder-slate-600 text-white border p-4 rounded-xl outline-none focus:border-[#10b981] transition-all text-sm resize-none"></textarea>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 pl-1">Telefone / WhatsApp</label>
                      <div className="relative">
                        <Phone size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" />
                        <input 
                          type="tel" 
                          value={ticketPhone} 
                          onChange={(e) => setTicketPhone(formatPhone(e.target.value))} 
                          maxLength={15} 
                          required 
                          placeholder="(00) 00000-0000" 
                          className="w-full bg-black/20 border-white/10 placeholder-slate-600 text-white border py-4 pr-4 pl-12 rounded-xl outline-none focus:border-[#10b981] transition-all text-sm" 
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                       <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 pl-1">Anexo / Print (Opcional)</label>
                       
                       {ticketFile ? (
                         <div className="flex items-center justify-center w-full bg-[#10b981]/10 border border-[#10b981]/50 text-[#10b981] p-4 rounded-xl transition-all text-sm group">
                           <div className="flex items-center justify-center gap-3">
                             <ImagePlus size={16} />
                             <span className="truncate max-w-[150px] font-bold">{ticketFile.name}</span>
                             <button 
                               type="button" 
                               onClick={() => { setTicketFile(null); setTicketFileBase64(''); }}
                               className="p-1.5 bg-red-500/10 hover:bg-red-500/20 text-red-500 rounded-lg transition-colors ml-2"
                               title="Remover anexo"
                             >
                               <X size={14} />
                             </button>
                           </div>
                         </div>
                       ) : (
                         <label className="flex items-center justify-center w-full bg-black/20 border border-white/10 border-dashed text-slate-400 p-4 rounded-xl cursor-pointer hover:border-[#10b981] hover:text-[#10b981] transition-all text-sm group">
                           <div className="flex items-center justify-center gap-2">
                             <ImagePlus size={16} className="group-hover:scale-110 transition-transform" />
                             <span>Anexar Imagem</span>
                           </div>
                           <input type="file" accept="image/*" className="hidden" onChange={handleFileChange} />
                         </label>
                       )}
                    </div>
                  </div>

                  <button type="submit" disabled={submitLoading || !ticketCategory || !ticketSubcategory} className="w-full py-5 bg-[#10b981] text-white rounded-xl font-black uppercase tracking-[0.2em] text-[11px] hover:scale-[1.02] hover:shadow-[0_0_20px_rgba(16,185,129,0.3)] transition-all flex items-center justify-center gap-2 group disabled:opacity-70 disabled:hover:scale-100 disabled:shadow-none">
                    {submitLoading ? 'ENVIANDO...' : 'ENVIAR PARA ANÁLISE'}
                  </button>
                </form>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* MODAL DE DETALHES DO CHAMADO */}
      <AnimatePresence>
        {selectedTicket && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }} 
              animate={{ opacity: 1 }} 
              exit={{ opacity: 0 }}
              onClick={() => setSelectedTicket(null)}
              className="absolute inset-0 bg-black/80 backdrop-blur-sm"
            ></motion.div>
            
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 20 }} 
              animate={{ opacity: 1, scale: 1, y: 0 }} 
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="w-full max-w-2xl bg-[#020617] border border-white/10 rounded-[32px] shadow-2xl overflow-hidden relative z-10 flex flex-col max-h-[90vh]"
            >
              <div className="p-6 md:p-8 border-b border-white/5 flex flex-col md:flex-row md:items-start md:items-center justify-between gap-6 bg-white/5">
                <div>
                  <div className="flex items-center gap-3 mb-2">
                    <span className={`px-3 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest border ${
                      selectedTicket.status === 'Em Análise' ? 'bg-amber-500/10 text-amber-500 border-amber-500/20' :
                      selectedTicket.status === 'Respondido' ? 'bg-blue-500/10 text-blue-400 border-blue-500/20' :
                      selectedTicket.status === 'Resolvido' ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20' :
                      'bg-slate-800 text-slate-300 border-slate-700'
                    }`}>
                      {selectedTicket.status}
                    </span>
                    <span className="text-slate-500 text-[10px] font-black uppercase tracking-widest">
                      ID: {selectedTicket.id.substring(0,8).toUpperCase()}
                    </span>
                  </div>
                  <h2 className="text-xl md:text-2xl font-black uppercase tracking-tight text-white pr-8">{selectedTicket.title}</h2>
                </div>
                <button 
                  onClick={() => setSelectedTicket(null)}
                  className="absolute top-6 right-6 md:static w-10 h-10 rounded-full bg-white/5 hover:bg-white/10 flex items-center justify-center text-slate-400 transition-colors flex-shrink-0"
                >
                  <X size={20} />
                </button>
              </div>

              <div className="p-6 md:p-8 overflow-y-auto custom-scrollbar space-y-6">
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 bg-black/20 p-4 rounded-xl border border-white/5">
                   <div>
                     <p className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-1">Categoria</p>
                     <p className="text-xs font-bold text-slate-300 truncate" title={selectedTicket.category}>{selectedTicket.category}</p>
                   </div>
                   <div>
                     <p className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-1">Prioridade</p>
                     <p className={`text-xs font-bold ${
                        selectedTicket.priority === 'Baixa' ? 'text-slate-400' :
                        selectedTicket.priority === 'Média' ? 'text-blue-400' :
                        selectedTicket.priority === 'Alta' ? 'text-orange-400' :
                        'text-red-500'
                     }`}>{selectedTicket.priority || 'N/A'}</p>
                   </div>
                   <div>
                     <p className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-1">Abertura</p>
                     <p className="text-xs font-bold text-slate-300">{new Date(selectedTicket.created_at).toLocaleDateString('pt-BR')}</p>
                   </div>
                   <div>
                     <p className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-1">Telefone</p>
                     <p className="text-xs font-bold text-slate-300">{selectedTicket.phone || 'Não inf.'}</p>
                   </div>
                </div>

                <div className="space-y-3">
                  <h3 className="text-xs font-black uppercase tracking-widest text-white border-b border-white/10 pb-2 flex items-center gap-2">
                    <MessageSquare size={14} className="text-[#10b981]" />
                    Descrição do Problema
                  </h3>
                  <div className="bg-white/5 rounded-xl p-5 border border-white/10">
                    <p className="text-sm text-slate-300 whitespace-pre-wrap leading-relaxed">{selectedTicket.description}</p>
                  </div>
                </div>

                {selectedTicket.attachment && (
                  <div className="space-y-3">
                    <h3 className="text-xs font-black uppercase tracking-widest text-white border-b border-white/10 pb-2 flex items-center gap-2">
                      <ImagePlus size={14} className="text-[#10b981]" />
                      Anexo Fornecido
                    </h3>
                    <div className="rounded-xl overflow-hidden border border-white/10 bg-black/50 p-2">
                      <img src={selectedTicket.attachment} alt="Anexo do chamado" className="w-full h-auto object-contain max-h-[400px] rounded-lg cursor-zoom-in" onClick={() => window.open(selectedTicket.attachment, '_blank')} />
                    </div>
                  </div>
                )}

                {selectedTicket.admin_response && (
                  <div className="space-y-3 mt-6">
                    <h3 className="text-xs font-black uppercase tracking-widest text-[#10b981] border-b border-[#10b981]/20 pb-2 flex items-center gap-2">
                      <Shield size={14} />
                      Resposta da Equipe VEMAPI
                    </h3>
                    <div className="bg-[#10b981]/10 rounded-xl p-5 border border-[#10b981]/20 relative overflow-hidden">
                      <div className="absolute top-0 left-0 w-1 h-full bg-[#10b981]"></div>
                      <p className="text-sm text-slate-200 whitespace-pre-wrap leading-relaxed font-medium">{selectedTicket.admin_response}</p>
                    </div>
                  </div>
                )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
      
    </div>
  );
}
