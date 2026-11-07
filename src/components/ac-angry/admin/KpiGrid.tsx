'use client';

import React from 'react';
import { Shield, Users, Fingerprint, Activity } from "lucide-react";

const kpiData = [
  {
    title: "Emissões Hoje",
    metric: "128",
    icon: Shield,
    delta: "12%",
    deltaType: "moderateIncrease",
    progress: 72,
    target: "180",
    color: "emerald",
  },
  {
    title: "AGRs Ativos",
    metric: "42",
    icon: Users,
    delta: "4%",
    deltaType: "moderateIncrease",
    progress: 84,
    target: "50",
    color: "indigo",
  },
  {
    title: "Validações PSBIO",
    metric: "98.2%",
    icon: Fingerprint,
    delta: "0.5%",
    deltaType: "moderateIncrease",
    progress: 98,
    target: "100%",
    color: "amber",
  },
  {
    title: "Uptime Hardware",
    metric: "99.9%",
    icon: Activity,
    delta: "Estável",
    deltaType: "unchanged",
    progress: 100,
    target: "99.9%",
    color: "indigo",
  },
];

export default function KpiGrid() {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
      {kpiData.map((item) => (
        <div key={item.title} className="rounded-xl border p-6 bg-[#0f172a]/50 border-white/10 backdrop-blur-xl">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-3">
              <div className={`p-2 rounded-lg ${item.color === 'emerald' ? 'bg-emerald-500/10 text-emerald-500' : item.color === 'amber' ? 'bg-amber-500/10 text-amber-500' : 'bg-indigo-500/10 text-indigo-500'}`}>
                <item.icon size={20} />
              </div>
              <p className="text-slate-400 font-bold uppercase tracking-widest text-[10px]">{item.title}</p>
            </div>
            {item.deltaType !== "unchanged" && (
                <span className="inline-flex rounded-full px-2 py-0.5 text-xs bg-emerald-500/10 text-emerald-500">
                {item.delta}
                </span>
            )}
          </div>
          <div className="flex items-baseline justify-start space-x-3 truncate mt-4">
            <p className="text-3xl text-white font-black tracking-tight">{item.metric}</p>
            <p className="text-slate-500 text-xs truncate">meta: {item.target}</p>
          </div>
          <progress aria-label={item.title} value={item.progress} max={100} className="mt-4 h-2 w-full accent-emerald-500" />
        </div>
      ))}
    </div>
  );
}
