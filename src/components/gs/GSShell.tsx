'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import {
  Building2, Users, FileText, Wallet, Ticket, Scissors, LogOut, LayoutDashboard,
} from 'lucide-react';

interface GSShellProps {
  usuario: { nome: string; email: string };
  nivelLabel: string;
  isAR: boolean;
  children: React.ReactNode;
  titulo: string;
  subtitulo?: string;
}

export default function GSShell({ usuario, nivelLabel, isAR, children, titulo, subtitulo }: GSShellProps) {
  const router = useRouter();

  const handleLogout = async () => {
    await fetch('/api/gs/auth/logout', { method: 'POST' });
    router.push('/gs/login');
    router.refresh();
  };

  const nav = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard, href: '/gs/dashboard' },
    ...(isAR ? [
      { id: 'ars', label: 'ARs', icon: Building2, href: '/gs/ars' },
      { id: 'unidades', label: 'Unidades', icon: Users, href: '/gs/unidades' },
      { id: 'pontos', label: 'Pontos', icon: Scissors, href: '/gs/pontos' },
    ] : []),
    { id: 'clientes', label: 'Clientes', icon: Users, href: '/gs/clientes' },
    { id: 'pedidos', label: 'Pedidos', icon: FileText, href: '/gs/pedidos' },
    ...(isAR ? [{ id: 'financeiro', label: 'Financeiro', icon: Wallet, href: '/gs/financeiro' }] : []),
    { id: 'tickets', label: 'Suporte', icon: Ticket, href: '/gs/tickets' },
  ];

  return (
    <div className="min-h-screen flex bg-[var(--color-surface)]">
      <aside className="hidden md:flex w-[68px] bg-white/70 backdrop-blur-lg border-r border-slate-100 h-screen flex-col items-center py-4 shrink-0 z-40">
        <div className="w-9 h-9 rounded-lg bg-emerald-600 text-white flex items-center justify-center shadow-lg shadow-emerald-200 mb-6">
          <Building2 size={18} />
        </div>
        <nav className="flex-1 space-y-2 w-full px-2">
          {nav.map((item) => (
            <button
              key={item.id}
              title={item.label}
              onClick={() => router.push(item.href)}
              className="w-full aspect-square rounded-xl flex items-center justify-center text-slate-400 hover:text-emerald-600 hover:bg-emerald-50/80 transition-all hover:scale-105"
            >
              <item.icon size={20} />
            </button>
          ))}
        </nav>
      </aside>

      <div className="flex-1 flex flex-col">
        <header className="h-[65px] bg-white/80 backdrop-blur-md border-b border-slate-100 px-4 lg:px-8 flex items-center justify-between sticky top-0 z-50">
          <div className="flex items-center gap-3">
            <span className="text-[10px] font-black text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded uppercase tracking-wider">GS</span>
            <h1 className="text-slate-900 font-black text-sm tracking-tight">Core-AR · Gestão</h1>
          </div>
          <div className="flex items-center gap-4">
            <div className="hidden lg:flex items-center gap-2 px-3 py-1.5 bg-slate-50 rounded-full border border-slate-100">
              <span className="text-[10px] font-black text-slate-500 uppercase tracking-tight">{nivelLabel}</span>
            </div>
            <div className="hidden md:flex flex-col items-end">
              <span className="text-[11px] font-black text-slate-800 uppercase leading-none">{usuario.nome}</span>
              <span className="text-[9px] text-emerald-600 font-bold uppercase tracking-wider leading-none mt-1">{usuario.email}</span>
            </div>
            <button onClick={handleLogout} className="flex items-center gap-2 text-slate-400 hover:text-rose-500 transition p-1.5 hover:bg-rose-50 rounded-full" title="Sair">
              <LogOut size={18} />
            </button>
          </div>
        </header>

        <main className="flex-1 p-6 max-w-7xl mx-auto w-full">
          <div className="mb-6">
            <h2 className="text-xl font-black text-slate-900">{titulo}</h2>
            {subtitulo && <p className="text-sm text-slate-400 mt-0.5">{subtitulo}</p>}
          </div>
          {children}
        </main>
      </div>
    </div>
  );
}
