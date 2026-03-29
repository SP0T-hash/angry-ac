import React from 'react';
import type { Metadata } from 'next';
import { Inter } from "next/font/google";
import "@/app/globals.css";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: 'AC Angry - Validação Digital',
  description: 'Sistema de Atendimento para Certificação Digital Integrado à VEMAPI',
};

export default function AngryLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="pt-BR" className="dark">
      <body className={`${inter.className} min-h-screen bg-[#020617] text-slate-300 selection:bg-indigo-500/30 selection:text-indigo-400 font-sans antialiased overflow-hidden`}>
        {children}
      </body>
    </html>
  );
}
