import { redirect } from "next/navigation";
import { getGSSession } from "@/lib/gs/session";
import { NIVEL_LABEL, isAR } from "@/lib/gs/types";
import { gsList } from "@/lib/gs/data";
import GSShell from "@/components/gs/GSShell";
import GSTable from "@/components/gs/GSTable";

export default async function GSClientesPage() {
  const sess = await getGSSession();
  if (!sess) redirect("/gs/login");

  let rows: any[] = [];
  let erro = "";
  try {
    rows = await gsList("gs_clientes", { colunas: "id,nome,cpf_cnpj,tipo_pessoa,email", ordem: "nome" });
  } catch (e: any) { erro = e.message; }

  return (
    <GSShell usuario={sess.usuario} nivelLabel={NIVEL_LABEL[sess.usuario.nivel]} isAR={isAR(sess.usuario.nivel)}
      titulo="Clientes / Titulares" subtitulo="Base de titulares de certificado">
      {erro && <div className="text-rose-600 text-sm bg-rose-50 border border-rose-100 rounded-lg px-3 py-2 mb-4">{erro}</div>}
      <GSTable titulo="Clientes" colunas={[
        { key: "nome", label: "Nome" },
        { key: "cpf_cnpj", label: "CPF/CNPJ", mono: true },
        { key: "tipo_pessoa", label: "Tipo" },
        { key: "email", label: "Email" },
      ]} linhas={rows} />
    </GSShell>
  );
}
