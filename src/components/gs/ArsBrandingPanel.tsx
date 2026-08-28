"use client";

import React, { useState } from "react";
import { Pencil } from "lucide-react";
import { useRouter } from "next/navigation";
import ArBrandingEditor from "@/components/gs/ArBrandingEditor";

// Painel de marcas das ARs (white-label) na tela gs/ars.
// Lista cada AR com botão para abrir o editor de marca.
export default function ArsBrandingPanel({ ars }: { ars: Record<string, any>[] }) {
  const router = useRouter();
  const [editando, setEditando] = useState<Record<string, any> | null>(null);

  return (
    <div className="mt-6 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-black text-slate-900 uppercase tracking-wide">Marcas (white-label)</h3>
        <span className="text-[10px] text-slate-400">Cada AR enxerga sua própria marca nas telas públicas</span>
      </div>
      <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
        {ars.map((a) => {
          const b = a.branding ?? {};
          return (
            <button
              key={a.id}
              onClick={() => setEditando(a)}
              className="flex items-center gap-3 p-3 rounded-xl border border-slate-100 hover:border-brand/40 hover:bg-brand/5 transition text-left"
            >
              <div
                className="w-9 h-9 rounded-lg flex items-center justify-center text-white font-black shrink-0"
                style={{ background: b.primary || "#10b981" }}
              >
                {(a.nome || "V").slice(0, 2).toUpperCase()}
              </div>
              <div className="min-w-0 flex-1">
                <div className="text-sm font-bold text-slate-800 truncate">{a.nome}</div>
                <div className="text-[10px] text-slate-400 truncate">{a.slug ? `/?ar=${a.slug}` : "sem slug"}</div>
              </div>
              <Pencil size={14} className="text-slate-300" />
            </button>
          );
        })}
      </div>

      {editando && (
        <ArBrandingEditor
          ar={editando}
          onClose={() => setEditando(null)}
          onSaved={() => router.refresh()}
        />
      )}
    </div>
  );
}
