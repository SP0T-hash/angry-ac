// Resolução de marca (white-label) POR AR (tenant).
// Cada AR parceira deve conseguir ver sua própria marca na experiência, não a global.
// O gs_ars já armazena logo_url + branding (JSONB) + slug; este módulo expõe um
// resolvedor com fallback para o padrão global (env). Não expõe marcas de fornecedores.
import { gsList } from "./data";
import { PRODUCT_NAME } from "@/lib/env";

export interface ArBranding {
  slug?: string;
  name: string;
  logoUrl?: string;
  primary: string;
  verification: string;
  background: string;
  ink: string;
  environmentLabel: string;
}

// Fallback = marca global VEMAPI (emerald), usada quando não há branding de AR.
const FALLBACK: ArBranding = {
  name: PRODUCT_NAME,
  primary: "#10b981",
  verification: "#8ce2ba",
  background: "#f7f8fa",
  ink: "#14202b",
  environmentLabel: "Ambiente de homologação",
};

export function defaultBranding(): ArBranding {
  return { ...FALLBACK };
}

type ArRow = {
  id?: string;
  slug?: string;
  nome?: string;
  logo_url?: string;
  branding?: Partial<ArBranding>;
};

// Busca a marca de uma AR específica por id OU slug. Retorna fallback se não encontrar.
export async function getArBranding(arIdOrSlug?: string | null): Promise<ArBranding> {
  if (!arIdOrSlug) return { ...FALLBACK };
  try {
    const rows = (await gsList("gs_ars", {
      colunas: "id,slug,nome,logo_url,branding",
    })) as ArRow[];
    const ar = rows.find(
      (r) => r.id === arIdOrSlug || r.slug === arIdOrSlug,
    );
    if (!ar) return { ...FALLBACK };
    const b = ar.branding ?? {};
    return {
      slug: ar.slug,
      name: ar.nome || FALLBACK.name,
      logoUrl: ar.logo_url || b.logoUrl,
      primary: b.primary || FALLBACK.primary,
      verification: b.verification || FALLBACK.verification,
      background: b.background || FALLBACK.background,
      ink: b.ink || FALLBACK.ink,
      environmentLabel: b.environmentLabel || FALLBACK.environmentLabel,
    };
  } catch {
    return { ...FALLBACK };
  }
}

// Converte #RRGGBB (ou #RGB) em "R G B" para CSS vars (suporta opacidade Tailwind).
export function hexToRgbTriplet(hex: string): string {
  try {
    let h = hex.replace("#", "").trim();
    if (h.length === 3) h = h.split("").map((c) => c + c).join("");
    if (h.length !== 6) return "16 185 129";
    const r = parseInt(h.slice(0, 2), 16);
    const g = parseInt(h.slice(2, 4), 16);
    const b = parseInt(h.slice(4, 6), 16);
    if ([r, g, b].some((n) => Number.isNaN(n))) return "16 185 129";
    return `${r} ${g} ${b}`;
  } catch {
    return "16 185 129";
  }
}
