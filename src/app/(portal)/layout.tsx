import React from 'react';
import { Metadata } from 'next';
import { GeistSans } from "geist/font/sans";
import "@/app/globals.css";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { EnvironmentBanner } from "@/components/EnvironmentBanner";

export const metadata: Metadata = {
  title: 'Portal do Cliente | VEMAPI',
  description: 'Sistema de Suporte e Chamados VEMAPI',
  icons: {
    icon: [
      { url: '/favicon-16.png', sizes: '16x16', type: 'image/png' },
      { url: '/favicon-32.png', sizes: '32x32', type: 'image/png' },
      { url: '/favicon-512.png', sizes: '512x512', type: 'image/png' },
    ],
    apple: '/apple-touch-icon.png',
  },
};

export default function PortalLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR">
      <body className={`${GeistSans.className} min-h-screen bg-slate-50 text-slate-900 selection:bg-emerald-500/30 font-sans antialiased`}>
        <ErrorBoundary><EnvironmentBanner />{children}</ErrorBoundary>
      </body>
    </html>
  );
}
