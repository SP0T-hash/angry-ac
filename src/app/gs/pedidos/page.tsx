import { redirect } from "next/navigation";
import { getGSSession } from "@/lib/gs/session";
import { NIVEL_LABEL, isAR } from "@/lib/gs/types";
import { gsList } from "@/lib/gs/data";
import GSShell from "@/components/gs/GSShell";
import GSTable from "@/components/gs/GSTable";

const STATUS_LABEL: Record<string, string> = {};

export default async function GSPedidosPage() {
  const sess = await getGSSession();
  if (!sess) redirect("/gs/login");

  let rows: any[] = [];
  let erro = "";
  try {
    rows = await gsList("gs_pedidos", { colunas: "id,protocolo,tipo_certificado,produto,status,valor_total", ordem: "criado_em" });
  } catch (e: any) { erro = e.message; }

  return (
    <GSShell usuario={sess.usuario} nivelLabel={NIVEL_LABEL[sess.usuario.nivel]} isAR={isAR(sess.usuario.nivel)}
      titulo="Pedidos de Certificado" subtitulo="Fluxo de emissão ICP-Brasil">
      {erro && <div className="text-rose-600 text-sm bg-rose-50 border border-rose-100 rounded-lg px-3 py-2 mb-4">{erro}</div>}
      <GSTable titulo="Pedidos" colunas={[
        { key: "protocolo", label: "Protocolo", mono: true },
        { key: "tipo_certificado", label: "Tipo" },
        { key: "produto", label: "Produto" },
        { key: "status", label: "Status" },
        { key: "valor_total", label: "Valor" },
      ]} linhas={rows.map((r) => ({ ...r, valor_total: `R$ ${(r.valor_total ?? 0).toFixed(2)}` }))} />
    </GSShell>
  );
}
