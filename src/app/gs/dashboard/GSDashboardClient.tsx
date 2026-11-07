'use client';

import React from 'react';
import {
  Building2, Users, FileText, Wallet,
} from 'lucide-react';
import GSLayout from "@/components/gs/GSLayout";
import { buildGSNav } from "@/components/gs/GSLayout";

interface DashboardProps {
  usuario: { nome: string; nivel: string; email: string };
  nivelLabel: string;
  isAdmin: boolean;
  isAR: boolean;
  kpis: { ars: number; unidades: number; pedidos: number; receitaMes: number };
  erro?: string;
}

function formatBRL(v: number): string {
  return v.toLocaleString("pt-BR", { style: "currency", currency: "BRL", maximumFractionDigits: 0 });
}

export default function GSDashboardClient({ usuario, nivelLabel, isAR, kpis, erro }: DashboardProps) {
  const cards = [
    { title: 'ARs Ativos', metric: String(kpis.ars), icon: Building2, delta: 'tempo real', deltaType: 'moderateIncrease' as const, progress: 80, color: 'emerald' as const },
    { title: 'Unidades', metric: String(kpis.unidades), icon: Users, delta: 'tempo real', deltaType: 'moderateIncrease' as const, progress: 90, color: 'indigo' as const },
    { title: 'Pedidos', metric: String(kpis.pedidos), icon: FileText, delta: 'tempo real', deltaType: 'moderateIncrease' as const, progress: 65, color: 'emerald' as const },
    { title: 'Receita (mês)', metric: formatBRL(kpis.receitaMes), icon: Wallet, delta: 'tempo real', deltaType: 'moderateIncrease' as const, progress: 72, color: 'indigo' as const },
  ];

  const iconWrap: Record<string, string> = {
    emerald: 'bg-emerald-500/10 text-emerald-600',
    indigo: 'bg-indigo-500/10 text-indigo-600',
  };

  return (
    <GSLayout
      usuario={{ nome: usuario.nome, email: usuario.email }}
      nivelLabel={nivelLabel}
      isAR={isAR}
      titulo="Dashboard Operacional"
      subtitulo="Visão geral da operação multi-tenant (dados em tempo real)"
    >
      {erro && (
        <div role="alert" className="text-rose-600 text-sm bg-rose-50 border border-rose-100 rounded-lg px-3 py-2 mb-4">
          {erro}
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {cards.map((k) => (
          <div key={k.title} className="p-6 bg-white border border-slate-100 rounded-2xl shadow-card">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                <div className={`p-2 rounded-lg ${iconWrap[k.color] ?? 'bg-slate-500/10 text-slate-600'}`}>
                  <k.icon size={20} />
                </div>
                <p className="text-slate-400 font-bold uppercase tracking-widest text-[10px]">{k.title}</p>
              </div>
              <span className="inline-flex rounded-full px-2 py-0.5 text-xs bg-emerald-500/10 text-emerald-500">{k.delta}</span>
            </div>
            <div className="flex items-baseline justify-start space-x-3 truncate mt-4">
              <p className="text-3xl text-slate-900 font-black tracking-tight">{k.metric}</p>
            </div>
            <progress aria-label={k.title} value={k.progress} max={100} className="mt-4 h-2 w-full accent-emerald-500" />
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mt-6">
        <div className="p-6 lg:col-span-2 bg-white border border-slate-100 rounded-2xl shadow-card">
          <p className="text-slate-500 font-bold uppercase tracking-widest text-[10px]">Acesso Rápido</p>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mt-4">
            {buildGSNav(isAR).filter((n) => n.id !== 'dashboard').map((n) => (
              <button
                key={n.id}
                onClick={() => window.location.href = n.href}
                className="flex flex-col items-center gap-2 p-4 rounded-xl border border-slate-100 hover:border-emerald-200 hover:bg-emerald-50/40 transition text-slate-600 hover:text-emerald-700"
              >
                <n.icon size={20} />
                <span className="text-[11px] font-bold">{n.label}</span>
              </button>
            ))}
          </div>
        </div>
        <div className="p-6 bg-white border border-slate-100 rounded-2xl shadow-card">
          <p className="text-slate-500 font-bold uppercase tracking-widest text-[10px]">Status do Sistema</p>
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
        </div>
      </div>
    </GSLayout>
  );
}
