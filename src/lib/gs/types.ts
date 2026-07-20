// Tipos do módulo GS (Gestão / Certificados / Contabilidade)
// Espelho das tabelas gs_* do SUPABASE_SCHEMA_GS.sql e SUPABASE_SCHEMA_BILLING.sql

export type GSNivel =
  | "AC_ADMIN"
  | "AC_SUPORTE"
  | "AR_ADMIN"
  | "AR_FINANCEIRO"
  | "AR_SUPORTE"
  | "UNIDADE_ADMIN"
  | "UNIDADE_AGR"
  | "UNIDADE_VENDAS"
  | "CONTADOR";

export type GSStatusPedido =
  | "RASCUNHO"
  | "AGUARDANDO_DOC"
  | "EM_VALIDACAO"
  | "AGUARDANDO_BIO"
  | "AGUARDANDO_VIDEO"
  | "EM_EMISSAO"
  | "EMITIDO"
  | "REJEITADO"
  | "EXPIRADO"
  | "CANCELADO"
  | "AGUARDANDO_PAGAMENTO"
  | "PAGO"
  | "ERRO_EMISSAO";

export interface GSUsuario {
  id: string;
  email: string;
  nome: string;
  cpf: string | null;
  nivel: GSNivel;
  ar_id: string | null;
  unidade_id: string | null;
  ponto_id: string | null;
  ativo: boolean;
  criado_em: string;
}

export interface GSSessao {
  usuario: GSUsuario;
  token: string;
  expira_em: string;
}

export interface GSAr {
  id: string;
  nome: string;
  cnpj: string;
  email: string;
  telefone?: string;
  config?: Record<string, unknown>;
  ativo: boolean;
  criado_em: string;
}

export interface GSUnidade {
  id: string;
  ar_id: string;
  nome: string;
  cnpj: string;
  tipo: "MATRIZ" | "FILIAL" | "PARCEIRO" | "FRANQUIA";
  ativo: boolean;
}

export interface GSPonto {
  id: string;
  unidade_id: string;
  codigo: string;
  nome: string;
  ativo: boolean;
}

export interface GSCliente {
  id: string;
  ar_id: string;
  unidade_id: string | null;
  nome: string;
  cpf_cnpj: string;
  tipo_pessoa: "FISICA" | "JURIDICA";
  email?: string;
  telefone?: string;
  contador_id?: string | null;
}

export interface GSPedido {
  id: string;
  ar_id: string;
  unidade_id: string | null;
  ponto_id: string | null;
  cliente_id: string | null;
  usuario_id: string | null;
  protocolo: string;
  tipo_certificado: "A1" | "A3" | "NUVEM";
  produto: string;
  ac_provider: string;
  status: GSStatusPedido;
  valor_total: number;
  valor_comissao: number;
  pago_em?: string | null;
  criado_em: string;
}

export interface GSPlano {
  id: string;
  slug: string;
  nome: string;
  publico_alvo: string;
  nivel: string;
  valor_mensal: number;
  taxa_por_cert: number;
  recursos?: Record<string, unknown>;
  ativo: boolean;
}

export interface GSAssinatura {
  id: string;
  ar_id: string | null;
  contador_id: string | null;
  plano_id: string;
  status: string;
  asaas_subscription_id?: string | null;
  split_percent_gs: number;
  split_percent_ar: number;
}

export interface GSCobranca {
  id: string;
  assinatura_id: string;
  numero: string;
  valor_mensalidade: number;
  valor_excedente: number;
  valor_total: number;
  status: string;
  repasse_gs: number;
  repasse_ar: number;
}

export interface GSFatura {
  id: string;
  ar_id: string | null;
  cliente_id: string | null;
  pedido_id: string | null;
  numero: string;
  valor_total: number;
  meio_pagamento?: string;
  status: string;
  conciliado: boolean;
}

export interface GSTicket {
  id: string;
  usuario_id: string | null;
  cliente_id: string | null;
  categoria: string;
  prioridade: string;
  status: string;
  titulo: string;
  descricao?: string;
  criado_em: string;
}

// ─── Helpers de RBAC ──────────────────────────────────────────
export const NIVEL_LABEL: Record<GSNivel, string> = {
  AC_ADMIN: "Admin AC",
  AC_SUPORTE: "Suporte AC",
  AR_ADMIN: "Admin AR",
  AR_FINANCEIRO: "Financeiro AR",
  AR_SUPORTE: "Suporte AR",
  UNIDADE_ADMIN: "Admin Unidade",
  UNIDADE_AGR: "AGR Unidade",
  UNIDADE_VENDAS: "Vendas Unidade",
  CONTADOR: "Contador",
};

const ADMIN_NIVEIS: GSNivel[] = ["AC_ADMIN", "AC_SUPORTE"];
const AR_NIVEIS: GSNivel[] = ["AR_ADMIN", "AR_FINANCEIRO", "AR_SUPORTE"];
const UNIDADE_NIVEIS: GSNivel[] = [
  "UNIDADE_ADMIN",
  "UNIDADE_AGR",
  "UNIDADE_VENDAS",
];

export function isAdmin(nivel: GSNivel): boolean {
  return ADMIN_NIVEIS.includes(nivel);
}
export function isAR(nivel: GSNivel): boolean {
  return AR_NIVEIS.includes(nivel) || isAdmin(nivel);
}
export function isUnidade(nivel: GSNivel): boolean {
  return UNIDADE_NIVEIS.includes(nivel) || isAR(nivel);
}
export function isContador(nivel: GSNivel): boolean {
  return nivel === "CONTADOR";
}
