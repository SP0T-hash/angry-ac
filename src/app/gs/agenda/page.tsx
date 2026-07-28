// Agenda — agendamentos de atendimento (gs_agenda)
import { redirect } from "next/navigation";
import { getGSSession } from "@/lib/gs/session";
import { NIVEL_LABEL, isAR } from "@/lib/gs/types";
import { gsList } from "@/lib/gs/data";
import GSListClient from "@/components/gs/GSListClient";

export default async function GSAgendaPage() {
  const sess = await getGSSession();
  if (!sess) redirect("/gs/login");

  let rows: any[] = [];
  let erro = "";
  try {
    rows = await gsList("gs_agenda", { usuario: sess.usuario, ordem: "created_at" });
  } catch (e: any) { erro = e.message; }

  return (
    <GSListClient
      usuario={sess.usuario}
      nivelLabel={NIVEL_LABEL[sess.usuario.nivel]}
      isAR={isAR(sess.usuario.nivel)}
      titulo="Agenda"
      subtitulo="Agendamentos de atendimento"
      tabela="gs_agenda"
      erro={erro}
      colunas={[
        { key: "cliente_nome", label: "Cliente" },
        { key: "data", label: "Data" },
        { key: "hora_inicio", label: "Início" },
        { key: "status", label: "Status" },
        { key: "agente_nome", label: "Agente" },
      ]}
      linhas={rows}
      campos={[
        { name: "cliente_nome", label: "Nome do Cliente", required: true },
        { name: "cliente_telefone", label: "Telefone" },
        { name: "cliente_email", label: "E-mail" },
        { name: "data", label: "Data", type: "date", required: true },
        { name: "hora_inicio", label: "Hora Início", required: true },
        { name: "hora_fim", label: "Hora Fim" },
        { name: "tipo_servico", label: "Tipo de Serviço", type: "select", options: [
          { value: "EMISSAO", label: "Emissão" },
          { value: "RENOVACAO", label: "Renovação" },
          { value: "REVOGACAO", label: "Revogação" },
          { value: "SUPORTE", label: "Suporte" },
          { value: "OUTRO", label: "Outro" },
        ]},
        { name: "status", label: "Status", type: "select", options: [
          { value: "AGENDADO", label: "Agendado" },
          { value: "CONFIRMADO", label: "Confirmado" },
          { value: "REALIZADO", label: "Realizado" },
          { value: "CANCELADO", label: "Cancelado" },
          { value: "NAO_COMPARECEU", label: "Não Compareceu" },
        ]},
        { name: "agente_nome", label: "Agente Responsável" },
        { name: "observacoes", label: "Observações", type: "textarea" },
      ]}
    />
  );
}
