'use client';

import React from 'react';
import { GeistSans } from 'geist/font/sans';
import "@/app/globals.css";
import { ErrorBoundary } from "@/components/ErrorBoundary";

export default function GSLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="pt-BR">
      <body className={`${GeistSans.className} min-h-screen bg-[var(--color-surface)] text-slate-800 antialiased`}>
        <ErrorBoundary>{children}</ErrorBoundary>
      </body>
    </html>
  );
}
