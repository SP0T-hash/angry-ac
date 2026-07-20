import { redirect } from "next/navigation";
import { getGSSession } from "@/lib/gs/session";
import { NIVEL_LABEL, isAR } from "@/lib/gs/types";
import { gsList } from "@/lib/gs/data";
import GSListClient from "@/components/gs/GSListClient";

export default async function GSClientesPage() {
  const sess = await getGSSession();
  if (!sess) redirect("/gs/login");

  let rows: any[] = []; let ars: any[] = []; let erro = "";
  try {
    rows = await gsList("gs_clientes", { colunas: "id,nome,cpf_cnpj,tipo_pessoa,email,ar_id", ordem: "nome" });
    ars = await gsList("gs_ars", { colunas: "id,nome" });
  } catch (e: any) { erro = e.message; }

  const arOptions = ars.map((a) => ({ value: a.id, label: a.nome }));

  return (
    <GSListClient
      usuario={sess.usuario}
      nivelLabel={NIVEL_LABEL[sess.usuario.nivel]}
      isAR={isAR(sess.usuario.nivel)}
      titulo="Clientes / Titulares"
      subtitulo="Base de titulares de certificado"
      tabela="gs_clientes"
      erro={erro}
      colunas={[
        { key: "nome", label: "Nome" },
        { key: "cpf_cnpj", label: "CPF/CNPJ", mono: true },
        { key: "tipo_pessoa", label: "Tipo" },
        { key: "email", label: "Email" },
      ]}
      linhas={rows}
      campos={[
        { name: "ar_id", label: "AR", type: "select", required: true, options: arOptions },
        { name: "nome", label: "Nome", required: true },
        { name: "cpf_cnpj", label: "CPF/CNPJ", required: true },
        { name: "tipo_pessoa", label: "Tipo", type: "select", defaultValue: "FISICA", options: [
          { value: "FISICA", label: "Física" }, { value: "JURIDICA", label: "Jurídica" },
        ] },
        { name: "email", label: "Email", type: "email", required: true },
        { name: "telefone", label: "Telefone" },
      ]}
    />
  );
}
