// Faturas — cobranças avulsas para clientes (gs_faturas)
import { redirect } from "next/navigation";
import { getGSSession } from "@/lib/gs/session";
import { NIVEL_LABEL, isAR } from "@/lib/gs/types";
import { gsList } from "@/lib/gs/data";
import GSListClient from "@/components/gs/GSListClient";

export default async function GSFaturasPage() {
  const sess = await getGSSession();
  if (!sess) redirect("/gs/login");

  let rows: any[] = [];
  let erro = "";
  try {
    rows = await gsList("gs_faturas", { usuario: sess.usuario, ordem: "created_at" });
  } catch (e: any) { erro = e.message; }

  return (
    <GSListClient
      usuario={sess.usuario}
      nivelLabel={NIVEL_LABEL[sess.usuario.nivel]}
      isAR={isAR(sess.usuario.nivel)}
      titulo="Faturas"
      subtitulo="Cobranças avulsas para clientes"
      tabela="gs_faturas"
      erro={erro}
      colunas={[
        { key: "cliente_nome", label: "Cliente" },
        { key: "cliente_documento", label: "CPF/CNPJ", mono: true },
        { key: "valor_total", label: "Valor" },
        { key: "status", label: "Status" },
        { key: "data_vencimento", label: "Vencimento" },
        { key: "meio_pagamento", label: "Pagamento" },
      ]}
      linhas={rows.map((f) => ({
        ...f,
        valor_total: f.valor_total ? `R$ ${Number(f.valor_total).toFixed(2)}` : "—",
        data_vencimento: f.data_vencimento ? new Date(f.data_vencimento).toLocaleDateString("pt-BR") : "—",
      }))}
      campos={[
        { name: "cliente_nome", label: "Nome do Cliente", required: true },
        { name: "cliente_documento", label: "CPF/CNPJ" },
        { name: "cliente_email", label: "E-mail" },
        { name: "cliente_telefone", label: "Telefone" },
        { name: "descricao", label: "Descrição", type: "textarea" },
        { name: "valor_original", label: "Valor Original (R$)", type: "number" },
        { name: "valor_desconto", label: "Desconto (R$)", type: "number" },
        { name: "valor_total", label: "Valor Total (R$)", type: "number", required: true },
        { name: "data_vencimento", label: "Data Vencimento", type: "date" },
        { name: "tipo_cobranca", label: "Tipo de Cobrança", type: "select", options: [
          { value: "BOLETO", label: "Boleto" },
          { value: "PIX", label: "PIX" },
          { value: "CARTAO", label: "Cartão" },
          { value: "TRANSFERENCIA", label: "Transferência" },
          { value: "DINHEIRO", label: "Dinheiro" },
        ]},
        { name: "meio_pagamento", label: "Meio Pagamento", type: "select", options: [
          { value: "", label: "—" },
          { value: "ASAAS_BOLETO", label: "Asaas - Boleto" },
          { value: "ASAAS_PIX", label: "Asaas - PIX" },
          { value: "ASAAS_CARTAO", label: "Asaas - Cartão" },
          { value: "MANUAL", label: "Manual" },
        ]},
        { name: "status", label: "Status", type: "select", options: [
          { value: "PENDENTE", label: "Pendente" },
          { value: "ENVIADA", label: "Enviada" },
          { value: "PAGA", label: "Paga" },
          { value: "VENCIDA", label: "Vencida" },
          { value: "CANCELADA", label: "Cancelada" },
        ]},
        { name: "parcelas", label: "Parcelas", type: "number", defaultValue: 1 },
      ]}
    />
  );
}
