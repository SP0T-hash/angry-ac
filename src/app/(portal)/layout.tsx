import React from 'react';
import { Metadata } from 'next';
import { Inter } from "next/font/google";
import "@/app/globals.css";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: 'Portal do Cliente | VEMAPI',
  description: 'Sistema de Suporte e Chamados VEMAPI',
};

export default function PortalLayout({ children }: { children: React.ReactNode }) {
  // O Portal será sempre dark mode hardcoded para manter a estética premium que combinamos.
  return (
    <html lang="pt-BR" className="dark">
      <body className={`${inter.className} min-h-screen bg-[#020617] text-white selection:bg-[#10b981]/30 selection:text-[#10b981] font-sans antialiased`}>
        {/* Background idêntico ao site principal para consistência */}
        <div className="fixed inset-0 -z-50 overflow-hidden bg-[#020617]">
          {/* Textura de Ruído (Noise) */}
          <div className="absolute inset-0 opacity-[0.03] pointer-events-none" 
               style={{ backgroundImage: `url('https://grainy-gradients.vercel.app/noise.svg')` }}></div>
          {/* Gradiente de Fusão para Leitura */}
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_transparent_0%,_#020617_100%)]"></div>
        </div>

        {/* MESH GRADIENTS */}
        <div className="fixed inset-0 -z-10 overflow-hidden pointer-events-none">
          <div className="absolute top-[-15%] left-[-10%] w-[45%] h-[45%] bg-[#10b981]/5 blur-[160px] rounded-full" />
          <div className="absolute bottom-[5%] right-[-8%] w-[35%] h-[35%] bg-[#10b981]/5 blur-[160px] rounded-full" />
        </div>

        {children}
      </body>
    </html>
  );
}
