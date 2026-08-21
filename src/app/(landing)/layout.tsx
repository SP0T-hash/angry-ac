import type { Metadata } from "next";
import { GeistSans } from "geist/font/sans";
import "@/app/globals.css";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { EnvironmentBanner } from "@/components/EnvironmentBanner";

export const metadata: Metadata = {
  title: "VEMAPI - Soluções Digitais",
  description: "Tech Partner para Empresas de Futuro - Desenvolvemos infraestrutura e inteligência digital para sua empresa escalar com segurança.",
  icons: {
    icon: [
      { url: '/favicon-16.png', sizes: '16x16', type: 'image/png' },
      { url: '/favicon-32.png', sizes: '32x32', type: 'image/png' },
      { url: '/favicon-512.png', sizes: '512x512', type: 'image/png' },
    ],
    apple: '/apple-touch-icon.png',
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR">
      <body className={`${GeistSans.className} antialiased`}><ErrorBoundary><EnvironmentBanner />{children}</ErrorBoundary></body>
    </html>
  );
}