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
    <html lang="pt-BR">
      <body className={`${inter.className} min-h-screen bg-slate-50 text-slate-900 selection:bg-emerald-100 selection:text-emerald-900 font-sans antialiased overflow-hidden`}>
        <div className="fixed inset-0 bg-[radial-gradient(circle_at_top_right,_var(--tw-gradient-stops))] from-emerald-50/50 via-transparent to-transparent pointer-events-none"></div>
        {children}
      </body>
    </html>
  );
}
