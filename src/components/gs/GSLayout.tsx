'use client';

import React, { useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import {
  Building2, Users, FileText, Wallet, Ticket, Scissors, LogOut, LayoutDashboard,
} from 'lucide-react';

export interface GSNavItem {
  id: string;
  label: string;
  icon: React.ComponentType<{ size?: number; className?: string }>;
  href: string;
}

export function buildGSNav(isAR: boolean): GSNavItem[] {
  return [
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
}

interface GSLayoutProps {
  usuario: { nome: string; email: string };
  nivelLabel: string;
  isAR: boolean;
  titulo: string;
  subtitulo?: string;
  children: React.ReactNode;
  acao?: React.ReactNode;
}

export default function GSLayout({
  usuario, nivelLabel, isAR, titulo, subtitulo, children, acao,
}: GSLayoutProps) {
  const router = useRouter();
  const pathname = usePathname();
  const nav = buildGSNav(isAR);

  const handleLogout = async () => {
    await fetch('/api/gs/auth/logout', { method: 'POST' });
    router.push('/gs/login');
    router.refresh();
  };

  return (
    <div className="min-h-screen flex bg-[var(--color-surface)]">
      <aside className="hidden md:flex w-60 bg-white border-r border-slate-200 h-screen flex-col py-4 shrink-0 z-40">
        <div className="px-4 mb-6 flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-emerald-600 text-white flex items-center justify-center shadow-sm">
            <Building2 size={18} />
          </div>
          <div className="leading-tight">
            <span className="text-[10px] font-black text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded uppercase tracking-wider">GS</span>
            <p className="text-slate-900 font-black text-sm tracking-tight">Core-AR · Gestão</p>
          </div>
        </div>

        <nav className="flex-1 space-y-1 px-3">
          {nav.map((item) => {
            const ativo = pathname === item.href || (item.id === 'dashboard' && pathname === '/gs');
            return (
              <button
                key={item.id}
                onClick={() => router.push(item.href)}
                aria-current={ativo ? 'page' : undefined}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-semibold transition-colors ${
                  ativo
                    ? 'bg-emerald-50 text-emerald-700'
                    : 'text-slate-500 hover:text-slate-900 hover:bg-slate-50'
                }`}
              >
                <item.icon size={18} className={ativo ? 'text-emerald-600' : 'text-slate-400'} />
                {item.label}
              </button>
            );
          })}
        </nav>

        <div className="px-3 pt-3 border-t border-slate-100">
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-semibold text-slate-500 hover:text-rose-600 hover:bg-rose-50 transition-colors"
          >
            <LogOut size={18} className="text-slate-400" />
            Sair
          </button>
        </div>
      </aside>

      <div className="flex-1 flex flex-col min-w-0">
        <header className="h-[65px] bg-white border-b border-slate-200 px-4 lg:px-8 flex items-center justify-between sticky top-0 z-50">
          <div className="flex items-center gap-3 min-w-0">
            <h1 className="text-slate-900 font-black text-sm tracking-tight truncate">{titulo}</h1>
            <span className="text-[10px] font-black text-slate-400 bg-slate-100 px-1.5 py-0.5 rounded uppercase tracking-wider shrink-0">{nivelLabel}</span>
          </div>
          <div className="flex items-center gap-4 shrink-0">
            <div className="hidden md:flex flex-col items-end leading-tight">
              <span className="text-[11px] font-black text-slate-800 uppercase">{usuario.nome}</span>
              <span className="text-[9px] text-emerald-600 font-bold uppercase tracking-wider">{usuario.email}</span>
            </div>
            {acao}
          </div>
        </header>

        <main className="flex-1 p-6 max-w-7xl mx-auto w-full">
          {subtitulo && <p className="text-sm text-slate-500 mb-6 -mt-2">{subtitulo}</p>}
          {children}
        </main>
      </div>
    </div>
  );
}
