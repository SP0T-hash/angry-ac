import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/infra/supabase/client";
import { getGSSession } from "@/lib/gs/session";
import { isAdmin, isAR, type GSNivel, type GSUsuario } from "@/lib/gs/types";

// Handler genérico de mutação do módulo GS (server-side, service-role).
// Protegido por sessão GS (cookie httpOnly) + RBAC + isolamento de tenant.
// Body: { tabela, id?, data }

type NivelMinimo = "ADMIN" | "AR";

interface TabelaPolicy {
  minNivel: NivelMinimo;
  // ALLOWLIST de campos graváveis. Tudo fora daqui é descartado
  // (id, created_at, updated_at nunca entram).
  campos: string[];
  // Campos de tenant que só ADMIN pode definir; para não-ADMIN são
  // forçados a partir da sessão.
  camposTenant: string[];
}

const POLICY: Record<string, TabelaPolicy> = {
  gs_formas_pagamento: {
    minNivel: "AR",
    campos: ["tipo", "descricao", "ativo", "ordem", "ar_id", "config"],
    camposTenant: ["ar_id"],
  },
  gs_ars: {
    minNivel: "ADMIN",
    campos: ["nome", "cnpj", "email", "telefone", "config", "is_active", "slug", "logo_url", "branding"],
    camposTenant: [],
  },
  gs_unidades: {
    minNivel: "ADMIN",
    campos: ["nome", "cnpj", "tipo", "is_active", "ar_id"],
    camposTenant: ["ar_id"],
  },
  gs_pontos_atendimento: {
    minNivel: "ADMIN",
    campos: ["codigo", "nome", "is_active", "unidade_id"],
    camposTenant: ["unidade_id"],
  },
  gs_planos: {
    minNivel: "ADMIN",
    campos: [
      "slug", "nome", "publico_alvo", "nivel", "valor_mensal",
      "taxa_por_cert", "recursos", "is_active",
    ],
    camposTenant: [],
  },
  gs_clientes: {
    minNivel: "AR",
    campos: [
      "nome", "cpf_cnpj", "tipo_pessoa", "email", "telefone",
      "contador_id", "ar_id", "unidade_id",
    ],
    camposTenant: ["ar_id", "unidade_id"],
  },
  gs_pedidos: {
    minNivel: "AR",
    campos: [
      "cliente_id", "usuario_id", "ponto_id", "protocolo",
      "tipo_certificado", "produto", "ac_provider", "status",
      "valor_total", "valor_comissao", "pago_em", "ar_id", "unidade_id",
    ],
    camposTenant: ["ar_id", "unidade_id"],
  },
  gs_cobrancas: {
    minNivel: "AR",
    campos: [
      "assinatura_id", "ar_id", "contador_id", "numero", "descricao", "periodo_ref",
      "data_vencimento", "valor_mensalidade", "valor_excedente",
      "valor_total", "status", "repasse_gs", "repasse_ar", "data_pagamento",
    ],
    camposTenant: ["ar_id"],
  },
  gs_tickets: {
    minNivel: "AR",
    campos: [
      "usuario_id", "cliente_id", "categoria", "prioridade",
      "status", "titulo", "descricao",
    ],
    camposTenant: [],
  },
  gs_assinaturas: {
    minNivel: "AR",
    campos: [
      "contador_id", "plano_id", "status", "asaas_subscription_id",
      "split_percent_gs", "split_percent_ar", "ar_id",
    ],
    camposTenant: ["ar_id"],
  },
  gs_agenda: {
    minNivel: "AR",
    campos: [
      "cliente_nome", "cliente_telefone", "cliente_email",
      "data", "hora_inicio", "hora_fim", "tipo_servico",
      "status", "agente_nome", "observacoes", "ar_id", "unidade_id",
    ],
    camposTenant: ["ar_id", "unidade_id"],
  },
  gs_comissoes: {
    minNivel: "AR",
    campos: [
      "agente_id", "agenda_id", "pedido_id", "tipo",
      "valor_bruto", "percentual", "valor_comissao",
      "mes_referencia", "status", "ar_id",
    ],
    camposTenant: ["ar_id"],
  },
  gs_contadores: {
    minNivel: "AR",
    campos: ["usuario_id", "nome", "email", "telefone", "valor_custo_cert", "ativo", "ar_id"],
    camposTenant: ["ar_id"],
  },
  gs_contador_carteira: {
    minNivel: "AR",
    campos: [
      "contador_id", "cliente_id", "pedido_id", "status",
      "data_expiracao", "lembrete_60d", "lembrete_30d", "lembrete_15d",
    ],
    camposTenant: [],
  },
  gs_usuarios: {
    minNivel: "ADMIN",
    campos: [
      "nome", "email", "cpf", "telefone", "nivel",
      "ar_id", "unidade_id", "ponto_id", "is_active",
    ],
    camposTenant: ["ar_id", "unidade_id"],
  },
  gs_faturas: {
    minNivel: "AR",
    campos: [
      "cliente_nome", "cliente_documento", "cliente_email",
      "cliente_telefone", "descricao", "valor_original",
      "valor_desconto", "valor_total", "data_vencimento",
      "tipo_cobranca", "meio_pagamento", "status", "parcelas",
      "taxa_gateway", "conciliado", "ar_id",
    ],
    camposTenant: ["ar_id"],
  },
};

