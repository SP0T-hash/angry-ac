"use client";

import { useEffect, useState } from "react";
import type { ArBranding } from "@/lib/gs/tenantBranding";
import { defaultBranding } from "@/lib/gs/tenantBranding";

// Busca a marca pública de uma AR (via /api/gs/branding). Usado em telas
// públicas (Landing, AC Angry, RI) para aplicar white-label por AR.
// `ar` pode ser slug ou id; omitir → fallback global.
export function useArBranding(ar?: string): { branding: ArBranding; loading: boolean } {
  const [branding, setBranding] = useState<ArBranding>(defaultBranding());
  const [loading, setLoading] = useState<boolean>(!!ar);

  useEffect(() => {
    let cancelled = false;
    if (!ar) {
      setBranding(defaultBranding());
      setLoading(false);
      return;
    }
    setLoading(true);
    fetch(`/api/gs/branding?ar=${encodeURIComponent(ar)}`)
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        if (cancelled) return;
        if (data) setBranding(data as ArBranding);
        setLoading(false);
      })
      .catch(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [ar]);

  return { branding, loading };
}
