import React from 'react';
import type { Metadata } from 'next';
import { GeistSans } from "geist/font/sans";
import "@/app/globals.css";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { EnvironmentBanner } from "@/components/EnvironmentBanner";
import BrandingProvider from "@/components/BrandingProvider";
import { getGSSession } from "@/lib/gs/session";
import { getArBranding } from "@/lib/gs/tenantBranding";

export const metadata: Metadata = {
  title: 'AC Angry - Validação Digital',
  description: 'Sistema de Atendimento para Certificação Digital Integrado à VEMAPI',
  icons: {
    icon: [
      { url: '/favicon-16.png', sizes: '16x16', type: 'image/png' },
      { url: '/favicon-32.png', sizes: '32x32', type: 'image/png' },
      { url: '/favicon-512.png', sizes: '512x512', type: 'image/png' },
    ],
    apple: '/apple-touch-icon.png',
  },
};

export default async function AngryLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Marca por AR (white-label): resolve a partir da sessão GS do operador.
  const sess = await getGSSession();
  const branding = await getArBranding(sess?.usuario.ar_id);

  return (
    <html lang="pt-BR">
      <body className={`${GeistSans.className} min-h-screen bg-slate-50 text-slate-900 selection:bg-brand/10 selection:text-brand font-sans antialiased overflow-hidden`}>
        <div className="fixed inset-0 bg-[radial-gradient(circle_at_top_right,_var(--tw-gradient-stops))] from-brand/50 via-transparent to-transparent pointer-events-none"></div>
        <ErrorBoundary>
          <BrandingProvider branding={branding}>
            <EnvironmentBanner />
            {children}
          </BrandingProvider>
        </ErrorBoundary>
      </body>
    </html>
  );
}
