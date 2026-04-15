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
    <div className="min-h-screen bg-slate-50 relative z-10 flex flex-col md:flex-row font-sans">
      
      {/* SIDEBAR LATERAL (Navegação) */}
      <aside className="w-full md:w-64 border-b md:border-b-0 md:border-r border-slate-200 bg-white p-6 flex flex-col hidden md:flex h-screen sticky top-0 shadow-sm">
        <Link href="/" className="flex items-center gap-3 mb-12 group">
          <div className="w-10 h-10 bg-emerald-600 rounded-lg flex items-center justify-center shadow-lg shadow-emerald-100">
            <Zap size={20} className="text-white fill-white" />
          </div>
          <div className="flex flex-col">
            <span className="text-xl font-black tracking-tighter uppercase italic leading-none text-slate-900">VEMAPI</span>
            <span className="text-[7px] tracking-[0.4em] font-bold uppercase leading-none mt-1 text-emerald-600">Painel Cliente</span>
          </div>
        </Link>

        <nav className="flex-1 space-y-2">
          <a href="#" className="flex items-center gap-3 px-4 py-3 bg-emerald-50 text-emerald-700 rounded-xl text-xs font-black uppercase tracking-widest border border-emerald-100">
            <MessageSquare size={16} /> Meus Chamados
          </a>
          <a href="#" className="flex items-center gap-3 px-4 py-3 text-slate-500 hover:bg-slate-50 hover:text-slate-900 transition-colors rounded-xl text-xs font-bold uppercase tracking-widest border border-transparent">
            <MonitorCog size={16} /> Meus Serviços
          </a>
        </nav>

        <div className="mt-8 mb-4">
          <a href="https://wa.me/5541999999999" target="_blank" rel="noreferrer" className="flex items-center justify-between p-4 bg-emerald-600 text-white rounded-2xl group hover:bg-emerald-700 transition-all shadow-lg shadow-emerald-100">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center text-white">
                <Phone size={14} />
              </div>
              <div className="flex flex-col">
                <span className="text-[10px] font-black uppercase tracking-wider">Emergência</span>
                <span className="text-[9px] text-white/70 uppercase">Suporte Rápido</span>
              </div>
            </div>
          </a>
        </div>

        <div className="mt-auto border-t border-slate-100 pt-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-xs font-bold text-slate-600 border border-slate-200 overflow-hidden">
              {user?.email?.charAt(0).toUpperCase() || 'C'}
            </div>
            <div className="overflow-hidden">
              <p className="text-xs font-bold text-slate-900 uppercase truncate">{user?.email?.split('@')[0] || 'Cliente'}</p>
              <p className="text-[10px] text-slate-400 uppercase tracking-widest truncate">{user?.email?.split('@')[1] || 'Empresa'}</p>
            </div>
          </div>
          <button onClick={handleLogout} className="flex items-center gap-2 text-[10px] text-slate-500 hover:text-rose-600 font-bold uppercase tracking-widest transition-colors">
            <LogOut size={14} /> Sair do Painel
          </button>
        </div>
      </aside>

      {/* HEADER MOBILE */}
      <header className="md:hidden flex items-center justify-between p-4 border-b border-slate-200 bg-white sticky top-0 z-50">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-emerald-600 rounded-lg flex items-center justify-center">
            <Zap size={16} className="text-white fill-white" />
          </div>
          <span className="text-sm font-black tracking-tighter uppercase italic text-slate-900 flex flex-col leading-none">VEMAPI <span className="text-[6px] text-emerald-600 tracking-[0.3em] font-normal not-italic mt-0.5">PAINEL</span></span>
        </div>
        <button onClick={handleLogout} className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-xs font-bold text-slate-600 border border-slate-200">
          {user?.email?.charAt(0).toUpperCase() || 'C'}
        </button>
      </header>

      {/* ÁREA PRINCIPAL */}
      <main className="flex-1 p-6 lg:p-12 overflow-y-auto bg-slate-50">
        <div className="max-w-5xl mx-auto space-y-8">
          
          {/* HEADER DA PÁGINA (Resumo e Ação) */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <h1 className="text-2xl md:text-4xl font-black uppercase tracking-tight text-slate-900 mb-2">Visão Geral</h1>
              <p className="text-sm text-slate-500 font-medium">Gerencie seus tíquetes de suporte e acompanhe o tempo de resposta.</p>
            </div>
            <button 
              onClick={() => setIsNewTicketModalOpen(true)}
              className="px-8 py-4 bg-slate-900 text-white rounded-2xl font-black uppercase tracking-[0.1em] text-[11px] hover:bg-emerald-600 hover:translate-y-[-2px] hover:shadow-xl hover:shadow-emerald-100 transition-all flex items-center justify-center gap-2"
            >
              <Plus size={16} /> ABRIR NOVO CHAMADO
            </button>
          </div>

          {/* DASHBOARD CARDS (MÉTRICAS) */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-white border border-slate-200 rounded-2xl p-6 flex items-center gap-4 shadow-sm">
              <div className="w-14 h-14 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center border border-emerald-100">
                <MessageSquare size={24} />
              </div>
              <div>
                <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Chamados Abertos</p>
                <p className="text-3xl font-black text-slate-900 mt-1">{openTicketsCount < 10 ? `0${openTicketsCount}` : openTicketsCount}</p>
              </div>
            </div>
            <div className="bg-white border border-slate-200 rounded-2xl p-6 flex items-center gap-4 shadow-sm">
              <div className="w-14 h-14 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center border border-blue-100">
                <CheckCircle2 size={24} />
              </div>
              <div>
                <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Resolvidos (Mês)</p>
                <p className="text-3xl font-black text-slate-900 mt-1">{resolvedTicketsCount < 10 ? `0${resolvedTicketsCount}` : resolvedTicketsCount}</p>
              </div>
            </div>
            <div className="bg-white border border-slate-200 rounded-2xl p-6 flex items-center gap-4 shadow-sm">
              <div className="w-14 h-14 rounded-2xl bg-slate-900 text-white flex items-center justify-center border border-slate-800">
                <Shield size={24} />
              </div>
              <div>
                <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Garantia SLA</p>
                <p className="text-3xl font-black text-slate-900 mt-1">{slaText}</p>
              </div>
            </div>
          </div>

          {/* CARD DE AVISO GLOBAL (Announcements) */}
          <div className="bg-white border border-amber-200 rounded-3xl p-6 md:p-8 flex items-start gap-5 relative overflow-hidden shadow-sm">
            <div className="absolute top-0 left-0 w-1.5 h-full bg-amber-400"></div>
            <div className="p-3 bg-amber-50 rounded-2xl text-amber-600 flex-shrink-0 animate-pulse">
              <AlertTriangle size={24} />
            </div>
            <div>
              <h3 className="text-slate-900 font-black text-sm tracking-wide uppercase mb-2 flex items-center gap-2">
                Aviso Importante <span className="text-[10px] text-slate-400 font-bold">• {MOCK_ANNOUNCEMENT.date}</span>
              </h3>
              <p className="text-slate-600 text-sm leading-relaxed font-medium">{MOCK_ANNOUNCEMENT.message}</p>
            </div>
          </div>

          {/* CONTROLES DE FILTRO E LISTAGEM DE TICKETS */}
          <div className="bg-white border border-slate-200 rounded-[32px] overflow-hidden shadow-sm">
            <div className="p-8 border-b border-slate-100 flex flex-col md:flex-row md:items-center justify-between gap-6 bg-slate-50/50">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-slate-900 rounded-xl flex items-center justify-center text-white">
                  <Clock size={20} />
                </div>
                <h2 className="text-xl font-black text-slate-900 tracking-tight uppercase">Histórico de Chamados</h2>
              </div>
              
              <div className="flex items-center gap-2">
                <div className="relative">
                  <input 
                    type="text" 
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    placeholder="Buscar ticket (ID, Nome)..." 
                    className="bg-white border border-slate-200 rounded-xl py-3 pl-4 pr-10 text-xs text-slate-900 placeholder-slate-400 outline-none focus:border-emerald-600 w-full md:w-64 transition-all shadow-sm" 
                  />
                  <div className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400">
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/></svg>
                  </div>
                </div>
                {searchTerm && (
                  <button onClick={() => setSearchTerm('')} className="px-4 py-3 bg-rose-50 text-rose-600 rounded-xl text-[10px] font-black uppercase tracking-wider hover:bg-rose-100 transition-colors hidden sm:block">Limpar</button>
                )}
              </div>
            </div>
            
            <div className="divide-y divide-slate-100">
              {loadingTickets ? (
                <div className="p-12 text-center flex flex-col items-center justify-center gap-4">
                  <div className="w-10 h-10 rounded-full border-4 border-slate-100 border-t-emerald-600 animate-spin"></div>
                  <span className="text-slate-400 text-[10px] font-black uppercase tracking-widest">Aguarde, processando...</span>
                </div>
              ) : displayedTickets.length === 0 ? (
                <div className="p-16 text-center flex flex-col items-center justify-center">
                  <div className="w-20 h-20 rounded-[2rem] bg-slate-50 text-slate-300 flex items-center justify-center mb-6 border border-slate-100">
                    <MessageSquare size={32} />
                  </div>
                  <h4 className="text-slate-900 font-black uppercase tracking-wider mb-2">Nenhum chamado encontrado</h4>
                  <p className="text-xs text-slate-500 max-w-xs font-medium">{searchTerm ? 'Sua busca não retornou resultados.' : 'Não há chamados registrados na sua conta.'}</p>
                </div>
              ) : (
                displayedTickets.map((ticket, i) => (
                  <div key={ticket.id || i} onClick={() => setSelectedTicket(ticket)} className="p-6 md:p-8 hover:bg-slate-50 transition-all cursor-pointer group flex flex-col md:flex-row md:items-center justify-between gap-6">
                    <div className="flex items-center gap-6 w-full">
                      <div className="w-14 h-14 rounded-2xl bg-slate-100 border border-slate-200 flex flex-col items-center justify-center flex-shrink-0 group-hover:bg-white group-hover:border-emerald-200 group-hover:shadow-lg group-hover:shadow-emerald-50 transition-all">
                        <span className="text-[8px] text-slate-400 font-black uppercase tracking-widest mb-0.5">ID</span>
                        <span className="text-xs text-slate-900 font-black">{ticket.id.substring(0,4).toUpperCase()}</span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <h4 className="text-slate-900 font-black text-sm md:text-base mb-1.5 group-hover:text-emerald-700 transition-colors truncate uppercase tracking-tight">{ticket.title}</h4>
                        <div className="flex flex-wrap items-center gap-3 text-[10px] font-bold uppercase tracking-wider">
                          <span className="text-slate-500 bg-slate-100 px-2 py-0.5 rounded flex items-center gap-1.5 whitespace-nowrap">
                            {ticket.category?.includes('T.I') && <MonitorCog size={12} className="text-emerald-600" />}
                            {ticket.category?.includes('Cliente Final') && <HeartHandshake size={12} className="text-blue-600" />}
                            {ticket.category?.includes('Agro') && <Shield size={12} className="text-amber-600" />}
                            {ticket.category}
                          </span>
                          <span className="text-slate-400 font-black">•</span>
                          <span className="text-slate-400 whitespace-nowrap">
                            {new Date(ticket.created_at).toLocaleDateString('pt-BR')}
                          </span>
                          <span className="text-slate-400 font-black">•</span>
                          <span className={`px-2 py-0.5 rounded font-black whitespace-nowrap ${
                            ticket.priority === 'Baixa' ? 'text-slate-500 bg-slate-100' :
                            ticket.priority === 'Média' ? 'text-blue-600 bg-blue-50' :
                            ticket.priority === 'Alta' ? 'text-orange-600 bg-orange-50' :
                            ticket.priority === 'Crítica' ? 'text-rose-600 bg-rose-50' : 
                            'text-slate-400 bg-slate-100'
                          }`}>
                            Prio {ticket.priority || 'Média'}
                          </span>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center justify-between md:justify-end gap-6 w-full md:w-auto mt-2 md:mt-0 flex-shrink-0">
                      <span className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest border ${
                        ticket.status === 'Em Análise' ? 'bg-amber-50 text-amber-600 border-amber-100' :
                        ticket.status === 'Respondido' ? 'bg-blue-50 text-blue-600 border-blue-100' :
                        ticket.status === 'Resolvido' ? 'bg-emerald-50 text-emerald-600 border-emerald-100' :
                        'bg-slate-50 text-slate-500 border-slate-200'
                      }`}>
                        {ticket.status}
                      </span>
                      <div className="w-10 h-10 rounded-full border border-slate-100 flex items-center justify-center group-hover:bg-white group-hover:border-emerald-200 transition-all shadow-sm">
                        <ChevronRight size={18} className="text-slate-400 group-hover:text-emerald-600 group-hover:translate-x-0.5 transition-all" />
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
            <div className="p-6 bg-slate-50/50 text-center border-t border-slate-100">
              <button className="text-[10px] font-black text-slate-900 border-b-2 border-slate-900 hover:text-emerald-700 hover:border-emerald-700 uppercase tracking-[0.2em] transition-all pb-0.5">Carregar mais chamados</button>
            </div>
          </div>
        </div>
      </main>

      {/* MODAL DE NOVO CHAMADO */}
      <AnimatePresence>
        {isNewTicketModalOpen && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6">
            <motion.div 
              initial={{ opacity: 0 }} 
              animate={{ opacity: 1 }} 
              exit={{ opacity: 0 }}
              onClick={() => setIsNewTicketModalOpen(false)}
              className="absolute inset-0 bg-slate-900/40 backdrop-blur-md"
            ></motion.div>
            
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 20 }} 
              animate={{ opacity: 1, scale: 1, y: 0 }} 
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="w-full max-w-2xl bg-white border border-slate-100 rounded-[2.5rem] shadow-2xl overflow-hidden relative z-10 flex flex-col max-h-[90vh]"
            >
              <div className="p-8 md:p-10 border-b border-slate-50 flex items-center justify-between bg-slate-50/30">
                <div>
                  <h2 className="text-2xl md:text-3xl font-black uppercase tracking-tight text-slate-900 mb-1">Novo Chamado</h2>
                  <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Abertura de ticket para suporte especializado</p>
                </div>
                <button 
                  onClick={() => setIsNewTicketModalOpen(false)}
                  className="w-12 h-12 rounded-2xl bg-white hover:bg-slate-50 flex items-center justify-center text-slate-400 hover:text-slate-900 transition-all shadow-sm border border-slate-100"
                >
                  <X size={20} />
                </button>
              </div>

              <div className="p-8 md:p-10 overflow-y-auto custom-scrollbar">
                <form onSubmit={handleSubmitTicket} className="space-y-8">
                  
                  {/* SELEÇÃO DE CATEGORIA */}
                  <div className="space-y-4">
                    <label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 pl-1">Área de Suporte</label>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                      <button type="button" onClick={() => { setTicketCategory('cliente'); setTicketSubcategory(''); }} className={`p-6 rounded-2xl border-2 flex flex-col items-center gap-4 text-center transition-all ${ticketCategory === 'cliente' ? 'bg-emerald-50 border-emerald-500 text-emerald-700 shadow-lg shadow-emerald-50' : 'bg-white border-slate-100 text-slate-400 hover:bg-slate-50 hover:border-slate-200'}`}>
                        <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${ticketCategory === 'cliente' ? 'bg-emerald-500 text-white' : 'bg-slate-50 text-slate-400'}`}>
                          <HeartHandshake size={24} />
                        </div>
                        <div>
                          <p className="text-xs font-black uppercase tracking-tight">Cliente Final</p>
                          <span className="text-[9px] font-bold opacity-60 uppercase tracking-tighter">Atendimento</span>
                        </div>
                      </button>
                      
                      <button type="button" onClick={() => { setTicketCategory('agro'); setTicketSubcategory(''); }} className={`p-6 rounded-2xl border-2 flex flex-col items-center gap-4 text-center transition-all ${ticketCategory === 'agro' ? 'bg-emerald-50 border-emerald-500 text-emerald-700 shadow-lg shadow-emerald-50' : 'bg-white border-slate-100 text-slate-400 hover:bg-slate-50 hover:border-slate-200'}`}>
                        <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${ticketCategory === 'agro' ? 'bg-emerald-500 text-white' : 'bg-slate-50 text-slate-400'}`}>
                          <Shield size={24} />
                        </div>
                        <div>
                          <p className="text-xs font-black uppercase tracking-tight">Agro / Campo</p>
                          <span className="text-[9px] font-bold opacity-60 uppercase tracking-tighter">Operações</span>
                        </div>
                      </button>

                      <button type="button" onClick={() => { setTicketCategory('ti'); setTicketSubcategory(''); }} className={`p-6 rounded-2xl border-2 flex flex-col items-center gap-4 text-center transition-all ${ticketCategory === 'ti' ? 'bg-emerald-50 border-emerald-500 text-emerald-700 shadow-lg shadow-emerald-50' : 'bg-white border-slate-100 text-slate-400 hover:bg-slate-50 hover:border-slate-200'}`}>
                        <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${ticketCategory === 'ti' ? 'bg-emerald-500 text-white' : 'bg-slate-50 text-slate-400'}`}>
                          <MonitorCog size={24} />
                        </div>
                        <div>
                          <p className="text-xs font-black uppercase tracking-tight">T.I & Devs</p>
                          <span className="text-[9px] font-bold opacity-60 uppercase tracking-tighter">Infraestrutura</span>
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
                        className="space-y-4 overflow-hidden"
                      >
                         <label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 pl-1">Tipo de Solicitação</label>
                         <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                           {SUBCATEGORIES[ticketCategory as keyof typeof SUBCATEGORIES].map(sub => (
                             <button
                               key={sub.id}
                               type="button"
                               onClick={() => setTicketSubcategory(sub.id)}
                               className={`py-3 px-2 rounded-xl border-2 text-[10px] font-black uppercase tracking-widest transition-all ${
                                ticketSubcategory === sub.id 
                                  ? 'bg-emerald-500 border-emerald-500 text-white shadow-md' 
                                  : 'bg-slate-50 border-slate-50 text-slate-400 hover:bg-white hover:border-slate-200'
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
                  <div className="space-y-4">
                    <label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 pl-1">Prioridade</label>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                      {['Baixa', 'Média', 'Alta', 'Crítica'].map((priority) => (
                        <button 
                          key={priority}
                          type="button" 
                          onClick={() => setTicketPriority(priority)} 
                          className={`py-3 rounded-xl border-2 text-[10px] font-black uppercase tracking-widest transition-all ${
                            ticketPriority === priority 
                              ? 'bg-slate-900 border-slate-900 text-white shadow-lg'
                              : 'bg-slate-50 border-slate-50 text-slate-400 hover:bg-white hover:border-slate-200'
                          }`}
                        >
                          {priority}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="grid grid-cols-1 gap-6">
                    <div className="space-y-2">
                       <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 pl-1">Título do Chamado</label>
                       <input type="text" value={ticketTitle} onChange={(e) => setTicketTitle(e.target.value)} required placeholder="Ex: Problema na emissão A3" className="w-full bg-slate-50 border-slate-100 placeholder-slate-300 text-slate-900 border-2 p-5 rounded-[1.25rem] outline-none focus:border-emerald-500 transition-all text-sm font-bold" />
                    </div>

                    <div className="space-y-2">
                      <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 pl-1">Relato Detalhado</label>
                      <textarea rows={4} value={ticketDesc} onChange={(e) => setTicketDesc(e.target.value)} required placeholder="Descreva os detalhes..." className="w-full bg-slate-50 border-slate-100 placeholder-slate-300 text-slate-900 border-2 p-5 rounded-[1.25rem] outline-none focus:border-emerald-500 transition-all text-sm font-bold resize-none"></textarea>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 pl-1">WhatsApp de Contato</label>
                      <div className="relative">
                        <Phone size={18} className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400" />
                        <input 
                          type="tel" 
                          value={ticketPhone} 
                          onChange={(e) => setTicketPhone(formatPhone(e.target.value))} 
                          maxLength={15} 
                          required 
                          placeholder="(00) 00000-0000" 
                          className="w-full bg-slate-50 border-slate-100 placeholder-slate-300 text-slate-900 border-2 py-5 pr-5 pl-14 rounded-[1.25rem] outline-none focus:border-emerald-500 transition-all text-sm font-bold" 
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                       <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 pl-1">Anexo de Evidência</label>
                       
                       {ticketFile ? (
                         <div className="flex items-center justify-between w-full bg-emerald-50 border-2 border-emerald-500 text-emerald-700 p-4 rounded-[1.25rem] transition-all group">
                           <div className="flex items-center gap-3">
                             <div className="w-10 h-10 bg-emerald-500 text-white rounded-lg flex items-center justify-center">
                               <ImagePlus size={18} />
                             </div>
                             <div className="flex flex-col">
                               <span className="truncate max-w-[120px] text-xs font-black uppercase tracking-tight">{ticketFile.name}</span>
                               <span className="text-[9px] font-bold opacity-60">PRONTO PARA ENVIAR</span>
                             </div>
                           </div>
                           <button 
                             type="button" 
                             onClick={() => { setTicketFile(null); setTicketFileBase64(''); }}
                             className="w-8 h-8 bg-white/50 hover:bg-white text-rose-500 rounded-lg transition-all flex items-center justify-center shadow-sm"
                           >
                             <X size={16} />
                           </button>
                         </div>
                       ) : (
                         <label className="flex items-center justify-center w-full bg-slate-50 border-2 border-slate-100 border-dashed text-slate-400 p-5 rounded-[1.25rem] cursor-pointer hover:border-emerald-500 hover:text-emerald-600 transition-all group">
                           <div className="flex items-center gap-3">
                             <div className="w-10 h-10 bg-white rounded-lg flex items-center justify-center text-slate-300 group-hover:text-emerald-500 transition-colors shadow-sm">
                               <ImagePlus size={20} />
                             </div>
                             <span className="text-xs font-black uppercase tracking-widest">Anexar Print</span>
                           </div>
                           <input type="file" accept="image/*" className="hidden" onChange={handleFileChange} />
                         </label>
                       )}
                    </div>
                  </div>

                  <button type="submit" disabled={submitLoading || !ticketCategory || !ticketSubcategory} className="w-full py-6 bg-slate-900 text-white rounded-[1.5rem] font-black uppercase tracking-[0.25em] text-xs hover:bg-emerald-600 hover:shadow-2xl hover:shadow-emerald-200 transition-all flex items-center justify-center gap-3 group disabled:opacity-50">
                    {submitLoading ? (
                      <div className="w-5 h-5 border-4 border-white/20 border-t-white rounded-full animate-spin"></div>
                    ) : (
                      <>CONCLUIR E ENVIAR TICKET</>
                    )}
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
              className="absolute inset-0 bg-slate-900/60 backdrop-blur-md"
            ></motion.div>
            
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 20 }} 
              animate={{ opacity: 1, scale: 1, y: 0 }} 
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="w-full max-w-3xl bg-white border border-slate-100 rounded-[3rem] shadow-2xl overflow-hidden relative z-10 flex flex-col max-h-[90vh]"
            >
              <div className="p-8 md:p-12 border-b border-slate-50 flex flex-col md:flex-row md:items-center justify-between gap-8 bg-slate-50/30">
                <div className="flex-1">
                  <div className="flex items-center gap-4 mb-4">
                    <span className={`px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-[0.2em] border-2 ${
                      selectedTicket.status === 'Em Análise' ? 'bg-amber-50 text-amber-600 border-amber-200 shadow-sm' :
                      selectedTicket.status === 'Respondido' ? 'bg-blue-50 text-blue-600 border-blue-200 shadow-sm' :
                      selectedTicket.status === 'Resolvido' ? 'bg-emerald-50 text-emerald-600 border-emerald-200 shadow-sm' :
                      'bg-slate-50 text-slate-500 border-slate-200'
                    }`}>
                      {selectedTicket.status}
                    </span>
                    <span className="text-slate-400 text-[10px] font-black uppercase tracking-[0.2em]">
                      ID REF: {selectedTicket.id.substring(0,8).toUpperCase()}
                    </span>
                  </div>
                  <h2 className="text-2xl md:text-3xl font-black uppercase tracking-tight text-slate-900 leading-tight">{selectedTicket.title}</h2>
                </div>
                <button 
                  onClick={() => setSelectedTicket(null)}
                  className="w-14 h-14 rounded-2xl bg-white hover:bg-slate-50 flex items-center justify-center text-slate-400 hover:text-slate-900 transition-all shadow-sm border border-slate-100 flex-shrink-0"
                >
                  <X size={24} />
                </button>
              </div>

              <div className="p-8 md:p-12 overflow-y-auto custom-scrollbar space-y-10">
                {/* GRID DE INFORMAÇÕES */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                   <div className="space-y-1">
                     <p className="text-[10px] font-black uppercase tracking-[0.1em] text-slate-400">Classificação</p>
                     <p className="text-xs font-bold text-slate-700 uppercase">{selectedTicket.category}</p>
                   </div>
                   <div className="space-y-1">
                     <p className="text-[10px] font-black uppercase tracking-[0.1em] text-slate-400">Prioridade</p>
                     <p className={`text-xs font-black uppercase ${
                        selectedTicket.priority === 'Baixa' ? 'text-slate-500' :
                        selectedTicket.priority === 'Média' ? 'text-blue-600' :
                        selectedTicket.priority === 'Alta' ? 'text-orange-600' :
                        'text-rose-600'
                     }`}>{selectedTicket.priority || 'NORMAL'}</p>
                   </div>
                   <div className="space-y-1">
                     <p className="text-[10px] font-black uppercase tracking-[0.1em] text-slate-400">Data Abertura</p>
                     <p className="text-xs font-bold text-slate-700">{new Date(selectedTicket.created_at).toLocaleDateString('pt-BR')}</p>
                   </div>
                   <div className="space-y-1">
                     <p className="text-[10px] font-black uppercase tracking-[0.1em] text-slate-400">Contato</p>
                     <p className="text-xs font-bold text-slate-700">{selectedTicket.phone || 'N/D'}</p>
                   </div>
                </div>

                <div className="space-y-4">
                  <h3 className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-400 border-b border-slate-100 pb-3 flex items-center gap-2">
                    <MessageSquare size={14} className="text-emerald-600" />
                    Histórico do Titular
                  </h3>
                  <div className="bg-slate-50/50 rounded-3xl p-8 border-2 border-slate-50">
                    <p className="text-sm text-slate-600 font-medium whitespace-pre-wrap leading-relaxed">{selectedTicket.description}</p>
                  </div>
                </div>

                {selectedTicket.attachment && (
                  <div className="space-y-4">
                    <h3 className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-400 border-b border-slate-100 pb-3 flex items-center gap-2">
                      <ImagePlus size={14} className="text-emerald-600" />
                      Evidência em Anexo
                    </h3>
                    <div className="rounded-[2rem] overflow-hidden border-4 border-white shadow-2xl bg-slate-100 max-w-lg mx-auto">
                      <img src={selectedTicket.attachment} alt="Anexo" className="w-full h-auto object-contain max-h-[400px] cursor-zoom-in" onClick={() => window.open(selectedTicket.attachment, '_blank')} />
                    </div>
                  </div>
                )}

                {selectedTicket.admin_response && (
                  <div className="space-y-4 pt-4">
                    <h3 className="text-[10px] font-black uppercase tracking-[0.3em] text-emerald-600 border-b-2 border-emerald-100 pb-3 flex items-center gap-2">
                      <Shield size={14} />
                      Resolução por VEMAPI • AGR
                    </h3>
                    <div className="bg-emerald-600 rounded-[2.5rem] p-8 md:p-10 text-white shadow-xl shadow-emerald-100 relative overflow-hidden group">
                      <div className="absolute top-0 right-0 p-8 opacity-10 group-hover:scale-110 transition-transform">
                        <Zap size={120} fill="white" />
                      </div>
                      <p className="text-base md:text-lg font-bold leading-relaxed relative z-10">{selectedTicket.admin_response}</p>
                      <div className="mt-8 flex items-center gap-3 relative z-10">
                        <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center">
                          <CheckCircle2 size={20} />
                        </div>
                        <span className="text-[10px] font-black uppercase tracking-widest text-emerald-100">Chamado Resolvido em {new Date().toLocaleDateString()}</span>
                      </div>
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
