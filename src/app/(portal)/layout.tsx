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
        {/* Background suave e minimalista */}
        <div className="fixed inset-0 -z-50 overflow-hidden bg-slate-50">
          <div className="absolute inset-0 opacity-[0.03] pointer-events-none" 
               style={{ backgroundImage: `url('https://grainy-gradients.vercel.app/noise.svg')` }}></div>
        </div>

        {/* MESH GRADIENTS SUTIS */}
        <div className="fixed inset-0 -z-10 overflow-hidden pointer-events-none">
          <div className="absolute top-[-15%] left-[-10%] w-[45%] h-[45%] bg-emerald-100/50 blur-[160px] rounded-full" />
          <div className="absolute bottom-[5%] right-[-8%] w-[35%] h-[35%] bg-blue-100/30 blur-[160px] rounded-full" />
        </div>

        <ErrorBoundary>{children}</ErrorBoundary>
      </body>
    </html>
  );
}
