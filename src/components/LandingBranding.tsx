"use client";

import React, { useEffect, useState } from "react";
import BrandingProvider from "@/components/BrandingProvider";
import { useArBranding } from "@/lib/gs/useArBranding";

// Aplica a marca da AR (white-label) na Landing a partir do parâmetro ?ar=<slug|id>.
// Sem parâmetro → fallback global (VEMAPI). Envolve a árvore em BrandingProvider
// para que utilitários `brand` reflitam a cor primária da AR.
export default function LandingBranding({ children }: { children: React.ReactNode }) {
  const [ar, setAr] = useState<string | undefined>(undefined);

  useEffect(() => {
    const p = new URLSearchParams(window.location.search);
    setAr(p.get("ar") ?? undefined);
  }, []);

  const { branding } = useArBranding(ar);

  return <BrandingProvider branding={branding}>{children}</BrandingProvider>;
}
