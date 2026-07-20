import { redirect } from "next/navigation";
import { getGSSession } from "@/lib/gs/session";
import { NIVEL_LABEL, isAR } from "@/lib/gs/types";
import { gsList } from "@/lib/gs/data";
import GSListClient from "@/components/gs/GSListClient";

const STATUS = [
  "RASCUNHO", "AGUARDANDO_DOC", "EM_VALIDACAO", "AGUARDANDO_BIO", "AGUARDANDO_VIDEO",
  "EM_EMISSAO", "EMITIDO", "REJEITADO", "EXPIRADO", "CANCELADO", "AGUARDANDO_PAGAMENTO", "PAGO", "ERRO_EMISSAO",
];

export default async function GSPedidosPage() {
  const sess = await getGSSession();
  if (!sess) redirect("/gs/login");

  let rows: any[] = []; let ars: any[] = []; let clientes: any[] = []; let erro = "";
  try {
    rows = await gsList("gs_pedidos", { colunas: "id,protocolo,tipo_certificado,produto,status,valor_total,ar_id,cliente_id", ordem: "criado_em" });
    ars = await gsList("gs_ars", { colunas: "id,nome" });
    clientes = await gsList("gs_clientes", { colunas: "id,nome" });
  } catch (e: any) { erro = e.message; }

  const arOptions = ars.map((a) => ({ value: a.id, label: a.nome }));
  const cliOptions = clientes.map((c) => ({ value: c.id, label: c.nome }));

  return (
    <GSListClient
      usuario={sess.usuario}
      nivelLabel={NIVEL_LABEL[sess.usuario.nivel]}
      isAR={isAR(sess.usuario.nivel)}
      titulo="Pedidos de Certificado"
      subtitulo="Fluxo de emissão ICP-Brasil"
      tabela="gs_pedidos"
      erro={erro}
      colunas={[
        { key: "protocolo", label: "Protocolo", mono: true },
        { key: "tipo_certificado", label: "Tipo" },
        { key: "produto", label: "Produto" },
        { key: "status", label: "Status" },
        { key: "valor_total", label: "Valor" },
      ]}
      linhas={rows.map((r) => ({ ...r, valor_total: `R$ ${(r.valor_total ?? 0).toFixed(2)}` }))}
      campos={[
        { name: "ar_id", label: "AR", type: "select", required: true, options: arOptions },
        { name: "cliente_id", label: "Cliente", type: "select", options: cliOptions },
        { name: "protocolo", label: "Protocolo", required: true },
        { name: "tipo_certificado", label: "Tipo Cert.", type: "select", defaultValue: "A1", options: [
          { value: "A1", label: "A1" }, { value: "A3", label: "A3" }, { value: "NUVEM", label: "Nuvem" },
        ] },
        { name: "produto", label: "Produto" },
        { name: "ac_provider", label: "AC Provider" },
        { name: "status", label: "Status", type: "select", defaultValue: "RASCUNHO", options: STATUS.map((s) => ({ value: s, label: s })) },
        { name: "valor_total", label: "Valor Total", type: "number" },
        { name: "valor_comissao", label: "Comissão", type: "number" },
      ]}
    />
  );
}
