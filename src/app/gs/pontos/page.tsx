import { redirect } from "next/navigation";
import { getGSSession } from "@/lib/gs/session";
import { NIVEL_LABEL, isAR } from "@/lib/gs/types";
import { gsList } from "@/lib/gs/data";
import GSListClient from "@/components/gs/GSListClient";

export default async function GSPontosPage() {
  const sess = await getGSSession();
  if (!sess) redirect("/gs/login");

  let rows: any[] = []; let unidades: any[] = []; let erro = "";
  try {
    rows = await gsList("gs_pontos_atendimento", { colunas: "id,codigo,nome,ativo,unidade_id", ordem: "nome" });
    unidades = await gsList("gs_unidades", { colunas: "id,nome" });
  } catch (e: any) { erro = e.message; }

  const unOptions = unidades.map((u) => ({ value: u.id, label: u.nome }));

  return (
    <GSListClient
      usuario={sess.usuario}
      nivelLabel={NIVEL_LABEL[sess.usuario.nivel]}
      isAR={isAR(sess.usuario.nivel)}
      titulo="Pontos de Atendimento"
      subtitulo="AGRs vinculados às unidades"
      tabela="gs_pontos_atendimento"
      erro={erro}
      colunas={[
        { key: "codigo", label: "Código", mono: true },
        { key: "nome", label: "Nome" },
        { key: "ativo", label: "Ativo" },
      ]}
      linhas={rows.map((r) => ({ ...r, ativo: r.is_active ? "Sim" : "Não" }))}
      campos={[
        { name: "unidade_id", label: "Unidade", type: "select", required: true, options: unOptions },
        { name: "codigo", label: "Código", required: true },
        { name: "nome", label: "Nome", required: true },
        { name: "is_active", label: "Ativo", type: "select", defaultValue: true, options: [{ value: true, label: "Sim" }, { value: false, label: "Não" }] },
      ]}
    />
  );
}
