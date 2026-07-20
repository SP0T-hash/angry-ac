import { redirect } from "next/navigation";
import { getGSSession } from "@/lib/gs/session";
import { NIVEL_LABEL, isAR } from "@/lib/gs/types";
import { gsList } from "@/lib/gs/data";
import GSShell from "@/components/gs/GSShell";
import GSTable from "@/components/gs/GSTable";

export default async function GSTicketsPage() {
  const sess = await getGSSession();
  if (!sess) redirect("/gs/login");

  let rows: any[] = [];
  let erro = "";
  try {
    rows = await gsList("gs_tickets", { colunas: "id,titulo,categoria,prioridade,status,criado_em", ordem: "criado_em" });
  } catch (e: any) { erro = e.message; }

  return (
    <GSShell usuario={sess.usuario} nivelLabel={NIVEL_LABEL[sess.usuario.nivel]} isAR={isAR(sess.usuario.nivel)}
      titulo="Suporte / Tickets" subtitulo="Chamados de suporte GS">
      {erro && <div className="text-rose-600 text-sm bg-rose-50 border border-rose-100 rounded-lg px-3 py-2 mb-4">{erro}</div>}
      <GSTable titulo="Tickets" colunas={[
        { key: "titulo", label: "Título" },
        { key: "categoria", label: "Categoria" },
        { key: "prioridade", label: "Prioridade" },
        { key: "status", label: "Status" },
        { key: "criado_em", label: "Aberto em" },
      ]} linhas={rows.map((r) => ({ ...r, criado_em: new Date(r.criado_em).toLocaleDateString("pt-BR") }))} />
    </GSShell>
  );
}
