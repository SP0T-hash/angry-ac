'use client';

import React from 'react';
import { GeistSans } from 'geist/font/sans';
import "@/app/globals.css";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { EnvironmentBanner } from "@/components/EnvironmentBanner";

export default function GSLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className={`${GeistSans.className} min-h-screen bg-[var(--color-surface)] text-slate-800 antialiased`}>
      <ErrorBoundary><EnvironmentBanner />{children}</ErrorBoundary>
    </div>
  );
}
