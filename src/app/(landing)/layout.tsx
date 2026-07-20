import type { Metadata } from "next";
import { GeistSans } from "geist/font/sans";
import "@/app/globals.css";
import { ErrorBoundary } from "@/components/ErrorBoundary";

export const metadata: Metadata = {
  title: "VEMAPI - Soluções Digitais",
  description: "Tech Partner para Empresas de Futuro - Desenvolvemos infraestrutura e inteligência digital para sua empresa escalar com segurança.",
  icons: {
    icon: '/favicon.ico',
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
      <body className={`${GeistSans.className} antialiased`}><ErrorBoundary>{children}</ErrorBoundary></body>
    </html>
  );
}