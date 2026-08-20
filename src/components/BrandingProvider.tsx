"use client";

import React, { createContext, useContext, useEffect, useMemo, useState } from "react";
import type { ArBranding } from "@/lib/gs/tenantBranding";
import { defaultBranding, hexToRgbTriplet } from "@/lib/gs/tenantBranding";

interface BrandingContextValue {
  branding: ArBranding;
  loading: boolean;
  setBranding: (b: ArBranding) => void;
}

const BrandingContext = createContext<BrandingContextValue>({
  branding: defaultBranding(),
  loading: false,
  setBranding: () => {},
});

export function useBranding() {
  return useContext(BrandingContext);
}

// Aplica os tokens de marca como CSS vars no <html>, para que utilitários
// Tailwind `brand` (bg-brand, text-brand, from-brand, border-brand, ...) e
// opacidades (bg-brand/5) reflitam a marca da AR em toda a árvore.
function applyBrandingVars(b: ArBranding) {
  if (typeof document === "undefined") return;
  const root = document.documentElement;
  root.style.setProperty("--brand-primary-rgb", hexToRgbTriplet(b.primary));
  root.style.setProperty("--brand-verify-rgb", hexToRgbTriplet(b.verification));
  root.style.setProperty("--brand-bg", b.background);
  root.style.setProperty("--brand-ink", b.ink);
  root.dataset.arBranding = b.slug ?? "default";
}

export default function BrandingProvider({
  branding: controlled,
  children,
}: {
  branding?: ArBranding;
  children: React.ReactNode;
}) {
  const [branding, setBranding] = useState<ArBranding>(controlled ?? defaultBranding());

  // Modo controlado: sincroniza quando a prop muda (ex.: troca de AR na URL).
  useEffect(() => {
    if (controlled) setBranding(controlled);
  }, [controlled]);

  useEffect(() => {
    applyBrandingVars(branding);
  }, [branding]);

  const value = useMemo<BrandingContextValue>(
    () => ({ branding, loading: false, setBranding }),
    [branding],
  );

  return <BrandingContext.Provider value={value}>{children}</BrandingContext.Provider>;
}
