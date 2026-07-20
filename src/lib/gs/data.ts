// Busca dados do módulo GS via service-role (server-side).
// Usa filtragem por tenant quando aplicável.
import { getSupabaseAdmin } from "@/lib/infra/supabase/client";
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

export interface GSKpis {
  ars: number;
  unidades: number;
  pedidos: number;
  receitaMes: number;
}

// Contagens reais do banco para o dashboard (spec 002). Usa count() do PostgREST.
export async function gsKpis(usuario?: GSUsuario | null): Promise<GSKpis> {
  const admin = await getSupabaseAdmin();

  const arFilter = usuario?.ar_id ? { ar_id: usuario.ar_id } : undefined;

  const [ars, unidades, pedidos, cobrancas] = await Promise.all([
    admin.from("gs_ars").select("*", { count: "exact", head: true }).eq("is_active", true),
    admin.from("gs_unidades").select("*", { count: "exact", head: true }).eq("is_active", true),
    admin.from("gs_pedidos").select("*", { count: "exact", head: true }),
    admin.from("gs_cobrancas")
      .select("valor_total, data_pagamento")
      .eq("status", "PAGA")
      .gte("data_pagamento", new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString()),
  ]);

  const receitaMes = (cobrancas.data ?? []).reduce(
    (acc: number, c: any) => acc + (Number(c.valor_total) || 0),
    0,
  );

  return {
    ars: ars.count ?? 0,
    unidades: unidades.count ?? 0,
    pedidos: pedidos.count ?? 0,
    receitaMes,
  };
}
