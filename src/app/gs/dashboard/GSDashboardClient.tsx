'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  Building2, Users, FileText, Wallet, Ticket, Scissors,
  LogOut, LayoutDashboard, ShieldCheck, Bell,
} from 'lucide-react';
import {
  Card, Text, Metric, Grid, ProgressBar, BadgeDelta, Flex,
} from '@tremor/react';

interface DashboardProps {
  usuario: { nome: string; nivel: string; email: string };
  nivelLabel: string;
  isAdmin: boolean;
  isAR: boolean;
}

const kpis = [
  { title: 'ARs Ativos', metric: '12', icon: Building2, delta: '2', deltaType: 'moderateIncrease' as const, progress: 80, color: 'emerald' as const, target: '15' },
  { title: 'Unidades', metric: '48', icon: Users, delta: '5', deltaType: 'moderateIncrease' as const, progress: 90, color: 'indigo' as const, target: '50' },
  { title: 'Pedidos (30d)', metric: '326', icon: FileText, delta: '8%', deltaType: 'moderateIncrease' as const, progress: 65, color: 'emerald' as const, target: '500' },
  { title: 'Receita (mês)', metric: 'R$ 84k', icon: Wallet, delta: '3%', deltaType: 'moderateIncrease' as const, progress: 72, color: 'indigo' as const, target: 'R$ 120k' },
];

export default function GSDashboardClient({ usuario, nivelLabel, isAdmin, isAR }: DashboardProps) {
  const router = useRouter();
  const [nome, setNome] = useState(usuario.nome);

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
    ...(isAR ? [
      { id: 'financeiro', label: 'Financeiro', icon: Wallet, href: '/gs/financeiro' },
    ] : []),
    { id: 'tickets', label: 'Suporte', icon: Ticket, href: '/gs/tickets' },
  ];

  return (
    <div className="min-h-screen flex bg-[var(--color-surface)]">
      {/* Sidebar */}
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

      {/* Main */}
      <div className="flex-1 flex flex-col">
        {/* Navbar */}
        <header className="h-[65px] bg-white/80 backdrop-blur-md border-b border-slate-100 px-4 lg:px-8 flex items-center justify-between sticky top-0 z-50">
          <div className="flex items-center gap-3">
            <span className="text-[10px] font-black text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded uppercase tracking-wider">GS</span>
            <h1 className="text-slate-900 font-black text-sm tracking-tight">Core-AR · Gestão</h1>
          </div>
          <div className="flex items-center gap-4">
            <div className="hidden lg:flex items-center gap-2 px-3 py-1.5 bg-slate-50 rounded-full border border-slate-100">
              <ShieldCheck size={14} className="text-emerald-500" />
              <span className="text-[10px] font-black text-slate-500 uppercase tracking-tight">{nivelLabel}</span>
            </div>
            <div className="hidden md:flex flex-col items-end">
              <span className="text-[11px] font-black text-slate-800 uppercase leading-none">{nome}</span>
              <span className="text-[9px] text-emerald-600 font-bold uppercase tracking-wider leading-none mt-1">{usuario.email}</span>
            </div>
            <button onClick={handleLogout} className="flex items-center gap-2 text-slate-400 hover:text-rose-500 transition p-1.5 hover:bg-rose-50 rounded-full" title="Sair">
              <LogOut size={18} />
            </button>
          </div>
        </header>

        {/* Content */}
        <main className="flex-1 p-6 max-w-7xl mx-auto w-full">
          <h2 className="text-xl font-black text-slate-900 mb-1">Dashboard Operacional</h2>
          <p className="text-sm text-slate-400 mb-6">Visão geral da operação multi-tenant</p>

          <Grid numItemsSm={2} numItemsLg={4} className="gap-6">
            {kpis.map((k) => (
              <Card key={k.title} decoration="top" decorationColor={k.color} className="bg-white border border-slate-100 rounded-2xl shadow-card">
                <Flex alignItems="start">
                  <div className="flex items-center gap-3">
                    <div className={`p-2 rounded-lg bg-${k.color}-500/10 text-${k.color}-600`}>
                      <k.icon size={20} />
                    </div>
                    <Text className="text-slate-400 font-bold uppercase tracking-widest text-[10px]">{k.title}</Text>
                  </div>
                  <BadgeDelta deltaType={k.deltaType} size="xs">{k.delta}</BadgeDelta>
                </Flex>
                <Flex justifyContent="start" alignItems="baseline" className="space-x-3 truncate mt-4">
                  <Metric className="text-slate-900 font-black tracking-tight">{k.metric}</Metric>
                  <Text className="text-slate-400 text-xs truncate">meta: {k.target}</Text>
                </Flex>
                <ProgressBar value={k.progress} color={k.color} className="mt-4" />
              </Card>
            ))}
          </Grid>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mt-6">
            <Card className="lg:col-span-2 bg-white border border-slate-100 rounded-2xl shadow-card p-6">
              <Text className="text-slate-500 font-bold uppercase tracking-widest text-[10px]">Acesso Rápido</Text>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mt-4">
                {nav.filter(n => n.id !== 'dashboard').map((n) => (
                  <button
                    key={n.id}
                    onClick={() => router.push(n.href)}
                    className="flex flex-col items-center gap-2 p-4 rounded-xl border border-slate-100 hover:border-emerald-200 hover:bg-emerald-50/40 transition text-slate-600 hover:text-emerald-700"
                  >
                    <n.icon size={20} />
                    <span className="text-[11px] font-bold">{n.label}</span>
                  </button>
                ))}
              </div>
            </Card>
            <Card className="bg-white border border-slate-100 rounded-2xl shadow-card p-6">
              <Text className="text-slate-500 font-bold uppercase tracking-widest text-[10px]">Status do Sistema</Text>
              <div className="space-y-3 mt-4">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-slate-500">Ambiente</span>
                  <span className="text-emerald-600 font-bold">Online</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-slate-500">Banco GS</span>
                  <span className="text-emerald-600 font-bold">Conectado</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-slate-500">Nível</span>
                  <span className="text-indigo-600 font-bold">{nivelLabel}</span>
                </div>
              </div>
            </Card>
          </div>
        </main>
      </div>
    </div>
  );
}
