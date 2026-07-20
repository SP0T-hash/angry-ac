import { redirect } from "next/navigation";
import { getGSSession } from "@/lib/gs/session";
import { NIVEL_LABEL, isAR } from "@/lib/gs/types";
import { gsList } from "@/lib/gs/data";
import GSShell from "@/components/gs/GSShell";
import GSTable from "@/components/gs/GSTable";

export default async function GSArsPage() {
  const sess = await getGSSession();
  if (!sess) redirect("/gs/login");

  let ars: any[] = [];
  let erro = "";
  try {
    ars = await gsList("gs_ars", { colunas: "id,nome,cnpj,email,ativo,criado_em", ordem: "criado_em" });
  } catch (e: any) {
    erro = e.message;
  }

  return (
    <GSShell
      usuario={sess.usuario}
      nivelLabel={NIVEL_LABEL[sess.usuario.nivel]}
      isAR={isAR(sess.usuario.nivel)}
      titulo="Autoridades de Registro (ARs)"
      subtitulo="Gestão multi-tenant de ARs parceiras"
    >
      {erro && <div className="text-rose-600 text-sm bg-rose-50 border border-rose-100 rounded-lg px-3 py-2 mb-4">{erro}</div>}
      <GSTable
        titulo="ARs cadastradas"
        colunas={[
          { key: "nome", label: "Nome" },
          { key: "cnpj", label: "CNPJ", mono: true },
          { key: "email", label: "Email" },
          { key: "ativo", label: "Ativo" },
          { key: "criado_em", label: "Criado em" },
        ]}
        linhas={ars.map((a) => ({ ...a, ativo: a.ativo ? "Sim" : "Não", criado_em: new Date(a.criado_em).toLocaleDateString("pt-BR") }))}
      />
    </GSShell>
  );
}
