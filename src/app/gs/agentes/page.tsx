// Agentes — comissões e pagamentos de AGRs (gs_comissoes)
import { redirect } from "next/navigation";
import { getGSSession } from "@/lib/gs/session";
import { NIVEL_LABEL, isAR } from "@/lib/gs/types";
import { gsList } from "@/lib/gs/data";
import GSListClient from "@/components/gs/GSListClient";

export default async function GSAgentesPage() {
  const sess = await getGSSession();
  if (!sess) redirect("/gs/login");

  let rows: any[] = [];
  let erro = "";
  try {
    rows = await gsList("gs_comissoes", { usuario: sess.usuario, ordem: "created_at" });
  } catch (e: any) { erro = e.message; }

  return (
    <GSListClient
      usuario={sess.usuario}
      nivelLabel={NIVEL_LABEL[sess.usuario.nivel]}
      isAR={isAR(sess.usuario.nivel)}
      titulo="Agentes / Comissões"
      subtitulo="Pagamentos e comissões de Agentes de Registro"
      tabela="gs_comissoes"
      erro={erro}
      colunas={[
        { key: "mes_referencia", label: "Mês Ref.", mono: true },
        { key: "tipo", label: "Tipo" },
        { key: "status", label: "Status" },
        { key: "valor_bruto", label: "Valor Bruto (R$)" },
        { key: "percentual", label: "%" },
        { key: "valor_comissao", label: "Comissão (R$)" },
      ]}
      linhas={rows.map((c) => ({
        ...c,
        valor_bruto: c.valor_bruto ? `R$ ${(Number(c.valor_bruto) / 100).toFixed(2)}` : "R$ 0,00",
        valor_comissao: c.valor_comissao ? `R$ ${(Number(c.valor_comissao) / 100).toFixed(2)}` : "R$ 0,00",
        percentual: c.percentual ? `${Number(c.percentual).toFixed(1)}%` : "—",
      }))}
      campos={[
        { name: "tipo", label: "Tipo", type: "select", required: true, options: [
          { value: "ATENDIMENTO", label: "Atendimento" },
          { value: "VENDA", label: "Venda" },
          { value: "COMISSAO_CERT", label: "Comissão Certificado" },
        ]},
        { name: "valor_bruto", label: "Valor Bruto (centavos)", type: "number", required: true },
        { name: "percentual", label: "Percentual (%)", type: "number" },
        { name: "valor_comissao", label: "Valor Comissão (centavos)", type: "number", required: true },
        { name: "mes_referencia", label: "Mês Referência (AAAA-MM)", required: true },
        { name: "status", label: "Status", type: "select", options: [
          { value: "PENDENTE", label: "Pendente" },
          { value: "PAGA", label: "Paga" },
          { value: "CANCELADA", label: "Cancelada" },
        ]},
      ]}
    />
  );
}
