import { redirect } from "next/navigation";
import { getGSSession } from "@/lib/gs/session";
import { NIVEL_LABEL, isAR } from "@/lib/gs/types";
import { gsList } from "@/lib/gs/data";
import GSListClient from "@/components/gs/GSListClient";

export default async function GSCobrancasPage() {
  const sess = await getGSSession();
  if (!sess) redirect("/gs/login");

  let cobrancas: any[] = []; let erro = "";
  try {
    cobrancas = await gsList("gs_cobrancas", {
      colunas: "id,numero,descricao,valor_total,status,data_vencimento,repasse_gs,repasse_ar",
      ordem: "numero",
    });
  } catch (e: any) { erro = e.message; }

  const statusLabel: Record<string, string> = {
    PENDENTE: "Pendente", VENCIDA: "Vencida", PAGA: "Paga",
    CANCELADA: "Cancelada", REEMBOLSADA: "Reembolsada", PARCIAL: "Parcial",
  };

  return (
    <GSListClient
      usuario={sess.usuario}
      nivelLabel={NIVEL_LABEL[sess.usuario.nivel]}
      isAR={isAR(sess.usuario.nivel)}
      titulo="Cobranças"
      subtitulo="Faturas e cobranças do GS"
      tabela="gs_cobrancas"
      erro={erro}
      colunas={[
        { key: "numero", label: "Número" },
        { key: "descricao", label: "Descrição" },
        { key: "valor_total", label: "Valor" },
        { key: "status", label: "Status" },
        { key: "data_vencimento", label: "Vencimento" },
      ]}
      linhas={cobrancas.map((c) => ({
        ...c,
        valor_total: `R$ ${(Number(c.valor_total) || 0).toFixed(2)}`,
        status: statusLabel[c.status] ?? c.status,
        data_vencimento: c.data_vencimento ? new Date(c.data_vencimento).toLocaleDateString("pt-BR") : "-",
      }))}
      campos={[
        { name: "numero", label: "Número", required: true },
        { name: "descricao", label: "Descrição" },
        { name: "valor_total", label: "Valor Total", type: "number", required: true },
        { name: "valor_mensalidade", label: "Mensalidade", type: "number" },
        { name: "valor_excedente", label: "Excedente", type: "number" },
        { name: "periodo_ref", label: "Período (AAAA-MM)" },
        { name: "data_vencimento", label: "Vencimento", type: "date" },
        { name: "status", label: "Status", type: "select", defaultValue: "PENDENTE", options: [
          { value: "PENDENTE", label: "Pendente" }, { value: "VENCIDA", label: "Vencida" },
          { value: "PAGA", label: "Paga" }, { value: "CANCELADA", label: "Cancelada" },
          { value: "REEMBOLSADA", label: "Reembolsada" }, { value: "PARCIAL", label: "Parcial" },
        ] },
        { name: "repasse_gs", label: "Repasse GS", type: "number" },
        { name: "repasse_ar", label: "Repasse AR", type: "number" },
      ]}
    />
  );
}
