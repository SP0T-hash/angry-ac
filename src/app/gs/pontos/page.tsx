import { redirect } from "next/navigation";
import { getGSSession } from "@/lib/gs/session";
import { NIVEL_LABEL, isAR } from "@/lib/gs/types";
import { gsList } from "@/lib/gs/data";
import GSShell from "@/components/gs/GSShell";
import GSTable from "@/components/gs/GSTable";

export default async function GSPontosPage() {
  const sess = await getGSSession();
  if (!sess) redirect("/gs/login");

  let rows: any[] = [];
  let erro = "";
  try {
    rows = await gsList("gs_pontos_atendimento", { colunas: "id,codigo,nome,ativo", ordem: "nome" });
  } catch (e: any) { erro = e.message; }

  return (
    <GSShell usuario={sess.usuario} nivelLabel={NIVEL_LABEL[sess.usuario.nivel]} isAR={isAR(sess.usuario.nivel)}
      titulo="Pontos de Atendimento" subtitulo="AGRs vinculados às unidades">
      {erro && <div className="text-rose-600 text-sm bg-rose-50 border border-rose-100 rounded-lg px-3 py-2 mb-4">{erro}</div>}
      <GSTable titulo="Pontos de atendimento" colunas={[
        { key: "codigo", label: "Código", mono: true },
        { key: "nome", label: "Nome" },
        { key: "ativo", label: "Ativo" },
      ]} linhas={rows.map((r) => ({ ...r, ativo: r.ativo ? "Sim" : "Não" }))} />
    </GSShell>
  );
}
