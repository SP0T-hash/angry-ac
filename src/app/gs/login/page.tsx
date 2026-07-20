'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Building2, Lock, Mail, LogIn } from 'lucide-react';

export default function GSLoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [senha, setSenha] = useState('');
  const [loading, setLoading] = useState(false);
  const [erro, setErro] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErro('');
    try {
      const res = await fetch('/api/gs/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, senha }),
      });
      const data = await res.json();
      if (!res.ok) {
        setErro(data.error || 'Falha no login.');
        return;
      }
      router.push(data.redirect || '/gs/dashboard');
      router.refresh();
    } catch {
      setErro('Erro de conexão. Tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-emerald-50 via-slate-50 to-indigo-50 p-4">
      <div className="w-full max-w-md">
        <div className="bg-white rounded-2xl shadow-card border border-slate-100 p-8">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-11 h-11 rounded-xl bg-emerald-600 text-white flex items-center justify-center shadow-lg shadow-emerald-200">
              <Building2 size={22} />
            </div>
            <div>
              <h1 className="text-slate-900 font-black text-lg tracking-tight">GS · Gestão</h1>
              <p className="text-[11px] text-slate-400 font-bold uppercase tracking-widest">Core-AR · VEMAPI</p>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="text-xs font-bold text-slate-500 uppercase tracking-wide">Email</label>
              <div className="mt-1.5 flex items-center gap-2 rounded-xl border border-slate-200 px-3 focus-within:ring-2 focus-within:ring-emerald-500/40 focus-within:border-emerald-400 transition">
                <Mail size={16} className="text-slate-400" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="admin@acangry.com"
                  className="flex-1 py-2.5 bg-transparent outline-none text-sm text-slate-800"
                  autoComplete="username"
                />
              </div>
            </div>

            <div>
              <label className="text-xs font-bold text-slate-500 uppercase tracking-wide">Senha</label>
              <div className="mt-1.5 flex items-center gap-2 rounded-xl border border-slate-200 px-3 focus-within:ring-2 focus-within:ring-emerald-500/40 focus-within:border-emerald-400 transition">
                <Lock size={16} className="text-slate-400" />
                <input
                  type="password"
                  value={senha}
                  onChange={(e) => setSenha(e.target.value)}
                  placeholder="••••••••"
                  className="flex-1 py-2.5 bg-transparent outline-none text-sm text-slate-800"
                  autoComplete="current-password"
                />
              </div>
            </div>

            {erro && (
              <div className="text-sm text-rose-600 bg-rose-50 border border-rose-100 rounded-lg px-3 py-2">
                {erro}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full h-11 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-sm shadow-lg shadow-emerald-600/20 transition active:scale-[0.98] disabled:opacity-50 flex items-center justify-center gap-2"
            >
              <LogIn size={16} />
              {loading ? 'Entrando...' : 'Entrar'}
            </button>
          </form>

          <p className="mt-4 text-center text-[11px] text-slate-400">
            Acesso restrito · multi-tenant AC / AR / Unidade / Contador
          </p>
        </div>
      </div>
    </div>
  );
}
