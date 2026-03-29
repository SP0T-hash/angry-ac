"use client";
import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Zap, Globe, Shield, Award, Cpu, MousePointer2, ArrowRight, Sun, Moon, X, CheckCircle2, MessageCircle, Lock, AlertCircle, Clock } from 'lucide-react';
import { supabase } from '@/lib/supabase';

export default function VEMAPIPage() {
  const [currentSuffix, setCurrentSuffix] = useState(0);
  const [formStatus, setFormStatus] = useState<'idle' | 'sending' | 'success'>('idle');
  
  const dynamicWords = ["STARTUPS", "SISTEMAS", "NEGÓCIOS", "IDEIAS", "FUTUROS", "APIS"];

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentSuffix((prev) => (prev + 1) % dynamicWords.length);
    }, 2500);
    return () => clearInterval(interval);
  }, []);

  // Mouse Tracking para Spotlight Effect
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      const spotlightCards = document.querySelectorAll('.spotlight-card');
      
      spotlightCards.forEach((card) => {
        const rect = card.getBoundingClientRect();
        const x = ((e.clientX - rect.left) / rect.width) * 100;
        const y = ((e.clientY - rect.top) / rect.height) * 100;
        
        // Garante que os valores fiquem entre 0 e 100
        const clampedX = Math.max(0, Math.min(100, x));
        const clampedY = Math.max(0, Math.min(100, y));
        
        (card as HTMLElement).style.setProperty('--mouse-x', `${clampedX}%`);
        (card as HTMLElement).style.setProperty('--mouse-y', `${clampedY}%`);
      });
    };

    document.addEventListener('mousemove', handleMouseMove);
    return () => document.removeEventListener('mousemove', handleMouseMove);
  }, []);

  // Scroll Reveal Animation
  useEffect(() => {
    const observerOptions = {
      threshold: 0.1,
      rootMargin: '0px 0px -50px 0px'
    };

    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add('reveal-active');
        }
      });
    }, observerOptions);

    const revealElements = document.querySelectorAll('.reveal');
    revealElements.forEach((el) => observer.observe(el));

    return () => observer.disconnect();
  }, []);

  // Estados para o seletor de certificados
  const [selectedTab, setSelectedTab] = useState<'cpf' | 'cnpj'>('cpf');
  const [selectedCertificate, setSelectedCertificate] = useState<string>('nuvem-3');
  
  // Estado para controle do FAQ
  const [expandedFaq, setExpandedFaq] = useState<number | null>(null);

  // Variants para animação em cascata
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.05
      }
    }
  };

  const cardVariants = {
    hidden: { 
      opacity: 0, 
      y: 20,
      scale: 0.95
    },
    visible: { 
      opacity: 1, 
      y: 0,
      scale: 1,
      transition: {
        type: "spring" as const,
        stiffness: 400,
        damping: 30,
        mass: 0.8
      }
    },
    exit: { 
      opacity: 0, 
      scale: 0.95,
      transition: {
        type: "spring" as const,
        stiffness: 400,
        damping: 30,
        mass: 0.8
      }
    }
  };

  const certificates = [
    // e-CPF
    { id: 'cpf-a1-1', name: 'e-CPF A1 - 1 ANO', type: 'Digital', hasToken: false, category: 'cpf' },
    { id: 'cpf-a3-1', name: 'e-CPF A3 - 1 ANO', type: 'Físico', hasToken: true, category: 'cpf' },
    { id: 'cpf-a3-3', name: 'e-CPF A3 - 3 ANOS', type: 'Físico', hasToken: true, category: 'cpf' },
    { id: 'pf-a3-3', name: 'PF A3 - 3 ANOS', type: 'Físico', hasToken: true, category: 'cpf' },
    { id: 'nuvem-3', name: 'NUVEM A3 - 3 ANOS', type: 'Cloud', hasToken: false, recommended: true, category: 'cpf' },
    // e-CNPJ
    { id: 'cnpj-a1-1', name: 'e-CNPJ A1 - 1 ANO', type: 'Digital', hasToken: false, recommended: true, category: 'cnpj' },
    { id: 'cnpj-a3-1', name: 'e-CNPJ A3 - 1 ANO', type: 'Físico', hasToken: true, category: 'cnpj' },
    { id: 'cnpj-a3-3', name: 'e-CNPJ A3 - 3 ANOS', type: 'Físico', hasToken: true, category: 'cnpj' },
  ];

  const filteredCertificates = certificates.filter(cert => cert.category === selectedTab);

  // Tema Automático - Detecta tema do sistema
  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const applyTheme = (e: MediaQueryListEvent | MediaQueryList) => {
      if (e.matches) {
        document.documentElement.classList.add('dark');
      } else {
        document.documentElement.classList.remove('dark');
      }
    };
    
    // Aplica tema inicial
    applyTheme(mediaQuery);
    
    // Escuta mudanças no tema
    mediaQuery.addEventListener('change', applyTheme);
    return () => mediaQuery.removeEventListener('change', applyTheme);
  }, []);

  // Toggle manual para override do tema
  const toggleTheme = () => {
    document.documentElement.classList.toggle('dark');
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setFormStatus('sending');
    const formData = new FormData(e.currentTarget);
    const { error } = await supabase.from('leads').insert([{
      nome: formData.get('nome'),
      startup: formData.get('startup'),
      email: formData.get('email'),
    }]);

    if (error) {
      alert("Erro de conexão. Verifique o arquivo supabase.ts");
      setFormStatus('idle');
    } else {
      setFormStatus('success');
    }
  };

  return (
    <div className="min-h-screen transition-colors duration-1000 bg-white dark:bg-[#020617] text-slate-900 dark:text-white">
      {/* BACKGROUND DE VÍDEO E TEXTURA (ESTILO B-HUB) COM PARALLAX */}
      <div className="fixed inset-0 -z-50 overflow-hidden bg-white dark:bg-[#020617]" style={{ transform: 'translateY(0%)' }}>
        <video 
          autoPlay loop muted playsInline 
          className="w-full h-full object-cover opacity-5 dark:opacity-20 grayscale pointer-events-none"
          style={{ transform: 'translateY(0%) scale(1.1)' }}
        >
          <source src="https://assets.mixkit.co/videos/preview/mixkit-digital-animation-of-a-circuit-board-14115-large.mp4" type="video/mp4" />
        </video>
        {/* Textura de Ruído (Noise) */}
        <div className="absolute inset-0 opacity-[0.03] pointer-events-none" 
             style={{ backgroundImage: `url('https://grainy-gradients.vercel.app/noise.svg')` }}></div>
        {/* Gradiente de Fusão para Leitura */}
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_transparent_0%,_rgb(248_250_252)_100%)] dark:bg-[radial-gradient(circle_at_center,_transparent_0%,_#020617_100%)]"></div>
      </div>

      {/* MESH GRADIENTS DE FUNDO - DEEP SPACE */}
      <div className="fixed inset-0 -z-10 overflow-hidden pointer-events-none">
        <div className="absolute top-[-15%] left-[-10%] w-[45%] h-[45%] bg-[#10b981]/5 blur-[160px] rounded-full" />
        <div className="absolute bottom-[5%] right-[-8%] w-[35%] h-[35%] bg-[#10b981]/5 blur-[160px] rounded-full" />
      </div>
      
      {/* HEADER PREMIUM COM GLASSMORPHISM */}
      <header className="sticky top-0 z-50 w-full border-b backdrop-blur-xl border-slate-200 dark:border-white/5 bg-white/90 dark:bg-slate-900/40">
        <div className="max-w-7xl mx-auto px-4 md:px-8 h-16 md:h-20 flex items-center justify-between">
          <div className="flex items-center gap-3 md:gap-4">
            <div className="w-10 h-10 bg-[#10b981] rounded-lg flex items-center justify-center shadow-[0_0_15px_rgba(16,185,129,0.4)]">
              <Zap size={20} fill="white" className="text-white" />
            </div>
            <div className="flex flex-col">
              <span className="text-lg md:text-xl font-black tracking-tighter uppercase italic leading-none text-slate-900 dark:text-white">VEMAPI</span>
              <span className="text-[6px] md:text-[7px] tracking-[0.5em] font-bold uppercase leading-none mt-1 text-slate-900 dark:text-slate-500">Soluções Digitais</span>
            </div>
          </div>

          <nav className="hidden md:flex items-center gap-4 md:gap-6 lg:gap-12 text-[9px] md:text-[10px] font-black uppercase tracking-[0.2em]">
            <a href="#servicos" className="hover:text-[#10b981] transition-colors text-slate-900 dark:text-white">Suporte & Desenvolvimento</a>
            <a href="#contato" className="px-4 md:px-6 py-2 md:py-2.5 bg-[#10b981] text-white rounded-full hover:bg-emerald-600 transition-all border border-[#10b981]/20">Contato</a>
            <button onClick={toggleTheme} className="ml-2 md:ml-4 p-2 rounded-full transition-colors border hover:bg-slate-100 dark:hover:bg-white/5 border-slate-300 dark:border-white/10">
              <Sun size={14} className="text-[#10b981] dark:hidden" />
              <Moon size={14} className="text-[#10b981] hidden dark:block" />
            </button>
            {/* STATUS DO SISTEMA */}
            <div className="flex items-center gap-2 ml-4">
              <div className="relative">
                <div className="w-2 h-2 bg-[#10b981] rounded-full animate-ping"></div>
                <div className="absolute inset-0 w-2 h-2 bg-[#10b981] rounded-full"></div>
              </div>
              <span className="text-[8px] font-black uppercase tracking-wider text-slate-900 dark:text-slate-400 hidden lg:block">
                SYSTEM STATUS: ONLINE
              </span>
            </div>
          </nav>
        </div>
      </header>

      {/* HERO SECTION B-HUB STYLE COM FUNDO TRANSPARENTE */}
      <section className="relative min-h-[85vh] pt-24 md:pt-48 pb-16 md:pb-32 px-6 sm:px-12 overflow-hidden reveal flex items-center justify-center z-40">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[500px] bg-[#10b981]/10 blur-[150px] rounded-full -z-10" />
        
        <div className="max-w-6xl mx-auto text-center relative z-20">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-[#10b981]/20 bg-[#10b981]/5 text-[#10b981] text-[9px] font-black uppercase tracking-[0.3em] mb-12 backdrop-blur-sm">
            <MousePointer2 size={10} /> Tech Partner Curitiba
          </div>
          <h1 className="text-3xl md:text-6xl lg:text-7xl xl:text-[120px] font-black tracking-tighter uppercase italic mb-6 md:mb-8 lg:mb-12 leading-[0.9] pt-2 md:pt-4 text-slate-900 dark:text-white">
            TRANSFORMAMOS <br />IDEIAS EM <br />
            <div className="h-[1.2em] relative inline-flex items-center justify-center overflow-visible mt-2">
              <AnimatePresence mode="wait">
                <motion.span 
                  className="bg-clip-text text-transparent bg-gradient-to-r from-[#10b981] to-emerald-300 inline-block"
                  key={currentSuffix}
                  initial={{ opacity: 0, y: 40, filter: "blur(4px)" }}
                  animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
                  exit={{ opacity: 0, y: -40, filter: "blur(4px)" }}
                  transition={{ duration: 0.4, ease: "easeOut" }}
                >
                  {dynamicWords[currentSuffix]}
                </motion.span>
              </AnimatePresence>
            </div>
          </h1>
          
          <p className="max-w-2xl mx-auto mb-10 md:mb-14 text-base md:text-lg lg:text-xl leading-relaxed text-slate-600 dark:text-slate-400 font-medium tracking-wide">
            A infraestrutura inteligente e o braço técnico que a sua empresa precisa para <span className="text-slate-800 dark:text-slate-200 font-bold">escalar com segurança e alta performance</span>. Descomplicando a tecnologia direto de Curitiba.
          </p>

          <a href="#contato" className="group relative inline-flex items-center gap-2 md:gap-4 px-6 md:px-8 lg:px-12 py-3 md:py-4 lg:py-6 bg-white dark:bg-white text-black rounded-full font-black text-xs md:text-xs uppercase tracking-[0.3em] hover:bg-[#10b981] hover:text-white transition-all shadow-2xl hover:shadow-[#10b981]/20 border border-white/20">
            Solicitar Proposta <ArrowRight size={18} className="group-hover:translate-x-2 transition-transform" />
          </a>
        </div>
      </section>



      {/* SEÇÃO QUEM SOMOS - O ADN VEMAPI COM FUNDO TRANSPARENTE */}
      <section className="py-16 md:py-32 px-4 md:px-8 max-w-7xl mx-auto relative z-10 reveal">
        <div className="grid md:grid-cols-2 gap-16 items-center">
          {/* COLUNA ESQUERDA */}
          <div>
            <div className="text-[#10b981] text-[10px] font-black uppercase tracking-widest mb-6">O CÓDIGO POR TRÁS DA MARCA</div>
            <h3 className="text-xl md:text-2xl lg:text-4xl xl:text-5xl font-black tracking-tighter uppercase italic mb-4 md:mb-6 lg:mb-8 leading-[0.8] text-slate-900 dark:text-white">
              Transformando <br />Complexidade <br />em Performance
            </h3>
            <p className="font-medium text-sm md:text-base lg:text-lg leading-relaxed mb-3 md:mb-4 lg:mb-6 text-slate-600 dark:text-slate-400">
              A VEMAPI nasceu em Curitiba com uma missão clara: ser o acelerador técnico que startups e empresas precisam para escalar sem limitações.
            </p>
            <p className="font-medium text-sm md:text-base leading-relaxed text-slate-600 dark:text-slate-400">
              <span className="text-[#10b981] font-black">V</span>elocidade em <span className="text-[#10b981] font-black">M</span>ovimento <span className="text-[#10b981] font-black">via</span> <span className="text-[#10b981] font-black">API</span> - não construímos apenas sites, construímos a infraestrutura que permite o seu negócio crescer sem travas técnicas.
            </p>
          </div>

          {/* COLUNA DIREITA - CARD GLASSMORPHISM */}
          <div className="bg-white/90 border-slate-200 text-slate-900 dark:bg-slate-900/40 dark:border-white/5 dark:text-white rounded-[16px] md:rounded-[20px] lg:rounded-[40px] p-4 md:p-6 lg:p-12 shadow-2xl hover:border-[#10b981]/50 hover:shadow-[0_0_30px_rgba(16,185,129,0.1)] transition-all duration-500 backdrop-blur-xl">
            <div className="text-center">
              <div className="w-16 h-16 bg-[#10b981]/10 rounded-2xl flex items-center justify-center text-[#10b981] mb-8 mx-auto border border-[#10b981]/20">
                <Zap size={32} />
              </div>
              <p className="font-black text-base md:text-lg lg:text-xl leading-relaxed tracking-[0.02em] italic text-slate-800 dark:text-white">
                "Não construímos apenas sites. <br />Construímos a infraestrutura que permite a sua empresa crescer sem travas técnicas."
              </p>
              <div className="mt-6 md:mt-8 text-[9px] md:text-[10px] font-black uppercase tracking-[0.4em] text-slate-500 dark:text-slate-400">
                NOSSA ESSÊNCIA TÉCNICA
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* TECH STACK MARQUEE */}
      <section className="relative py-8 overflow-hidden reveal">
        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent dark:via-white/10"></div>
        <div className="relative flex animate-marquee whitespace-nowrap">
          <div className="flex items-center gap-8 text-[10px] font-black uppercase tracking-widest text-slate-400 dark:text-white/20 opacity-20">
            NEXT.JS • SUPABASE • TAILWIND • TYPESCRIPT • REACT • VERCEL • FLUTTER •
            NEXT.JS • SUPABASE • TAILWIND • TYPESCRIPT • REACT • VERCEL • FLUTTER •
            NEXT.JS • SUPABASE • TAILWIND • TYPESCRIPT • REACT • VERCEL • FLUTTER •
          </div>
        </div>
      </section>

      {/* BENTO GRID DE SERVIÇOS COM BLUR E FUNDO TRANSPARENTE */}
      <section id="servicos" className="py-16 md:py-32 px-6 sm:px-12 max-w-6xl mx-auto relative z-10 reveal">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-stretch">
          
          {/* SERVIÇO ATIVO: SUPORTE N1/N2 COM SPOTLIGHT */}
          <div className="p-6 md:p-8 lg:p-10 xl:p-12 rounded-[16px] md:rounded-[20px] lg:rounded-[40px] bg-white/90 border-slate-200 text-slate-900 dark:bg-slate-900/40 dark:border-white/5 dark:text-white hover:border-[#10b981]/50 hover:shadow-[0_0_30px_rgba(16,185,129,0.1)] transition-all duration-500 shadow-2xl group flex flex-col h-full min-h-[320px] md:min-h-[380px] lg:min-h-[420px] backdrop-blur-xl relative overflow-hidden spotlight-card">
            {/* EFEITO SPOTLIGHT */}
            <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none">
              <div className="absolute inset-0 bg-gradient-radial from-[#10b981]/10 to-transparent spotlight-gradient"></div>
            </div>
            <div className="flex-1 flex flex-col justify-start">
              <div className="w-14 h-14 bg-[#10b981]/10 rounded-2xl flex items-center justify-center text-[#10b981] mb-6 border border-[#10b981]/15">
                <MousePointer2 size={28} />
              </div>
              <h3 className="text-xl md:text-2xl lg:text-3xl font-black mb-4 uppercase italic leading-none tracking-tighter text-slate-900 dark:text-white">Suporte N2 &<br className="hidden lg:block" /> Desenvolvimento</h3>
              <p className="text-sm lg:text-base max-w-xs font-medium tracking-[0.02em] text-slate-700 dark:text-slate-400 mb-6">Pague por um suporte especializado N2 e tenha acesso a Devs Seniores por uma fração do custo de um setor interno.</p>
            </div>
            <div className="mt-auto text-[10px] font-black text-[#10b981] uppercase tracking-[0.4em] flex items-center gap-3">
              <div className="w-2 h-2 bg-[#10b981] rounded-full animate-ping" /> Unidade Ativa
            </div>
          </div>

          {/* CARD DE CERTIFICADOS ATIVO */}
          <div className="p-6 md:p-8 lg:p-10 xl:p-12 rounded-[16px] md:rounded-[20px] lg:rounded-[40px] bg-white/90 border-slate-200 text-slate-900 dark:bg-slate-900/40 dark:border-white/5 dark:text-white hover:border-[#10b981]/50 hover:shadow-[0_0_30px_rgba(16,185,129,0.1)] transition-all duration-500 shadow-2xl group flex flex-col h-full min-h-[320px] md:min-h-[380px] lg:min-h-[420px] backdrop-blur-xl relative overflow-hidden spotlight-card">
            {/* EFEITO SPOTLIGHT */}
            <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none">
              <div className="absolute inset-0 bg-gradient-radial from-[#10b981]/10 to-transparent spotlight-gradient"></div>
            </div>
            <div className="flex-1 flex flex-col justify-start">
              <div className="w-14 h-14 bg-[#10b981]/10 rounded-2xl flex items-center justify-center text-[#10b981] mb-6 border border-[#10b981]/15">
                <Award size={28} />
              </div>
              <h3 className="text-xl md:text-2xl lg:text-3xl font-black mb-4 uppercase italic leading-none tracking-tighter text-slate-900 dark:text-white">Certificados<br className="hidden lg:block" /> Digitais</h3>
              <p className="text-sm lg:text-base max-w-xs font-medium tracking-[0.02em] text-slate-700 dark:text-slate-400 mb-6">Assinaturas digitais oficiais para e-CPF e e-CNPJ com emissão imediata.</p>
            </div>
            <div className="mt-auto text-[10px] font-black text-[#10b981] uppercase tracking-[0.4em] flex items-center gap-3">
              <div className="w-2 h-2 bg-[#10b981] rounded-full animate-ping" /> Unidade Ativa
            </div>
          </div>

          {/* CARD CYBER SECURITY - EM EXPANSÃO */}
          <div className="p-6 md:p-8 lg:p-10 xl:p-12 rounded-[16px] md:rounded-[20px] lg:rounded-[40px] bg-white/90 border-slate-200 text-slate-900 dark:bg-slate-900/40 dark:border-white/5 dark:text-white hover:border-[#10b981]/50 hover:shadow-[0_0_30px_rgba(16,185,129,0.1)] transition-all duration-500 shadow-2xl group flex flex-col h-full min-h-[320px] md:min-h-[380px] lg:min-h-[420px] backdrop-blur-xl relative overflow-hidden spotlight-card">
            {/* EFEITO SPOTLIGHT */}
            <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none">
              <div className="absolute inset-0 bg-gradient-radial from-[#10b981]/10 to-transparent spotlight-gradient"></div>
            </div>
            <div className="flex-1 flex flex-col justify-start">
              <div className="w-14 h-14 bg-[#10b981]/10 rounded-2xl flex items-center justify-center text-[#10b981] mb-6 border border-[#10b981]/15">
                <Shield size={28} />
              </div>
              <h3 className="text-xl md:text-2xl lg:text-3xl font-black mb-4 uppercase italic leading-none tracking-tighter text-slate-900 dark:text-white">Cyber<br className="hidden lg:block" /> Security</h3>
              <p className="text-sm lg:text-base max-w-xs font-medium tracking-[0.02em] text-slate-700 dark:text-slate-400 mb-6">Soluções avançadas de segurança digital em desenvolvimento.</p>
            </div>
            <div className="mt-auto text-[10px] font-black text-[#10b981] uppercase tracking-[0.4em] flex items-center gap-3">
              <div className="w-2 h-2 bg-[#10b981] rounded-full animate-ping" /> Em Expansão
            </div>
          </div>

          {/* CARD INFRAESTRUTURA - EM EXPANSÃO */}
          <div className="p-6 md:p-8 lg:p-10 xl:p-12 rounded-[16px] md:rounded-[20px] lg:rounded-[40px] bg-white/90 border-slate-200 text-slate-900 dark:bg-slate-900/40 dark:border-white/5 dark:text-white hover:border-[#10b981]/50 hover:shadow-[0_0_30px_rgba(16,185,129,0.1)] transition-all duration-500 shadow-2xl group flex flex-col h-full min-h-[320px] md:min-h-[380px] lg:min-h-[420px] backdrop-blur-xl relative overflow-hidden spotlight-card">
            {/* EFEITO SPOTLIGHT */}
            <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none">
              <div className="absolute inset-0 bg-gradient-radial from-[#10b981]/10 to-transparent spotlight-gradient"></div>
            </div>
            <div className="flex-1 flex flex-col justify-start">
              <div className="w-14 h-14 bg-[#10b981]/10 rounded-2xl flex items-center justify-center text-[#10b981] mb-6 border border-[#10b981]/15">
                <Cpu size={28} />
              </div>
              <h3 className="text-xl md:text-2xl lg:text-3xl font-black mb-4 uppercase italic leading-none tracking-tighter text-slate-900 dark:text-white">Infraestrutura<br className="hidden lg:block" /> Cloud</h3>
              <p className="text-sm lg:text-base max-w-xs font-medium tracking-[0.02em] text-slate-700 dark:text-slate-400 mb-6">Arquitetura escalável e otimizada para alta performance.</p>
            </div>
            <div className="mt-auto text-[10px] font-black text-[#10b981] uppercase tracking-[0.4em] flex items-center gap-3">
              <div className="w-2 h-2 bg-[#10b981] rounded-full animate-ping" /> Em Expansão
            </div>
          </div>
        </div>
      </section>

      {/* SEÇÃO DE CERTIFICADOS DIGITAIS */}
      <section className="py-16 md:py-32 px-4 md:px-8 max-w-6xl mx-auto relative z-10 reveal">
        <div className="text-center mb-16">
          <div className="text-[#10b981] text-[10px] font-black uppercase tracking-widest mb-6">CERTIFICADOS DIGITAIS</div>
          <h3 className="text-2xl md:text-3xl lg:text-5xl font-black tracking-tighter uppercase italic mb-8 leading-[0.8] text-slate-900 dark:text-white">
            Escolha Seu <br />Certificado Digital
          </h3>
        </div>

        <div className="max-w-4xl mx-auto">
          {/* CARD PRINCIPAL COM SELETOR E SPOTLIGHT */}
          <div className="bg-white/90 dark:bg-slate-900/40 backdrop-blur-xl border border-slate-200 dark:border-white/5 rounded-[20px] md:rounded-[40px] p-6 md:p-12 shadow-2xl relative overflow-hidden spotlight-card">
            
            {/* SELETOR DE ABAS */}
            <div className="relative mb-8 max-w-xs mx-auto">
              <div className="flex bg-slate-100 dark:bg-slate-800/50 rounded-full p-1 relative">
                <motion.div 
                  layoutId='activeTabCertificadoV2'
                  className="absolute top-1 bottom-1 bg-[#10b981] rounded-full"
                  style={{
                    width: 'calc(50% - 4px)',
                    left: selectedTab === 'cpf' ? '4px' : 'calc(50%)'
                  }}
                  transition={{
                    type: "spring",
                    stiffness: 400,
                    damping: 30
                  }}
                />
                <button
                  onClick={() => {
                    setSelectedTab('cpf');
                    setSelectedCertificate('nuvem-3');
                  }}
                  className={`relative z-10 flex-1 py-3 px-4 rounded-full text-xs md:text-sm font-black uppercase tracking-[0.2em] transition-all duration-300 ${
                    selectedTab === 'cpf' ? 'text-white' : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                  }`}
                >
                  e-CPF
                </button>
                <button
                  onClick={() => {
                    setSelectedTab('cnpj');
                    setSelectedCertificate('cnpj-a1-1');
                  }}
                  className={`relative z-10 flex-1 py-3 px-4 rounded-full text-xs md:text-sm font-black uppercase tracking-[0.2em] transition-all duration-300 ${
                    selectedTab === 'cnpj' ? 'text-white' : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                  }`}
                >
                  e-CNPJ
                </button>
              </div>
            </div>

            {/* GRADE DE OPÇÕES */}
            <motion.div 
              variants={containerVariants}
              initial="hidden"
              animate="visible"
              className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-8"
            >
              <AnimatePresence mode='popLayout'>
                {filteredCertificates.map((cert) => (
                  <motion.div
                    key={cert.id}
                    layout
                    variants={cardVariants}
                    animate={{
                      scale: selectedCertificate === cert.id ? 1.02 : 1,
                    }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => setSelectedCertificate(cert.id)}
                    className={`relative p-6 rounded-xl border-2 cursor-pointer spotlight-card ${
                      selectedCertificate === cert.id
                        ? 'border-[#10b981] bg-[#10b981]/5 shadow-[0_0_20px_rgba(16,185,129,0.2)]'
                        : 'border-slate-200 dark:border-white/10 bg-slate-50/50 dark:bg-slate-800/30 hover:border-slate-300 dark:hover:border-white/20'
                    }`}
                    style={{ 
                      transform: 'translateZ(0)',
                      transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)'
                    }}
                  >
                  {cert.recommended && (
                    <div className="absolute -top-2 -right-2 bg-[#10b981] text-white text-[8px] font-black uppercase tracking-wider px-2 py-1 rounded-full z-10">
                      MAIS VENDIDO
                    </div>
                  )}
                  
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <h4 className="text-slate-900 dark:text-white font-black text-sm uppercase tracking-tight leading-tight">
                        {cert.name}
                      </h4>
                      <p className="text-slate-700 dark:text-slate-400 text-xs font-medium uppercase tracking-wider mt-1">
                        {cert.type}
                      </p>
                    </div>
                    {selectedCertificate === cert.id && (
                      <CheckCircle2 size={20} className="text-[#10b981] flex-shrink-0 ml-3" />
                    )}
                  </div>
                  
                  <div className="space-y-3">
                    <p className="text-slate-700 dark:text-slate-300 text-xs leading-relaxed">
                      {cert.id.includes('a1-1') && 'Certificado digital para uso exclusivo em computadores (PC). Instalação simples e imediata.'}
                      {cert.id.includes('a3-1') && 'Certificado físico com validade de 1 ano para maior segurança. Uso em computadores via porta USB.'}
                      {cert.id.includes('a3-3') && cert.id !== 'pf-a3-3' && 'Certificado físico com validade estendida de 3 anos. Uso em computadores via porta USB.'}
                      {cert.id === 'pf-a3-3' && 'Certificado físico exclusivo para Pessoa Física com 3 anos de validade. Uso em computadores via porta USB.'}
                      {cert.id === 'nuvem-3' && 'A única solução compatível com Celular/Smartphone e Tablet. Máxima flexibilidade sem necessidade de PC.'}
                    </p>
                    
                    {cert.hasToken && (
                      <div className="space-y-2">
                        <div className="flex items-center gap-2 p-2 bg-amber-500/10 border border-amber-500/20 rounded-lg">
                          <span className="text-amber-500 font-bold">⚠️</span>
                          <span className="text-[10px] text-amber-500 font-bold uppercase tracking-wider">
                            REQUER TOKEN/MÍDIA FÍSICA
                          </span>
                        </div>
                        <div className="text-[8px] text-slate-700 dark:text-slate-400 font-medium text-center">
                          Uso em computadores via porta USB.
                        </div>
                      </div>
                    )}
                    
                    {!cert.hasToken && (
                      <div className="flex items-center gap-2 p-2 bg-emerald-500/10 border border-emerald-500/20 rounded-lg">
                        <CheckCircle2 size={14} className="text-emerald-500 flex-shrink-0" />
                        <span className="text-[10px] text-emerald-500 font-bold uppercase tracking-wider">
                          DIGITAL IMEDIATO
                        </span>
                      </div>
                    )}
                  </div>
                </motion.div>
              ))}
              </AnimatePresence>
            </motion.div>

            {/* BOTÃO DE AÇÃO FIXO NA BASE */}
            <div className="mt-8 pt-6 border-t border-slate-200 dark:border-white/10">
              <a 
                href="#contato" 
                className="block w-full py-4 md:py-6 bg-[#10b981] text-white rounded-xl md:rounded-2xl font-black uppercase tracking-[0.3em] text-xs md:text-sm hover:bg-emerald-600 hover:scale-[1.02] transition-all duration-300 text-center shadow-2xl hover:shadow-[#10b981]/20 border border-[#10b981]/20"
              >
                SOLICITAR EMISSÃO AGORA
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* SEÇÃO COMPARATIVA TI INTERNO VS VEMAPI - BENTO GRID */}
      <section className="py-16 md:py-32 px-6 sm:px-12 max-w-6xl mx-auto relative z-10 reveal">
        <div className="text-center mb-16">
          <div className="text-[#10b981] text-[10px] font-black uppercase tracking-widest mb-6">ECONOMIA PARA PMES</div>
          <h3 className="text-xl md:text-2xl lg:text-3xl xl:text-5xl font-black tracking-tighter uppercase italic mb-6 md:mb-8 leading-[0.8] text-slate-900 dark:text-white">
            SEU DEPARTAMENTO DE TI, <br />SEM O CUSTO DE UM.
          </h3>
        </div>
        
        {/* PLANOS DE SUPORTE PME */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 lg:gap-8 items-stretch mb-12">
          
          {/* Plano 1: VEMAPI START */}
          <div className="bg-white/95 border border-slate-200 dark:bg-slate-900/40 dark:border-white/5 rounded-[20px] p-6 lg:p-8 hover:border-[#10b981]/50 hover:shadow-[0_0_30px_rgba(16,185,129,0.1)] transition-all duration-300 spotlight-card relative overflow-hidden backdrop-blur-xl flex flex-col h-full">
            <div className="spotlight-gradient"></div>
            <div className="relative z-10 flex flex-col h-full">
              <div className="inline-flex flex-shrink-0 self-start items-center gap-2 px-3 py-1 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 text-[8px] font-black uppercase tracking-wider mb-4 border border-slate-200 dark:border-slate-700">
                <span className="w-2 h-2 bg-slate-400 rounded-full"></span>
                ESSENCIAL PME
              </div>
              <h4 className="text-slate-900 dark:text-white font-black text-lg md:text-xl uppercase tracking-tight mb-3">VEMAPI START</h4>
              <div className="text-3xl md:text-4xl font-black text-[#10b981] mb-6 leading-tight">R$ 1.190<span className="text-sm font-normal text-slate-600 dark:text-slate-400">/mês</span></div>
              <ul className="space-y-4 mb-8 flex-1">
                <li className="flex items-start gap-3 text-sm text-slate-700 dark:text-slate-300">
                  <CheckCircle2 size={18} className="text-[#10b981] flex-shrink-0 mt-0.5" />
                  <span><strong>Suporte N1:</strong> Atendimento remoto ágil via Helpdesk para colaboradores</span>
                </li>
                <li className="flex items-start gap-3 text-sm text-slate-700 dark:text-slate-300">
                  <CheckCircle2 size={18} className="text-[#10b981] flex-shrink-0 mt-0.5" />
                  <span><strong>Gestão de Ativos:</strong> Auditoria e controle de computadores e notebooks</span>
                </li>
                <li className="flex items-start gap-3 text-sm text-slate-700 dark:text-slate-300">
                  <CheckCircle2 size={18} className="text-[#10b981] flex-shrink-0 mt-0.5" />
                  <span><strong>Pacote de Produtividade:</strong> Configuração de e-mails, acessos e impressoras</span>
                </li>
                <li className="flex items-start gap-3 text-sm text-slate-700 dark:text-slate-300">
                  <CheckCircle2 size={18} className="text-[#10b981] flex-shrink-0 mt-0.5" />
                  <span><strong>SLA de Resposta:</strong> Até 2 horas úteis para início da tratativa</span>
                </li>
              </ul>
              <div className="mt-auto">
                <a href="#contato" className="flex items-center justify-center w-full py-3.5 bg-slate-900 dark:bg-white text-white dark:text-slate-900 rounded-lg font-black uppercase tracking-[0.2em] text-xs hover:bg-slate-800 dark:hover:bg-slate-100 transition-all text-center">
                  FALAR COM ESPECIALISTA
                </a>
              </div>
            </div>
          </div>

          {/* Plano 2: VEMAPI SCALE (DESTAQUE) */}
          <div className="bg-white/95 border-2 border-[#10b981] dark:bg-slate-900/40 dark:border-[#10b981]/50 rounded-[20px] p-6 lg:p-8 hover:shadow-[0_0_30px_rgba(16,185,129,0.2)] transition-all duration-300 spotlight-card relative backdrop-blur-xl transform md:scale-105 md:-translate-y-2 flex flex-col h-full z-20">
            <div className="absolute inset-0 overflow-hidden rounded-[18px]">
              <div className="spotlight-gradient"></div>
            </div>
            
            {/* Tag visual Mais Escolhido sobreposta ao card livre do overflow */}
            <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 bg-[#10b981] text-white text-[9px] font-black uppercase tracking-wider px-4 py-1.5 rounded-full shadow-lg whitespace-nowrap z-20 border border-[#10b981]/50">
              O MAIS ESCOLHIDO
            </div>
            
            <div className="relative z-10 flex flex-col h-full mt-4 md:mt-2">
              <h4 className="text-slate-900 dark:text-white font-black text-lg md:text-xl uppercase tracking-tight mb-3">VEMAPI SCALE</h4>
              <div className="text-3xl md:text-4xl font-black text-[#10b981] mb-6 leading-tight">R$ 2.490<span className="text-sm font-normal text-slate-600 dark:text-slate-400">/mês</span></div>
              <ul className="space-y-4 mb-8 flex-1">
                <li className="flex items-start gap-3 text-sm text-slate-700 dark:text-slate-300">
                  <CheckCircle2 size={18} className="text-[#10b981] flex-shrink-0 mt-0.5" />
                  <span><strong>Cyber Security:</strong> Proteção de endpoints, Antivírus Pro e Anti-Ransomware</span>
                </li>
                <li className="flex items-start gap-3 text-sm text-slate-700 dark:text-slate-300">
                  <CheckCircle2 size={18} className="text-[#10b981] flex-shrink-0 mt-0.5" />
                  <span><strong>Suporte N2 Avançado:</strong> Resolução de incidentes críticos em servidores e rede local</span>
                </li>
                <li className="flex items-start gap-3 text-sm text-slate-700 dark:text-slate-300">
                  <CheckCircle2 size={18} className="text-[#10b981] flex-shrink-0 mt-0.5" />
                  <span><strong>Backup Gerenciado:</strong> Cópias em nuvem monitoradas da base de dados e arquivos vitais</span>
                </li>
                <li className="flex items-start gap-3 text-sm text-slate-700 dark:text-slate-300">
                  <CheckCircle2 size={18} className="text-[#10b981] flex-shrink-0 mt-0.5" />
                  <span><strong>SLA Prioritário:</strong> Tratativa imediata/Até 1h com monitoramento proativo de quedas</span>
                </li>
              </ul>
              <div className="mt-auto">
                <a href="#contato" className="flex items-center justify-center w-full py-3.5 bg-[#10b981] text-white rounded-lg font-black uppercase tracking-[0.2em] text-xs hover:bg-emerald-600 transition-all shadow-lg text-center">
                  ASSINAR PLANO SCALE
                </a>
              </div>
            </div>
          </div>

          {/* Plano 3: VEMAPI ELITE */}
          <div className="bg-white/95 border border-slate-200 dark:bg-slate-900/40 dark:border-white/5 rounded-[20px] p-6 lg:p-8 hover:border-[#10b981]/50 hover:shadow-[0_0_30px_rgba(16,185,129,0.1)] transition-all duration-300 spotlight-card relative overflow-hidden backdrop-blur-xl flex flex-col h-full">
            <div className="spotlight-gradient"></div>
            <div className="relative z-10 flex flex-col h-full">
              <div className="inline-flex self-start flex-shrink-0 items-center gap-2 px-3 py-1 rounded-full bg-slate-100 dark:bg-slate-800 text-purple-600 dark:text-purple-400 text-[8px] font-black uppercase tracking-wider mb-4 border border-purple-500/20">
                <Shield size={10} />
                CONSULTORIA ESTRATÉGICA
              </div>
              <h4 className="text-slate-900 dark:text-white font-black text-lg md:text-xl uppercase tracking-tight mb-3">VEMAPI ELITE</h4>
              <div className="text-2xl md:text-3xl font-black text-[#10b981] mb-6 leading-tight mt-1">SOB<br className="md:hidden" /> MEDIDA</div>
              <ul className="space-y-4 mb-8 flex-1">
                <li className="flex items-start gap-3 text-sm text-slate-700 dark:text-slate-300">
                  <CheckCircle2 size={18} className="text-[#10b981] flex-shrink-0 mt-0.5" />
                  <span><strong>Fractional CTO:</strong> Um consultor de mercado projetando o fluxo da sua tecnologia</span>
                </li>
                <li className="flex items-start gap-3 text-sm text-slate-700 dark:text-slate-300">
                  <CheckCircle2 size={18} className="text-[#10b981] flex-shrink-0 mt-0.5" />
                  <span><strong>Squads On-Demand:</strong> Desenvolvedores Sêniores alocados ao seu projeto ou SaaS</span>
                </li>
                <li className="flex items-start gap-3 text-sm text-slate-700 dark:text-slate-300">
                  <CheckCircle2 size={18} className="text-[#10b981] flex-shrink-0 mt-0.5" />
                  <span><strong>Infraestrutura Cloud:</strong> Migração, automação e arquitetura elástica (AWS, GCP, Azure)</span>
                </li>
                <li className="flex items-start gap-3 text-sm text-slate-700 dark:text-slate-300">
                  <CheckCircle2 size={18} className="text-[#10b981] flex-shrink-0 mt-0.5" />
                  <span><strong>Disponibilidade 24/7:</strong> Canal exclusivo, reuniões semanais e equipe dedicada</span>
                </li>
              </ul>
              <div className="mt-auto">
                <a href="#contato" className="flex items-center justify-center w-full py-3.5 bg-slate-900 dark:bg-white text-white dark:text-slate-900 rounded-lg font-black uppercase tracking-[0.2em] text-xs hover:bg-slate-800 dark:hover:bg-slate-100 transition-all text-center">
                  DIRECIONAR AO PARCEIRO
                </a>
              </div>
            </div>
          </div>
        </div>
      </section>
      {/* FAQ EDUCATIVO - DESCOMPLICANDO A TECNOLOGIA */}
      <section className="py-20 px-6 sm:px-12 max-w-6xl mx-auto relative z-10 reveal">
        <div className="text-center mb-16">
          <div className="text-[#10b981] text-[10px] font-black uppercase tracking-widest mb-6">EDUCAÇÃO TÉCNICA</div>
          <h3 className="text-xl md:text-2xl lg:text-3xl xl:text-4xl font-black tracking-tighter uppercase italic mb-6 md:mb-8 leading-[0.8] text-slate-900 dark:text-white">
            Perguntas <br />Frequentes
          </h3>
        </div>

        <div className="max-w-3xl mx-auto space-y-4">
          {[
            {
              id: 1,
              q: "O que é o Suporte N1 e N2 da VEMAPI?",
              a: (
                <div className="space-y-4">
                  <p>Nossa estrutura de suporte é dividida em níveis reais para solucionar tudo com agilidade:</p>
                  <div>
                    <strong className="text-[#10b981] block mb-1">Suporte N1:</strong>
                    <p>Resolve problemas imediatos, acesso e dúvidas rápidas. Nosso tempo de resposta é quase instantâneo.</p>
                  </div>
                  <div>
                    <strong className="text-[#10b981] block mb-1">Suporte N2:</strong>
                    <p>O nível sênior. Especialistas em infraestrutura e codificação prontos para intervir de imediato.</p>
                  </div>
                </div>
              )
            },
            {
              id: 2,
              q: "Por que minha empresa precisa de um Certificado Digital?",
              a: (
                <div className="space-y-2">
                  <p>O Certificado Digital é sua identidade jurídica irrevogável. Essencial para:</p>
                  <ul className="list-disc list-inside space-y-1 text-sm mt-2 ml-2">
                    <li>Assinar contratos com validade jurídica</li>
                    <li>Emitir notas fiscais via sistemas (e-CNPJ)</li>
                    <li>Acessar portais governamentais com segurança total</li>
                    <li>Ganhar agilidade desburocratizando fechamentos</li>
                  </ul>
                </div>
              )
            },
            {
              id: 3,
              q: "A VEMAPI constrói do zero nossa infraestrutura Cloud?",
              a: <p>Sim. Migramos e construímos arquiteturas em plataformas robustas de nuvem, focando em alta disponibilidade, custos enxutos e segurança. Preparamos sua operação para escalar sem quedas de recursos.</p>
            },
            {
              id: 4,
              q: "Como funciona a contratação de Desenvolvimento sob Demanda?",
              a: <p>Para o modelo 'On-Demand', mapeamos suas necessidades em uma consultoria técnica, projetamos o escopo de tempo (em horas) e desenvolvemos as automações, APIs ou integrações que sua empresa necessite. Sem mensalidade amarrada.</p>
            },
            {
              id: 5,
              q: "Meus dados estarão seguros?",
              a: <p>Nossa abordagem principal é <strong>Cyber Security</strong> de partida. Aplicamos protocolos estritos de criptografia e gerenciamento de permissões em toda nossa stack de desenvolvimento de software e gerenciamento de infraestrutura.</p>
            }
          ].map((faq) => (
            <div key={faq.id} className="bg-white/95 border border-slate-200 dark:bg-slate-900/40 dark:border-white/10 rounded-xl overflow-hidden backdrop-blur-xl group hover:border-[#10b981]/50 transition-colors duration-300">
              <button
                onClick={() => setExpandedFaq(expandedFaq === faq.id ? null : faq.id)}
                className="w-full p-5 md:p-6 text-left flex items-center justify-between bg-transparent transition-colors outline-none"
              >
                <h4 className={`font-black text-sm md:text-base uppercase tracking-tight pr-8 transition-colors ${expandedFaq === faq.id ? 'text-[#10b981]' : 'text-slate-900 dark:text-white group-hover:text-[#10b981]'}`}>
                  {faq.q}
                </h4>
                <motion.div
                  animate={{ rotate: expandedFaq === faq.id ? 180 : 0 }}
                  transition={{ duration: 0.3 }}
                  className={`flex-shrink-0 flex items-center justify-center w-8 h-8 rounded-full ${expandedFaq === faq.id ? 'bg-[#10b981]/10 text-[#10b981]' : 'bg-slate-100 dark:bg-slate-800 text-slate-500 group-hover:bg-[#10b981]/10 group-hover:text-[#10b981]'} transition-colors`}
                >
                  <ArrowRight size={16} />
                </motion.div>
              </button>
              <AnimatePresence>
                {expandedFaq === faq.id && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.3, ease: "easeInOut" }}
                    className="overflow-hidden"
                  >
                    <div className="p-5 md:p-6 pt-0 text-sm md:text-base text-slate-700 dark:text-slate-300 leading-relaxed border-t border-slate-100 dark:border-white/5 mt-2">
                      {faq.a}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          ))}
        </div>
      </section>

      {/* CONTATO ULTRA-CLEAN COM FUNDO TRANSPARENTE */}
      <section id="contato" className="py-20 md:py-40 px-6 sm:px-12 max-w-6xl mx-auto relative z-30 reveal">
        <div className="max-w-4xl mx-auto border border-slate-200 dark:border-white/5 bg-white/95 text-slate-900 dark:bg-slate-900/40 dark:text-white rounded-[20px] md:rounded-[30px] lg:rounded-[60px] p-6 md:p-8 lg:p-12 lg:p-24 text-center shadow-2xl backdrop-blur-xl relative z-30">
          <h2 className="text-2xl md:text-3xl lg:text-4xl xl:text-6xl font-black mb-4 md:mb-6 lg:mb-8 uppercase italic leading-none tracking-tighter text-slate-900 dark:text-white">Vamos <span className="text-[#10b981]">Escalar?</span></h2>
          <p className="mb-8 md:mb-12 lg:mb-16 text-xs md:text-xs lg:text-sm uppercase tracking-[0.3em] font-bold text-slate-700 dark:text-slate-400">Resposta técnica em menos de 12 horas.</p>
          
          {formStatus === 'success' ? (
            <div className="py-20 text-[#10b981] font-black text-xl tracking-[0.5em] animate-pulse">SOLICITAÇÃO RECEBIDA</div>
          ) : (
            <form onSubmit={handleSubmit} className="grid gap-4">
              <div className="grid md:grid-cols-2 gap-4">
                <input name="nome" required placeholder="NOME" className="w-full bg-slate-100 dark:bg-slate-800 border-slate-300 dark:border-white/20 text-slate-900 dark:text-white placeholder-slate-700 dark:placeholder-white/50 border p-3 md:p-4 lg:p-6 rounded-lg md:rounded-xl lg:rounded-2xl outline-none focus:border-[#10b981] transition-all text-[9px] md:text-[10px] font-bold tracking-[0.2em] uppercase" />
                <input name="email" type="email" required placeholder="E-MAIL" className="w-full bg-slate-100 dark:bg-slate-800 border-slate-300 dark:border-white/20 text-slate-900 dark:text-white placeholder-slate-700 dark:placeholder-white/50 border p-3 md:p-4 lg:p-6 rounded-lg md:rounded-xl lg:rounded-2xl outline-none focus:border-[#10b981] transition-all text-[9px] md:text-[10px] font-bold tracking-[0.2em] uppercase" />
              </div>
              <textarea name="startup" required placeholder="PROJETO" rows={3} className="w-full bg-slate-100 dark:bg-slate-800 border-slate-300 dark:border-white/20 text-slate-900 dark:text-white placeholder-slate-700 dark:placeholder-white/50 border p-3 md:p-4 lg:p-6 rounded-lg md:rounded-xl lg:rounded-2xl outline-none focus:border-[#10b981] transition-all text-[9px] md:text-[10px] font-bold tracking-[0.2em] uppercase" />
              <button type="submit" className="w-full py-4 md:py-6 lg:py-8 bg-[#10b981] text-white rounded-lg md:rounded-xl lg:rounded-2xl font-black uppercase tracking-[0.5em] text-[9px] md:text-[10px] hover:scale-[1.02] transition-all shadow-2xl hover:shadow-[#10b981]/20 border border-[#10b981]/20">
                {formStatus === 'sending' ? 'PROCESSANDO...' : 'ENVIAR PROPOSTA'}
              </button>
            </form>
          )}
        </div>
      </section>

      {/* CONTROLE DE CARREIRAS - TRABALHE CONOSCO (Oculto temporariamente) */}
      {false && (
        <section id="carreiras" className="py-20 md:py-32 px-6 sm:px-12 max-w-6xl mx-auto relative z-20 reveal">
          <div className="grid md:grid-cols-2 gap-12 lg:gap-24 items-center">
            {/* LADO ESQUERDO: TEXTO DE CARREIRAS */}
            <div>
              <div className="text-[#10b981] text-[10px] font-black uppercase tracking-widest mb-6">FAÇA PARTE DO TIME</div>
              <h3 className="text-2xl md:text-3xl lg:text-5xl font-black tracking-tighter uppercase italic mb-6 leading-[0.8] text-slate-900 dark:text-white">
                VEMAPI <br />TALENTS
              </h3>
              <p className="font-medium text-sm md:text-base leading-relaxed mb-6 text-slate-600 dark:text-slate-400">
                Buscamos mentes inquietas. Desenvolvedores, especialistas em infraestrutura, resolvedores de problemas natos que queiram impactar de verdade o ecossistema PME.
              </p>
              <p className="font-bold text-xs md:text-sm uppercase tracking-wider text-slate-800 dark:text-slate-200">
                🚀 Vagas abertas para:
              </p>
              <div className="flex flex-wrap gap-2 mt-4">
                <span className="px-3 py-1.5 bg-slate-100 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-full text-[10px] font-black uppercase tracking-wider text-slate-700 dark:text-slate-300">Suporte N1/N2</span>
                <span className="px-3 py-1.5 bg-slate-100 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-full text-[10px] font-black uppercase tracking-wider text-slate-700 dark:text-slate-300">Dev Fullstack</span>
                <span className="px-3 py-1.5 bg-slate-100 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-full text-[10px] font-black uppercase tracking-wider text-slate-700 dark:text-slate-300">Cloud Architect</span>
              </div>
            </div>

            {/* LADO DIREITO: FORMULÁRIO DE CURRÍCULO (GLASSMORPHISM) */}
            <div className="bg-white/95 border-slate-200 text-slate-900 dark:bg-slate-900/40 dark:border-white/5 dark:text-white rounded-[20px] lg:rounded-[40px] p-6 lg:p-10 shadow-2xl backdrop-blur-xl relative overflow-hidden spotlight-card border">
              <div className="spotlight-gradient"></div>
              <form className="relative z-10 grid gap-4">
                <div className="grid md:grid-cols-2 gap-4">
                  <input type="text" required placeholder="NOME COMPLETO" className="w-full bg-slate-100 dark:bg-slate-800 border-slate-300 dark:border-white/10 text-slate-900 dark:text-white placeholder-slate-500 dark:placeholder-white/40 border p-3 md:p-4 rounded-xl outline-none focus:border-[#10b981] transition-all text-[9px] font-bold tracking-[0.2em] uppercase" />
                  <input type="email" required placeholder="E-MAIL" className="w-full bg-slate-100 dark:bg-slate-800 border-slate-300 dark:border-white/10 text-slate-900 dark:text-white placeholder-slate-500 dark:placeholder-white/40 border p-3 md:p-4 rounded-xl outline-none focus:border-[#10b981] transition-all text-[9px] font-bold tracking-[0.2em] uppercase" />
                </div>
                <input type="url" placeholder="LINK DO LINKEDIN OU GITHUB" className="w-full bg-slate-100 dark:bg-slate-800 border-slate-300 dark:border-white/10 text-slate-900 dark:text-white placeholder-slate-500 dark:placeholder-white/40 border p-3 md:p-4 rounded-xl outline-none focus:border-[#10b981] transition-all text-[9px] font-bold tracking-[0.2em] uppercase" />
                
                {/* ÁREA DE UPLOAD DE ARQUIVO */}
                <div className="mt-2 relative">
                  <input 
                    type="file" 
                    id="curriculo" 
                    accept=".pdf,.doc,.docx"
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                  />
                  <div className="w-full border-2 border-dashed border-slate-300 dark:border-white/20 rounded-xl p-6 text-center bg-slate-50 dark:bg-white/5 group-hover:border-[#10b981] transition-colors relative flex flex-col items-center justify-center gap-2">
                    <div className="w-10 h-10 bg-slate-200 dark:bg-slate-800 rounded-full flex items-center justify-center text-slate-600 dark:text-slate-400">
                      <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" x2="12" y1="3" y2="15"/></svg>
                    </div>
                    <span className="text-[10px] font-black uppercase tracking-widest text-slate-600 dark:text-slate-400">ANEXAR CURRÍCULO (PDF)</span>
                  </div>
                </div>

                <button type="submit" className="w-full mt-4 py-4 md:py-5 bg-[#10b981] text-white rounded-xl font-black uppercase tracking-[0.3em] text-[10px] hover:bg-emerald-600 transition-all text-center shadow-lg hover:shadow-[#10b981]/20">
                  ENVIAR APLICAÇÃO
                </button>
              </form>
            </div>
          </div>
        </section>
      )}

      {/* MARQUEE DE TECNOLOGIAS ACIMA DO FOOTER */}
      <section className="relative py-6 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-slate-100/50 to-transparent dark:via-slate-800/50"></div>
        <div className="relative flex animate-marquee whitespace-nowrap">
          <div className="flex items-center gap-8 text-[10px] md:text-[12px] font-black uppercase tracking-widest text-slate-700 dark:text-slate-400">
            NEXT.JS • SUPABASE • FLUTTER • TAILWIND CSS • TYPESCRIPT • VERCEL •
            NEXT.JS • SUPABASE • FLUTTER • TAILWIND CSS • TYPESCRIPT • VERCEL •
            NEXT.JS • SUPABASE • FLUTTER • TAILWIND CSS • TYPESCRIPT • VERCEL •
            NEXT.JS • SUPABASE • FLUTTER • TAILWIND CSS • TYPESCRIPT • VERCEL •
          </div>
        </div>
      </section>

      {/* FOOTER ELITE PADRÃO AGÊNCIA */}
      <footer className="relative z-10 border-t border-white/5 bg-[#020617]">
        {/* MARQUEE FINAL - TOQUE SUTIL */}
        <div className="relative py-4 overflow-hidden">
          <div className="flex animate-marquee whitespace-nowrap">
            <div className="flex items-center gap-8 text-[8px] font-black uppercase tracking-widest text-white/10">
              VELOCIDADE • ESTRATÉGIA • ESCALABILIDADE • DESIGN • PERFORMANCE •
              VELOCIDADE • ESTRATÉGIA • ESCALABILIDADE • DESIGN • PERFORMANCE •
              VELOCIDADE • ESTRATÉGIA • ESCALABILIDADE • DESIGN • PERFORMANCE •
              VELOCIDADE • ESTRATÉGIA • ESCALABILIDADE • DESIGN • PERFORMANCE •
            </div>
          </div>
        </div>
        
        <div className="max-w-7xl mx-auto px-4 md:px-8 py-16">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 md:gap-16">
            {/* COLUNA 1 - LOGO E SLOGAN */}
            <div className="flex flex-col space-y-4">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-[#10b981] rounded-lg flex items-center justify-center shadow-[0_0_15px_rgba(16,185,129,0.4)]">
                  <Zap size={16} fill="white" className="text-white" />
                </div>
                <span className="text-lg font-black tracking-tighter uppercase italic text-white">VEMAPI</span>
              </div>
              <p className="text-xs text-white/60 font-medium leading-relaxed max-w-xs">
                Velocidade em Movimento via API - A infraestrutura que seu negócio precisa para escalar sem limitações.
              </p>
            </div>

            {/* COLUNA 2 - LINKS RÁPIDOS */}
            <div className="flex flex-col space-y-3">
              <h4 className="text-[10px] font-black uppercase tracking-widest text-white/40 mb-2">Navegação</h4>
              <a href="#servicos" className="text-xs text-white/60 hover:text-[#10b981] transition-colors font-medium">Serviços</a>
              <a href="#contato" className="text-xs text-white/60 hover:text-[#10b981] transition-colors font-medium">Contato</a>
              <a href="#" className="text-xs text-white/60 hover:text-[#10b981] transition-colors font-medium">Sobre Nós</a>
            </div>

            {/* COLUNA 3 - LOCALIZAÇÃO */}
            <div className="flex flex-col space-y-3">
              <h4 className="text-[10px] font-black uppercase tracking-widest text-white/40 mb-2">Localização</h4>
              <p className="text-xs text-white/60 font-medium leading-relaxed">
                Curitiba - PR<br />
                Brasil<br />
                Tech Partner Curitiba
              </p>
            </div>
          </div>

          <div className="mt-12 pt-8 border-t border-white/10 text-center">
            <p className="text-[9px] font-black uppercase tracking-[1em] text-white/30">
              VEMAPI • CURITIBA • BRAZIL • 2026
            </p>
          </div>
        </div>
      </footer>

      {/* WHATSAPP FLOTANTE COM TOOLTIP */}
      <div className="fixed bottom-6 right-6 z-50">
        <a 
          href="https://wa.me/5541999999999?text=Ol%C3%A1!%20Tenho%20interesse%20em%20um%20Certificado%20Digital" 
          target="_blank" 
          rel="noopener noreferrer"
          className="relative block w-14 h-14 bg-[#10b981] rounded-full flex items-center justify-center shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-110 group shadow-[#10b981]/20"
        >
          <MessageCircle size={24} className="text-white" />
          <div className="absolute inset-0 rounded-full bg-[#10b981] animate-ping opacity-20"></div>
          {/* TOOLTIP */}
          <div className="absolute bottom-full right-0 mb-2 px-3 py-2 bg-slate-900 dark:bg-slate-700 text-white text-xs font-black rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-300 whitespace-nowrap after:content-[''] after:absolute after:top-full after:right-4 after:border-4 after:border-transparent after:border-t-slate-900 after:dark:border-t-slate-700">
            Precisa de ajuda com seu Certificado?
          </div>
        </a>
      </div>
    </div>
  );
}