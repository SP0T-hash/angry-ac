import { redirect } from "next/navigation";
import { getGSSession } from "@/lib/gs/session";
import { NIVEL_LABEL, isAR } from "@/lib/gs/types";
import { gsList } from "@/lib/gs/data";
import GSListClient from "@/components/gs/GSListClient";

export default async function GSTicketsPage() {
  const sess = await getGSSession();
  if (!sess) redirect("/gs/login");

  let rows: any[] = []; let erro = "";
  try {
    rows = await gsList("gs_tickets", { colunas: "id,titulo,categoria,prioridade,status,criado_em", ordem: "criado_em" });
  } catch (e: any) { erro = e.message; }

  return (
    <GSListClient
      usuario={sess.usuario}
      nivelLabel={NIVEL_LABEL[sess.usuario.nivel]}
      isAR={isAR(sess.usuario.nivel)}
      titulo="Suporte / Tickets"
      subtitulo="Chamados de suporte GS"
      tabela="gs_tickets"
      erro={erro}
      colunas={[
        { key: "titulo", label: "Título" },
        { key: "categoria", label: "Categoria" },
        { key: "prioridade", label: "Prioridade" },
        { key: "status", label: "Status" },
        { key: "criado_em", label: "Aberto em" },
      ]}
      linhas={rows.map((r) => ({ ...r, criado_em: new Date(r.criado_em).toLocaleDateString("pt-BR") }))}
      campos={[
        { name: "titulo", label: "Título", required: true },
        { name: "categoria", label: "Categoria", type: "select", defaultValue: "DUVIDA", options: [
          { value: "DUVIDA", label: "Dúvida" }, { value: "PROBLEMA", label: "Problema" },
          { value: "FATURAMENTO", label: "Faturamento" }, { value: "TECNICO", label: "Técnico" },
        ] },
        { name: "prioridade", label: "Prioridade", type: "select", defaultValue: "BAIXA", options: [
          { value: "BAIXA", label: "Baixa" }, { value: "MEDIA", label: "Média" },
          { value: "ALTA", label: "Alta" }, { value: "URGENTE", label: "Urgente" },
        ] },
        { name: "status", label: "Status", type: "select", defaultValue: "ABERTO", options: [
          { value: "ABERTO", label: "Aberto" }, { value: "EM_ANALISE", label: "Em análise" },
          { value: "AGUARDANDO_CLIENTE", label: "Aguardando cliente" }, { value: "RESOLVIDO", label: "Resolvido" },
          { value: "FECHADO", label: "Fechado" },
        ] },
        { name: "descricao", label: "Descrição", type: "textarea" },
      ]}
    />
  );
}
