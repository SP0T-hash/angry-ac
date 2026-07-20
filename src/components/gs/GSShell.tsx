'use client';

import React from 'react';
import GSLayout from "@/components/gs/GSLayout";

interface GSShellProps {
  usuario: { nome: string; email: string };
  nivelLabel: string;
  isAR: boolean;
  children: React.ReactNode;
  titulo: string;
  subtitulo?: string;
}

export default function GSShell({ usuario, nivelLabel, isAR, children, titulo, subtitulo }: GSShellProps) {
  return (
    <GSLayout
      usuario={usuario}
      nivelLabel={nivelLabel}
      isAR={isAR}
      titulo={titulo}
      subtitulo={subtitulo}
    >
      {children}
    </GSLayout>
  );
}
