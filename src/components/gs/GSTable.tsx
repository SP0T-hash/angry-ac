'use client';

import React from 'react';
import { Search, Plus } from 'lucide-react';

export interface Coluna {
  key: string;
  label: string;
  mono?: boolean;
}

interface GSTableProps {
  titulo: string;
  colunas: Coluna[];
  linhas: Record<string, any>[];
  loading?: boolean;
  onNovo?: () => void;
  onLinha?: (linha: Record<string, any>) => void;
  children?: React.ReactNode;
}

export default function GSTable({
  titulo, colunas, linhas, loading, onNovo, onLinha, children,
}: GSTableProps) {
  return (
    <div className="bg-white border border-slate-100 rounded-2xl shadow-card overflow-hidden">
      <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
        <h3 className="text-sm font-black text-slate-800 uppercase tracking-wide">{titulo}</h3>
        {onNovo && (
          <button
            onClick={onNovo}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition active:scale-95"
          >
            <Plus size={14} /> Novo
          </button>
        )}
      </div>

      {children}

      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-[10px] font-black uppercase tracking-widest text-slate-400 border-b border-slate-100">
              {colunas.map((c) => (
                <th key={c.key} className="text-left px-5 py-3">{c.label}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={colunas.length} className="px-5 py-8 text-center text-slate-400 text-xs">Carregando...</td></tr>
            ) : linhas.length === 0 ? (
              <tr><td colSpan={colunas.length} className="px-5 py-8 text-center text-slate-400 text-xs">Nenhum registro encontrado</td></tr>
            ) : (
              linhas.map((row, i) => (
                <tr
                  key={row.id ?? i}
                  onClick={() => onLinha?.(row)}
                  className={`border-b border-slate-50 last:border-0 hover:bg-emerald-50/30 transition cursor-pointer ${i % 2 ? 'bg-slate-50/40' : ''}`}
                >
                  {colunas.map((c) => (
                    <td key={c.key} className={`px-5 py-3 text-slate-700 ${c.mono ? 'font-mono text-xs' : ''}`}>
                      {row[c.key] ?? '—'}
                    </td>
                  ))}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
