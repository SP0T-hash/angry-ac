'use client';

import React, { useState } from 'react';
import { Plus } from 'lucide-react';
import GSLayout from "@/components/gs/GSLayout";
import GSTable, { Coluna } from "@/components/gs/GSTable";
import GSFormModal, { CampoForm } from "@/components/gs/GSFormModal";

interface GSListClientProps {
  usuario: { nome: string; email: string };
  nivelLabel: string;
  isAR: boolean;
  titulo: string;
  subtitulo?: string;
  tabela: string;
  colunas: Coluna[];
  linhas: Record<string, any>[];
  campos: CampoForm[];
  erro?: string;
  carregando?: boolean;
}

export default function GSListClient({
  usuario, nivelLabel, isAR, titulo, subtitulo, tabela, colunas, linhas, campos, erro, carregando,
}: GSListClientProps) {
  const [modalOpen, setModalOpen] = useState(false);
  const [registro, setRegistro] = useState<Record<string, any> | null>(null);

  const openNovo = () => { setRegistro(null); setModalOpen(true); };
  const openEdit = (row: Record<string, any>) => { setRegistro(row); setModalOpen(true); };

  const acao = (
    <button onClick={openNovo}
      className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition active:scale-95">
      <Plus size={14} /> Novo
    </button>
  );

  return (
    <GSLayout
      usuario={usuario}
      nivelLabel={nivelLabel}
      isAR={isAR}
      titulo={titulo}
      subtitulo={subtitulo}
      acao={acao}
    >
      {erro && <div className="text-rose-600 text-sm bg-rose-50 border border-rose-100 rounded-lg px-3 py-2 mb-4">{erro}</div>}

      {carregando ? (
        <div className="flex items-center justify-center py-20 text-slate-400 text-sm">Carregando…</div>
      ) : (
        <GSTable
          titulo={titulo}
          colunas={colunas}
          linhas={linhas}
          onLinha={openEdit}
        />
      )}

      <GSFormModal
        open={modalOpen}
        titulo={registro ? `Editar ${titulo}` : `Novo ${titulo}`}
        tabela={tabela}
        campos={campos}
        registro={registro}
        onClose={() => setModalOpen(false)}
        onSaved={() => window.location.reload()}
      />
    </GSLayout>
  );
}
