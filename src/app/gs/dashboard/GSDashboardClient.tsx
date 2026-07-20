'use client';

import React from 'react';
import {
  Building2, Users, FileText, Wallet, Ticket, Scissors,
  LayoutDashboard, ShieldCheck,
} from 'lucide-react';
import {
  Card, Text, Metric, Grid, ProgressBar, BadgeDelta, Flex,
} from '@tremor/react';
import GSLayout from "@/components/gs/GSLayout";
import { buildGSNav } from "@/components/gs/GSLayout";

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

const iconWrap: Record<string, string> = {
  emerald: 'bg-emerald-500/10 text-emerald-600',
  indigo: 'bg-indigo-500/10 text-indigo-600',
};

export default function GSDashboardClient({ usuario, nivelLabel, isAdmin, isAR }: DashboardProps) {
  const nav = buildGSNav(isAR).filter((n) => n.id !== 'dashboard');

  return (
    <GSLayout
      usuario={{ nome: usuario.nome, email: usuario.email }}
      nivelLabel={nivelLabel}
      isAR={isAR}
      titulo="Dashboard Operacional"
      subtitulo="Visão geral da operação multi-tenant"
    >
      <Grid numItemsSm={2} numItemsLg={4} className="gap-6">
        {kpis.map((k) => (
          <Card key={k.title} decoration="top" decorationColor={k.color} className="bg-white border border-slate-100 rounded-2xl shadow-card">
            <Flex alignItems="start">
              <div className="flex items-center gap-3">
                <div className={`p-2 rounded-lg ${iconWrap[k.color] ?? 'bg-slate-500/10 text-slate-600'}`}>
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
            {nav.map((n) => (
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
    </GSLayout>
  );
}
