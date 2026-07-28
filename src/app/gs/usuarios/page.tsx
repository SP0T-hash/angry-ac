// Usuários GS — gestão de colaboradores (gs_usuarios)
import { redirect } from "next/navigation";
import { getGSSession } from "@/lib/gs/session";
import { NIVEL_LABEL, isAR } from "@/lib/gs/types";
import { gsList } from "@/lib/gs/data";
import GSListClient from "@/components/gs/GSListClient";

export default async function GSUsuariosPage() {
  const sess = await getGSSession();
  if (!sess) redirect("/gs/login");

  let rows: any[] = [];
  let erro = "";
  try {
    rows = await gsList("gs_usuarios", { usuario: sess.usuario, ordem: "created_at" });
  } catch (e: any) { erro = e.message; }

  return (
    <GSListClient
      usuario={sess.usuario}
      nivelLabel={NIVEL_LABEL[sess.usuario.nivel]}
      isAR={isAR(sess.usuario.nivel)}
      titulo="Usuários"
      subtitulo="Gestão de colaboradores do sistema"
      tabela="gs_usuarios"
      erro={erro}
      colunas={[
        { key: "nome", label: "Nome" },
        { key: "email", label: "E-mail", mono: true },
        { key: "nivel", label: "Nível" },
        { key: "is_active", label: "Ativo" },
      ]}
      linhas={rows.map((u) => ({
        ...u,
        is_active: u.is_active ? "Sim" : "Não",
      }))}
      campos={[
        { name: "nome", label: "Nome Completo", required: true },
        { name: "email", label: "E-mail", type: "email", required: true },
        { name: "cpf", label: "CPF" },
        { name: "telefone", label: "Telefone" },
        { name: "nivel", label: "Nível de Acesso", type: "select", required: true, options: [
          { value: "AC_ADMIN", label: "AC Admin" },
          { value: "AC_SUPORTE", label: "AC Suporte" },
          { value: "AR_ADMIN", label: "AR Admin" },
          { value: "AR_FINANCEIRO", label: "AR Financeiro" },
          { value: "AR_SUPORTE", label: "AR Suporte" },
          { value: "UNIDADE_ADMIN", label: "Unidade Admin" },
          { value: "UNIDADE_AGR", label: "Unidade AGR" },
          { value: "UNIDADE_VENDAS", label: "Unidade Vendas" },
          { value: "CONTADOR", label: "Contador" },
        ]},
        { name: "is_active", label: "Ativo", type: "select", defaultValue: true, options: [
          { value: true, label: "Sim" },
          { value: false, label: "Não" },
        ]},
      ]}
    />
  );
}
