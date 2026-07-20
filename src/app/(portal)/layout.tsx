import React from 'react';
import { Metadata } from 'next';
import { GeistSans } from "geist/font/sans";
import "@/app/globals.css";
import { ErrorBoundary } from "@/components/ErrorBoundary";

export const metadata: Metadata = {
  title: 'Portal do Cliente | VEMAPI',
  description: 'Sistema de Suporte e Chamados VEMAPI',
};

export default function PortalLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR">
      <body className={`${GeistSans.className} min-h-screen bg-slate-50 text-slate-900 selection:bg-emerald-500/30 font-sans antialiased`}>
        <ErrorBoundary>{children}</ErrorBoundary>
      </body>
    </html>
  );
}
