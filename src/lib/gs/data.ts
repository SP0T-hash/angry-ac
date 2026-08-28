// Busca dados do módulo GS via service-role (server-side).
// APLICA isolamento automático de tenant: usuários não-ADMIN só veem seus
// próprios registros (mitiga IDOR de leitura que antes existia em toda página).
import { getSupabaseAdmin } from "@/lib/infra/supabase/client";
import type { GSUsuario } from "./types";
import { isAdmin } from "./types";

// Tabelas que possuem coluna `ar_id` → tenant isolation se aplica automaticamente.
const AR_SCOPED_TABLES = new Set([
  "gs_unidades", "gs_pontos_atendimento", "gs_clientes",
  "gs_pedidos", "gs_cobrancas", "gs_assinaturas", "gs_faturas",
  "gs_tickets", "gs_agenda", "gs_comissoes", "gs_notas_fiscais",
  "gs_transacoes", "gs_gateway_logs", "gs_integracao_logs",
  "gs_scanner_resultados",
]);

// Allowlist de tabelas consultáveis (defesa em profundidade).
const ALLOWED_TABLES = new Set([
  ...AR_SCOPED_TABLES,
  "gs_ars", "gs_planos", "gs_usuarios", "gs_sessoes",
  "gs_permissoes", "gs_taxas", "gs_contadores", "gs_integracoes_ac", "gs_formas_pagamento",
  "gs_ticket_respostas", "gs_notificacoes", "gs_audit_logs",
]);

export async function gsList(
  tabela: string,
  opts: {
    colunas?: string;
    ordem?: string;
    usuario?: GSUsuario | null;
    filtroAr?: boolean; // force tenant filter even for non-scoped tables
  } = {},
) {
  if (!ALLOWED_TABLES.has(tabela)) {
    throw new Error(`Tabela não permitida para leitura: ${tabela}`);
  }
  const admin = await getSupabaseAdmin();
  let query = admin.from(tabela).select(opts.colunas ?? "*");

  // Isolamento automático: não-ADMIN só enxerga registros do seu AR.
  const usuario = opts.usuario;
  if (usuario && usuario.ar_id && !isAdmin(usuario.nivel)) {
    if (AR_SCOPED_TABLES.has(tabela) || opts.filtroAr) {
      query = query.eq("ar_id", usuario.ar_id);
    }
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
  const nonAdmin = usuario && !isAdmin(usuario.nivel);

  let qArs = admin.from("gs_ars").select("*", { count: "exact", head: true }).eq("is_active", true);
  let qUnidades = admin.from("gs_unidades").select("*", { count: "exact", head: true }).eq("is_active", true);
  let qPedidos = admin.from("gs_pedidos").select("*", { count: "exact", head: true });
  let qCobrancas = admin.from("gs_cobrancas")
    .select("valor_total, data_pagamento")
    .eq("status", "PAGA")
    .gte("data_pagamento", new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString());

  // Tenant: usuário não-admin só enxerga dados do seu AR.
  if (nonAdmin && usuario?.ar_id) {
    qArs = qArs.eq("id", usuario.ar_id);
    qUnidades = qUnidades.eq("ar_id", usuario.ar_id);
    qPedidos = qPedidos.eq("ar_id", usuario.ar_id);
    qCobrancas = qCobrancas.eq("ar_id", usuario.ar_id);
  }

  const [ars, unidades, pedidos, cobrancas] = await Promise.all([
    qArs, qUnidades, qPedidos, qCobrancas,
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
