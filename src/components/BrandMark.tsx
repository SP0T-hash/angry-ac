"use client";

import React from "react";
import { useBranding } from "@/components/BrandingProvider";

// Marca visual da AR: logo (img) se houver, senão marca textual de fallback.
// Aplica a cor primária da marca no ícone/texto de fallback.
export default function BrandMark({
  showName = true,
  iconClassName = "w-9 h-9",
  nameClassName = "text-emerald-900 font-black text-sm tracking-[0.2em] uppercase leading-none",
}: {
  showName?: boolean;
  iconClassName?: string;
  nameClassName?: string;
}) {
  const { branding } = useBranding();
  const initials = (branding.name || "V").slice(0, 2).toUpperCase();

  return (
    <div className="flex items-center gap-3">
      {branding.logoUrl ? (
        <img
          src={branding.logoUrl}
          alt={branding.name}
          className={`${iconClassName} object-contain rounded-lg`}
        />
      ) : (
        <div
          className={`${iconClassName} rounded-lg flex items-center justify-center text-white font-black bg-brand`}
        >
          {initials}
        </div>
      )}
      {showName && <span className={nameClassName}>{branding.name}</span>}
    </div>
  );
}
