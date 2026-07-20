// Busca dados do módulo GS via service-role (server-side).
// Usa filtragem por tenant quando aplicável.
import { getSupabaseAdmin } from "@/lib/ac-angry/supabase-admin";
import type { GSUsuario } from "./types";

export async function gsList(
  tabela: string,
  opts: {
    colunas?: string;
    ordem?: string;
    usuario?: GSUsuario | null;
    filtroAr?: boolean;
  } = {},
) {
  const admin = await getSupabaseAdmin();
  let query = admin.from(tabela).select(opts.colunas ?? "*");

  if (opts.filtroAr && opts.usuario && opts.usuario.ar_id) {
    query = query.eq("ar_id", opts.usuario.ar_id);
  }
  if (opts.ordem) {
    query = query.order(opts.ordem, { ascending: false });
  }
  const { data, error } = await query;
  if (error) throw error;
  return data ?? [];
}
