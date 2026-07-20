'use client';

import React, { useCallback, useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Building2, Lock, Mail, LogIn, AlertCircle } from 'lucide-react';

declare global {
  interface Window {
    grecaptcha?: any;
    onGSRecaptchaLoad?: () => void;
  }
}

export default function GSLoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [senha, setSenha] = useState('');
  const [loading, setLoading] = useState(false);
  const [erro, setErro] = useState('');
  const [touched, setTouched] = useState({ email: false, senha: false });
  const [emailError, setEmailError] = useState('');
  const [senhaError, setSenhaError] = useState('');
  const recaptchaRef = useRef<HTMLDivElement>(null);
  const widgetId = useRef<number | null>(null);
  const siteKey = process.env.NEXT_PUBLIC_RECAPTCHA_SITE_KEY;

  useEffect(() => {
    if (!siteKey || window.grecaptcha) return;
    window.onGSRecaptchaLoad = () => {
      if (recaptchaRef.current && window.grecaptcha) {
        widgetId.current = window.grecaptcha.render(recaptchaRef.current, {
          sitekey: siteKey,
          size: 'invisible',
        });
      }
    };
    const s = document.createElement('script');
    s.src = 'https://www.google.com/recaptcha/api.js?onload=onGSRecaptchaLoad&render=explicit';
    s.async = true;
    document.body.appendChild(s);
  }, [siteKey]);

  const validar = useCallback(() => {
    const e = !email ? 'Informe o email.' : !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email) ? 'Email inválido.' : '';
    const p = !senha ? 'Informe a senha.' : '';
    setEmailError(e);
    setSenhaError(p);
    return !e && !p;
  }, [email, senha]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErro('');
    if (!validar()) return;
    setLoading(true);
    try {
      let recaptchaToken: string | undefined;
      if (siteKey && window.grecaptcha && widgetId.current !== null) {
        recaptchaToken = await window.grecaptcha.execute(widgetId.current);
      }
      const res = await fetch('/api/gs/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, senha, recaptcha: recaptchaToken }),
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
    <div className="min-h-screen flex items-center justify-center bg-[var(--color-surface)] p-4">
      <div className="w-full max-w-md">
        <div className="bg-white rounded-2xl border border-slate-200 shadow-card p-8">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-11 h-11 rounded-xl bg-emerald-600 text-white flex items-center justify-center">
              <Building2 size={22} />
            </div>
            <div>
              <h1 className="text-slate-900 font-black text-lg tracking-tight">GS · Gestão</h1>
              <p className="text-[11px] text-slate-400 font-bold uppercase tracking-widest">Core-AR · VEMAPI</p>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4" noValidate>
            <div>
              <label htmlFor="email" className="text-xs font-bold text-slate-500 uppercase tracking-wide">Email</label>
              <div className={`mt-1.5 flex items-center gap-2 rounded-xl border px-3 transition focus-within:ring-2 focus-within:ring-emerald-500/40 ${
                emailError && touched.email ? 'border-rose-300 bg-rose-50/30' : 'border-slate-200 focus-within:border-emerald-400'
              }`}>
                <Mail size={16} className="text-slate-400" />
                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  onBlur={() => { setTouched((t) => ({ ...t, email: true })); validar(); }}
                  aria-invalid={!!(emailError && touched.email)}
                  aria-describedby={emailError && touched.email ? 'email-erro' : undefined}
                  placeholder="admin@acangry.com"
                  className="flex-1 py-2.5 bg-transparent outline-none text-sm text-slate-800"
                  autoComplete="username"
                />
              </div>
              {emailError && touched.email && (
                <p id="email-erro" role="alert" className="mt-1 text-xs text-rose-600 flex items-center gap-1">
                  <AlertCircle size={12} /> {emailError}
                </p>
              )}
            </div>

            <div>
              <label htmlFor="senha" className="text-xs font-bold text-slate-500 uppercase tracking-wide">Senha</label>
              <div className={`mt-1.5 flex items-center gap-2 rounded-xl border px-3 transition focus-within:ring-2 focus-within:ring-emerald-500/40 ${
                senhaError && touched.senha ? 'border-rose-300 bg-rose-50/30' : 'border-slate-200 focus-within:border-emerald-400'
              }`}>
                <Lock size={16} className="text-slate-400" />
                <input
                  id="senha"
                  type="password"
                  value={senha}
                  onChange={(e) => setSenha(e.target.value)}
                  onBlur={() => { setTouched((t) => ({ ...t, senha: true })); validar(); }}
                  aria-invalid={!!(senhaError && touched.senha)}
                  aria-describedby={senhaError && touched.senha ? 'senha-erro' : undefined}
                  placeholder="••••••••"
                  className="flex-1 py-2.5 bg-transparent outline-none text-sm text-slate-800"
                  autoComplete="current-password"
                />
              </div>
              {senhaError && touched.senha && (
                <p id="senha-erro" role="alert" className="mt-1 text-xs text-rose-600 flex items-center gap-1">
                  <AlertCircle size={12} /> {senhaError}
                </p>
              )}
            </div>

            {erro && (
              <div role="alert" className="text-sm text-rose-600 bg-rose-50 border border-rose-100 rounded-lg px-3 py-2 flex items-center gap-2">
                <AlertCircle size={14} /> {erro}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full h-11 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-sm transition active:scale-[0.98] disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              <LogIn size={16} />
              {loading ? 'Entrando...' : 'Entrar'}
            </button>

            <div ref={recaptchaRef} />
          </form>

          <p className="mt-4 text-center text-[11px] text-slate-400">
            Acesso restrito · multi-tenant AC / AR / Unidade / Contador
          </p>
        </div>
      </div>
    </div>
  );
}
