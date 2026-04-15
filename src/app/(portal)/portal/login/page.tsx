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
    <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-6 sm:p-12 relative z-20 font-sans">
      
      {/* Logotipo VEMAPI Premium */}
      <Link href="/" className="flex items-center gap-3 mb-10 md:mb-16 group">
        <div className="w-12 h-12 bg-emerald-600 rounded-xl flex items-center justify-center shadow-lg shadow-emerald-100 group-hover:scale-110 transition-transform">
          <Zap size={24} className="text-white fill-white" />
        </div>
        <div className="flex flex-col">
          <span className="text-2xl font-black tracking-tighter uppercase italic leading-none text-slate-900">VEMAPI</span>
          <span className="text-[8px] tracking-[0.5em] font-bold uppercase leading-none mt-1 text-emerald-600">Portal do Cliente</span>
        </div>
      </Link>

      {/* Elegant Card */}
      <div className="w-full max-w-md bg-white border border-slate-200 rounded-[2.5rem] p-8 md:p-12 shadow-2xl shadow-slate-200/50 relative overflow-hidden">
        {/* Border accent */}
        <div className="absolute top-0 left-0 w-full h-2 bg-emerald-500"></div>
        
        <div className="text-center mb-10">
          <h1 className="text-3xl font-black uppercase tracking-tight text-slate-900 mb-2">Acesso Restrito</h1>
          <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Painel de Gestão e Suporte</p>
        </div>

        {errorMsg && (
          <div className="mb-8 p-4 bg-rose-50 border border-rose-100 rounded-2xl flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-rose-500 text-white flex items-center justify-center flex-shrink-0 shadow-lg shadow-rose-100">
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
            </div>
            <span className="text-rose-600 text-[11px] font-black uppercase leading-tight">{errorMsg}</span>
          </div>
        )}

        <form onSubmit={handleLogin} className="grid gap-6 text-left">
          {/* E-MAIL */}
          <div className="space-y-3">
            <label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 pl-1">E-mail Corporativo</label>
            <div className="relative group">
              <div className="absolute inset-y-0 left-0 pl-5 flex items-center pointer-events-none text-slate-400 group-focus-within:text-emerald-600 transition-colors">
                <Mail size={18} />
              </div>
              <input 
                type="email" 
                required 
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                autoComplete="email"
                placeholder="seu.nome@empresa.com.br" 
                className="w-full bg-slate-50 border-slate-100 placeholder-slate-300 text-slate-900 border-2 py-5 pl-14 pr-5 rounded-2xl outline-none focus:border-emerald-500 focus:bg-white transition-all text-sm font-bold shadow-sm" 
              />
            </div>
          </div>

          {/* SENHA */}
          <div className="space-y-3">
            <div className="flex justify-between items-center pr-1">
              <label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 pl-1">Senha de Acesso</label>
              <button type="button" className="text-[10px] font-black text-emerald-600 hover:text-emerald-700 transition-colors uppercase tracking-widest">Esqueceu?</button>
            </div>
            <div className="relative group">
              <div className="absolute inset-y-0 left-0 pl-5 flex items-center pointer-events-none text-slate-400 group-focus-within:text-emerald-600 transition-colors">
                <Lock size={18} />
              </div>
              <input 
                type="password" 
                required 
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••" 
                className="w-full bg-slate-50 border-slate-100 placeholder-slate-300 text-slate-900 border-2 py-5 pl-14 pr-5 rounded-2xl outline-none focus:border-emerald-500 focus:bg-white transition-all text-sm font-bold tracking-widest shadow-sm" 
              />
            </div>
          </div>

          {/* BOTÃO SUBMIT */}
          <button 
            type="submit" 
            disabled={loading}
            className="w-full mt-6 py-5 bg-slate-900 text-white rounded-2xl font-black uppercase tracking-[0.25em] text-[11px] hover:bg-emerald-600 hover:shadow-2xl hover:shadow-emerald-200 transition-all flex items-center justify-center gap-3 group disabled:opacity-50"
          >
            {loading ? (
              <div className="w-5 h-5 border-4 border-white/20 border-t-white rounded-full animate-spin"></div>
            ) : (
              <>
                ENTRAR NO SISTEMA
                <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
              </>
            )}
          </button>
        </form>

        <div className="mt-10 text-center">
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
            Precisa de ajuda? <Link href="/contato" className="text-emerald-600 font-black hover:underline transition-all">Fale com o suporte</Link>
          </p>
        </div>

      </div>

      {/* FOOTER DO LOGIN */}
      <div className="mt-12 flex items-center gap-3 text-slate-400 text-[10px] uppercase tracking-[0.3em] font-black">
        <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></div>
        <span>Servidor Seguro • Criptografia de Ponta</span>
      </div>
    </div>
  );
}
