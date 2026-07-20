import { redirect } from "next/navigation";
import { getGSSession } from "@/lib/gs/session";
import { NIVEL_LABEL, isAR } from "@/lib/gs/types";
import { gsList } from "@/lib/gs/data";
import GSListClient from "@/components/gs/GSListClient";

export default async function GSArsPage() {
  const sess = await getGSSession();
  if (!sess) redirect("/gs/login");

  let ars: any[] = [];
  let erro = "";
  try {
    ars = await gsList("gs_ars", { colunas: "id,nome,cnpj,email,ativo,criado_em", ordem: "criado_em" });
  } catch (e: any) { erro = e.message; }

  return (
    <GSListClient
      usuario={sess.usuario}
      nivelLabel={NIVEL_LABEL[sess.usuario.nivel]}
      isAR={isAR(sess.usuario.nivel)}
      titulo="Autoridades de Registro (ARs)"
      subtitulo="Gestão multi-tenant de ARs parceiras"
      tabela="gs_ars"
      erro={erro}
      colunas={[
        { key: "nome", label: "Nome" },
        { key: "cnpj", label: "CNPJ", mono: true },
        { key: "email", label: "Email" },
        { key: "ativo", label: "Ativo" },
        { key: "criado_em", label: "Criado em" },
      ]}
      linhas={ars.map((a) => ({ ...a, ativo: a.is_active ? "Sim" : "Não", criado_em: new Date(a.criado_em).toLocaleDateString("pt-BR") }))}
      campos={[
        { name: "nome", label: "Nome", required: true },
        { name: "cnpj", label: "CNPJ", required: true },
        { name: "email", label: "Email", type: "email" },
        { name: "telefone", label: "Telefone" },
        { name: "is_active", label: "Ativo", type: "select", defaultValue: true, options: [{ value: true, label: "Sim" }, { value: false, label: "Não" }] },
      ]}
    />
  );
}