function nivelPermite(minNivel: NivelMinimo, nivel: GSNivel): boolean {
  if (minNivel === "ADMIN") return isAdmin(nivel);
  return isAR(nivel); // AR ou ADMIN (CONTADOR/VENDEDOR não passam)
}

// ─── RBAC granular via gs_permissoes (best-effort) ──────────────────────────
const TABELA_MODULO: Record<string, string> = {
  gs_ars: "config", gs_unidades: "config", gs_pontos_atendimento: "config",
  gs_clientes: "clientes", gs_pedidos: "pedidos", gs_agenda: "agenda",
  gs_cobrancas: "financeiro", gs_faturas: "financeiro",
  gs_assinaturas: "financeiro", gs_planos: "financeiro", gs_comissoes: "financeiro",
  gs_tickets: "suporte", gs_usuarios: "config",
  gs_contador_carteira: "contador",
};

const ACAO_MAP: Record<string, string> = { INSERT: "criar", UPDATE: "editar", DELETE: "excluir" };

/** Checa a tabela gs_permissoes para o nível do usuário. Retorna true se permitido. */
async function verificarPermissao(
  supabase: Awaited<ReturnType<typeof getSupabaseAdmin>>,
  usuario: GSUsuario,
  tabela: string,
  acao: "INSERT" | "UPDATE" | "DELETE",
): Promise<boolean> {
  const modulo = TABELA_MODULO[tabela];
  const acaoPerm = ACAO_MAP[acao];
  if (!modulo || !acaoPerm) return true; // sem mapeamento → coarse check é suficiente

  const { data: perms, error } = await supabase
    .from("gs_permissoes")
    .select("acao, escopo")
    .eq("nivel", usuario.nivel)
    .eq("modulo", modulo);

  if (error || !perms || perms.length === 0) return true; // não há regras → coarse ok
  return perms.some((p) => p.acao === acaoPerm || p.acao === "aprovar");
}

function sanitizarPayload(
  data: Record<string, unknown>,
  policy: TabelaPolicy,
  usuario: GSUsuario,
): Record<string, unknown> {
  const admin = isAdmin(usuario.nivel);
  const permitido: Record<string, unknown> = {};

  for (const campo of policy.campos) {
    if (!(campo in data)) continue;
    // Campos de tenant só passam do cliente se ADMIN
    if (policy.camposTenant.includes(campo) && !admin) continue;
    permitido[campo] = data[campo];
  }

  // Não-ADMIN: tenant ids sempre vêm da sessão, nunca do cliente
  if (!admin) {
    if (policy.camposTenant.includes("ar_id") && usuario.ar_id) {
      permitido.ar_id = usuario.ar_id;
    }
    if (policy.camposTenant.includes("unidade_id") && usuario.unidade_id) {
      permitido.unidade_id = usuario.unidade_id;
    }
  }

  return permitido;
}

async function auditar(
  admin: Awaited<ReturnType<typeof getSupabaseAdmin>>,
  entry: {
    usuario_id: string;
    tabela: string;
    acao: "INSERT" | "UPDATE" | "DELETE";
    registro_id: string | null;
    payload: Record<string, unknown>;
  },
) {
  try {
    await admin.from("gs_audit_logs").insert(entry).then(() => {});
  } catch {
    // best-effort: tabela pode não existir ainda
  }
}

