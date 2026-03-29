"use client";

import React, { useState } from 'react';
import { Zap, Mail, Lock, ArrowRight, ShieldCheck } from 'lucide-react';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';

export default function PortalLogin() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg('');

    try {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) throw error;
      
      // Login com sucesso
      window.location.href = '/portal/dashboard';
    } catch (err: any) {
      setErrorMsg(err.message || 'Erro ao fazer login. Verifique suas credenciais.');
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-6 sm:p-12 relative z-20">
      
      {/* Logotipo VEMAPI Premium */}
      <Link href="/" className="flex items-center gap-3 mb-10 md:mb-16 group">
        <div className="w-12 h-12 bg-[#10b981] rounded-xl flex items-center justify-center shadow-[0_0_20px_rgba(16,185,129,0.3)] group-hover:scale-110 transition-transform">
          <Zap size={24} fill="white" className="text-white" />
        </div>
        <div className="flex flex-col">
          <span className="text-2xl font-black tracking-tighter uppercase italic leading-none text-white">VEMAPI</span>
          <span className="text-[8px] tracking-[0.5em] font-bold uppercase leading-none mt-1 text-[#10b981]">Portal do Cliente</span>
        </div>
      </Link>

      {/* Glassmorphism Card */}
      <div className="w-full max-w-md bg-white/5 border-white/10 border rounded-[24px] md:rounded-[32px] p-6 md:p-10 shadow-2xl backdrop-blur-xl relative overflow-hidden">
        {/* Glow interno superior */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-32 h-1 bg-gradient-to-r from-transparent via-[#10b981] to-transparent opacity-50"></div>
        
        <div className="text-center mb-8">
          <h1 className="text-2xl md:text-3xl font-black uppercase tracking-tight text-white mb-2">Acesso Restrito</h1>
          <p className="text-xs md:text-sm font-medium text-slate-400">Insira suas credenciais para gerenciar chamados e serviços.</p>
        </div>

        {errorMsg && (
          <div className="mb-6 p-3 bg-red-500/10 border border-red-500/20 rounded-xl flex items-center gap-2">
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-red-500 flex-shrink-0"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
            <span className="text-red-500 text-xs font-medium">{errorMsg}</span>
          </div>
        )}

        <form onSubmit={handleLogin} className="grid gap-5 text-left">
          {/* E-MAIL */}
          <div className="space-y-2">
            <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 pl-1">E-mail Corporativo</label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-500">
                <Mail size={18} />
              </div>
              <input 
                type="email" 
                required 
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                autoComplete="email"
                placeholder="seu.nome@empresa.com.br" 
                className="w-full bg-black/20 border-white/5 placeholder-slate-600 text-white border p-4 pl-12 rounded-xl outline-none focus:border-[#10b981] focus:ring-1 focus:ring-[#10b981] transition-all text-sm font-medium" 
              />
            </div>
          </div>

          {/* SENHA */}
          <div className="space-y-2">
            <div className="flex justify-between items-center pr-1">
              <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 pl-1">Senha de Acesso</label>
              <span className="text-[10px] font-bold text-[#10b981] hover:text-emerald-400 cursor-pointer transition-colors">Esqueceu?</span>
            </div>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-500">
                <Lock size={18} />
              </div>
              <input 
                type="password" 
                required 
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••" 
                className="w-full bg-black/20 border-white/5 placeholder-slate-600 text-white border p-4 pl-12 rounded-xl outline-none focus:border-[#10b981] focus:ring-1 focus:ring-[#10b981] transition-all text-sm font-medium tracking-widest" 
              />
            </div>
          </div>

          {/* BOTÃO SUBMIT */}
          <button 
            type="submit" 
            disabled={loading}
            className="w-full mt-4 py-4 md:py-5 bg-gradient-to-r from-[#10b981] to-emerald-500 text-white rounded-xl font-black uppercase tracking-[0.2em] text-[11px] hover:scale-[1.02] hover:shadow-[0_0_20px_rgba(16,185,129,0.4)] transition-all flex items-center justify-center gap-2 group disabled:opacity-70 disabled:hover:scale-100"
          >
            {loading ? (
              <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
            ) : (
              <>
                ENTRAR NO PAINEL
                <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform" />
              </>
            )}
          </button>
        </form>

      </div>

      {/* FOOTER DO LOGIN */}
      <div className="mt-8 md:mt-12 flex items-center gap-2 text-slate-500 text-[10px] uppercase tracking-widest font-bold">
        <ShieldCheck size={14} className="text-[#10b981]" />
        <span>Acesso Exclusivo para Clientes Assinantes</span>
      </div>
    </div>
  );
}
