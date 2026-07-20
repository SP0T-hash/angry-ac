import { redirect } from "next/navigation";
import { getGSSession } from "@/lib/gs/session";
import { NIVEL_LABEL, isAR } from "@/lib/gs/types";
import { gsList } from "@/lib/gs/data";
import GSListClient from "@/components/gs/GSListClient";

export default async function GSUnidadesPage() {
  const sess = await getGSSession();
  if (!sess) redirect("/gs/login");

  let rows: any[] = []; let ars: any[] = []; let erro = "";
  try {
    rows = await gsList("gs_unidades", { colunas: "id,nome,cnpj,tipo,ativo,ar_id", ordem: "nome" });
    ars = await gsList("gs_ars", { colunas: "id,nome" });
  } catch (e: any) { erro = e.message; }

  const arOptions = ars.map((a) => ({ value: a.id, label: a.nome }));

  return (
    <GSListClient
      usuario={sess.usuario}
      nivelLabel={NIVEL_LABEL[sess.usuario.nivel]}
      isAR={isAR(sess.usuario.nivel)}
      titulo="Unidades"
      subtitulo="Matrizes, filiais, parceiros e franquias"
      tabela="gs_unidades"
      erro={erro}
      colunas={[
        { key: "nome", label: "Nome" },
        { key: "cnpj", label: "CNPJ", mono: true },
        { key: "tipo", label: "Tipo" },
        { key: "ativo", label: "Ativo" },
      ]}
      linhas={rows.map((r) => ({ ...r, ativo: r.is_active ? "Sim" : "Não" }))}
      campos={[
        { name: "ar_id", label: "AR (Autoridade)", type: "select", required: true, options: arOptions },
        { name: "nome", label: "Nome", required: true },
        { name: "cnpj", label: "CNPJ", required: true },
        { name: "tipo", label: "Tipo", type: "select", defaultValue: "MATRIZ", options: [
          { value: "MATRIZ", label: "Matriz" }, { value: "FILIAL", label: "Filial" },
          { value: "PARCEIRO", label: "Parceiro" }, { value: "FRANQUIA", label: "Franquia" },
        ] },
        { name: "is_active", label: "Ativo", type: "select", defaultValue: true, options: [{ value: true, label: "Sim" }, { value: false, label: "Não" }] },
      ]}
    />
  );
}