export async function POST(req: NextRequest) {
  try {
    const sess = await getGSSession();
    if (!sess) {
      return NextResponse.json({ error: "Não autenticado." }, { status: 401 });
    }
    const { usuario } = sess;

    const { tabela, id, data } = await req.json();
    const policy = POLICY[tabela as string];
    if (!policy) {
      return NextResponse.json({ error: "Tabela não permitida." }, { status: 403 });
    }
    if (!nivelPermite(policy.minNivel, usuario.nivel)) {
      return NextResponse.json({ error: "Sem permissão." }, { status: 403 });
    }
    if (!data || typeof data !== "object" || Array.isArray(data)) {
      return NextResponse.json({ error: "Dados inválidos." }, { status: 400 });
    }

    const admin = await getSupabaseAdmin();

    // Verificação granular via gs_permissoes (best-effort, ignora se não houver registros)
    if (!(await verificarPermissao(admin, usuario, tabela, id ? "UPDATE" : "INSERT"))) {
      return NextResponse.json({ error: "Sem permissão para esta ação." }, { status: 403 });
    }

    const allowedData = sanitizarPayload(data, policy, usuario);
    if (Object.keys(allowedData).length === 0) {
      return NextResponse.json({ error: "Dados inválidos." }, { status: 400 });
    }

    if (id) {
      // UPDATE: verificar isolamento de tenant antes de gravar
      const { data: row, error: selErr } = await admin
        .from(tabela)
        .select("*")
        .eq("id", id)
        .maybeSingle();
      if (selErr) {
        console.error("[gs/mutate] select", selErr);
        return NextResponse.json({ error: "Operação inválida." }, { status: 400 });
      }
      if (!row) {
        return NextResponse.json({ error: "Registro não encontrado." }, { status: 404 });
      }
      if (
        "ar_id" in row &&
        !isAdmin(usuario.nivel) &&
        row.ar_id !== usuario.ar_id
      ) {
        return NextResponse.json({ error: "Sem permissão." }, { status: 403 });
      }

      const { error } = await admin.from(tabela).update(allowedData).eq("id", id);
      if (error) {
        console.error("[gs/mutate] update", error);
        return NextResponse.json({ error: "Operação inválida." }, { status: 400 });
      }
      await auditar(admin, {
        usuario_id: usuario.id,
        tabela,
        acao: "UPDATE",
        registro_id: id,
        payload: { campos: Object.keys(allowedData) },
      });
      return NextResponse.json({ ok: true, id });
    } else {
      const { data: inserted, error } = await admin
        .from(tabela)
        .insert(allowedData)
        .select("id")
        .single();
      if (error) {
        console.error("[gs/mutate] insert", error);
        return NextResponse.json({ error: "Operação inválida." }, { status: 400 });
      }
      await auditar(admin, {
        usuario_id: usuario.id,
        tabela,
        acao: "INSERT",
        registro_id: inserted?.id ?? null,
        payload: { campos: Object.keys(allowedData) },
      });
      return NextResponse.json({ ok: true, id: inserted?.id });
    }
  } catch (e) {
    console.error("[gs/mutate]", e);
    return NextResponse.json({ error: "Erro interno." }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const sess = await getGSSession();
    if (!sess) {
      return NextResponse.json({ error: "Não autenticado." }, { status: 401 });
    }
    const { usuario } = sess;

    const { tabela, id } = await req.json();
    const policy = POLICY[tabela as string];
    if (!policy || !id) {
      return NextResponse.json({ error: "Requisição inválida." }, { status: 400 });
    }
    if (!nivelPermite(policy.minNivel, usuario.nivel)) {
      return NextResponse.json({ error: "Sem permissão." }, { status: 403 });
    }

    const admin = await getSupabaseAdmin();

    if (!(await verificarPermissao(admin, usuario, tabela, "DELETE"))) {
      return NextResponse.json({ error: "Sem permissão para excluir." }, { status: 403 });
    }

    const { data: row, error: selErr } = await admin
      .from(tabela)
      .select("*")
      .eq("id", id)
      .maybeSingle();
    if (selErr) {
      console.error("[gs/mutate] select", selErr);
      return NextResponse.json({ error: "Operação inválida." }, { status: 400 });
    }
    if (!row) {
      return NextResponse.json({ error: "Registro não encontrado." }, { status: 404 });
    }
    if (
      "ar_id" in row &&
      !isAdmin(usuario.nivel) &&
      row.ar_id !== usuario.ar_id
    ) {
      return NextResponse.json({ error: "Sem permissão." }, { status: 403 });
    }

    const { error } = await admin.from(tabela).delete().eq("id", id);
    if (error) {
      console.error("[gs/mutate] delete", error);
      return NextResponse.json({ error: "Operação inválida." }, { status: 400 });
    }
    await auditar(admin, {
      usuario_id: usuario.id,
      tabela,
      acao: "DELETE",
      registro_id: id,
      payload: { campos: [] },
    });
    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error("[gs/mutate]", e);
    return NextResponse.json({ error: "Erro interno." }, { status: 500 });
  }
}
