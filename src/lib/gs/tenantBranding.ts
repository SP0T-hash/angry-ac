// Resolução de marca (white-label) POR AR (tenant).
// Cada AR parceira deve conseguir ver sua própria marca na experiência, não a global.
// O gs_ars já armazena logo_url + config JSONB; este módulo expõe um resolvedor
// com fallback para o padrão global (env). Não expõe marcas de fornecedores.
import { gsList } from "./data";
import { PRODUCT_NAME } from "@/lib/env";

export interface ArBranding {
  name: string;
  logoUrl?: string;
  primary: string;
  verification: string;
  background: string;
  ink: string;
  environmentLabel: string;
}

const FALLBACK: ArBranding = {
  name: PRODUCT_NAME,
  primary: "#14202b",
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
  nome?: string;
  logo_url?: string;
  branding?: Partial<ArBranding>;
};

// Busca a marca de uma AR específica. Retorna fallback se não encontrar ou falhar.
export async function getArBranding(arId: string): Promise<ArBranding> {
  try {
    const rows = await gsList("gs_ars", { colunas: "id,nome,logo_url,branding" });
    const ar = (rows as ArRow[]).find((r) => r.id === arId);
    if (!ar) return { ...FALLBACK };
    const b = ar.branding ?? {};
    return {
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
