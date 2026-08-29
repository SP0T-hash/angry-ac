import React from 'react';
import type { Metadata } from "next";
import { GeistSans } from "geist/font/sans";
import "@/app/globals.css";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { EnvironmentBanner } from "@/components/EnvironmentBanner";

export const metadata: Metadata = {
  title: "GS | VEMAPI",
  description: "Gestão VEMAPI — white-label ICP-Brasil",
  icons: {
    icon: [
      { url: "/favicon-16.png", sizes: "16x16", type: "image/png" },
      { url: "/favicon-32.png", sizes: "32x32", type: "image/png" },
      { url: "/favicon-512.png", sizes: "512x512", type: "image/png" },
    ],
    apple: "/apple-touch-icon.png",
  },
};

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
