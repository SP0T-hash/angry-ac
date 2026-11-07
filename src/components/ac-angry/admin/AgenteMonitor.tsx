'use client';

import React from 'react';
import { Monitor, Smartphone, Terminal, SignalHigh, SignalLow } from "lucide-react";

interface AgenteHardware {
  id: string;
  name: string;
  location: string;
  status: 'ONLINE' | 'OFFLINE';
  lastPing: string;
  type: 'PC' | 'SMARTPHONE' | 'TERMINAL';
}

const mockHardwares: AgenteHardware[] = [
  { id: 'H1', name: 'Leitora USB - Carlos', location: 'São Paulo/SP', status: 'ONLINE', lastPing: '2s atrás', type: 'PC' },
  { id: 'H2', name: 'Biometria - Ana', location: 'Curitiba/PR', status: 'ONLINE', lastPing: '5s atrás', type: 'PC' },
  { id: 'H3', name: 'Token A3 - Pedro', location: 'RJ/RJ', status: 'OFFLINE', lastPing: '2h atrás', type: 'TERMINAL' },
  { id: 'H4', name: 'App Vidaas - Maria', location: 'Mobile', status: 'ONLINE', lastPing: '1m atrás', type: 'SMARTPHONE' },
];

export default function AgenteMonitor() {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between px-2">
        <h3 className="text-sm font-black uppercase tracking-widest text-blue-400 flex items-center gap-2">
          <Monitor size={16} /> Monitor de Hardware Local
        </h3>
        <span className="inline-flex rounded-full px-2 py-0.5 text-xs bg-blue-500/10 text-blue-400">4 ATIVOS</span>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-1 lg:grid-cols-2 gap-4">
        {mockHardwares.map((h) => (
          <div key={h.id} className="rounded-xl border bg-[#0f172a]/40 border-white/5 hover:border-blue-500/30 transition-all group p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className={`w-10 h-10 rounded-lg flex items-center justify-center border border-white/10 ${h.status === 'ONLINE' ? 'bg-emerald-500/10 text-emerald-500' : 'bg-slate-800 text-slate-500'}`}>
                  {h.type === 'PC' && <Monitor size={18} />}
                  {h.type === 'SMARTPHONE' && <Smartphone size={18} />}
                  {h.type === 'TERMINAL' && <Terminal size={18} />}
                </div>
                <div className="flex flex-col">
                  <p className="text-xs font-black text-white uppercase tracking-tight">{h.name}</p>
                  <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">{h.location}</p>
                </div>
              </div>
              <div className="flex flex-col items-end">
                <span className={`inline-flex rounded-full px-2 py-0.5 text-xs ${h.status === 'ONLINE' ? 'bg-emerald-500/10 text-emerald-500' : 'bg-slate-500/10 text-slate-400'}`}>
                  {h.status}
                </span>
                <div className="flex items-center gap-1.5">
                   {h.status === 'ONLINE' ? <SignalHigh size={10} className="text-emerald-500" /> : <SignalLow size={10} className="text-slate-600" />}
                   <span className="text-[10px] font-mono text-slate-600">{h.lastPing}</span>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
