import { redirect } from "next/navigation";
import { getGSSession } from "@/lib/gs/session";
import { NIVEL_LABEL, isAR } from "@/lib/gs/types";
import { gsList } from "@/lib/gs/data";
import GSListClient from "@/components/gs/GSListClient";

export default async function GSAssinaturasPage() {
  const sess = await getGSSession();
  if (!sess) redirect("/gs/login");

  let assinaturas: any[] = []; let ars: any[] = []; let planos: any[] = []; let erro = "";
  try {
    [assinaturas, ars, planos] = await Promise.all([
      gsList("gs_assinaturas", { colunas: "id,ar_id,plano_id,entidade_tipo,status,ciclo_tipo,split_percent_gs,split_percent_ar,asaas_subscription_id", ordem: "created_at" }),
      gsList("gs_ars", { colunas: "id,nome" }),
      gsList("gs_planos", { colunas: "id,nome" }),
    ]);
  } catch (e: any) { erro = e.message; }

  const arOptions = ars.map((a) => ({ value: a.id, label: a.nome }));
  const planoOptions = planos.map((p) => ({ value: p.id, label: p.nome }));

  return (
    <GSListClient
      usuario={sess.usuario}
      nivelLabel={NIVEL_LABEL[sess.usuario.nivel]}
      isAR={isAR(sess.usuario.nivel)}
      titulo="Assinaturas"
      subtitulo="Assinaturas AR/AC/Contador com split de receita"
      tabela="gs_assinaturas"
      erro={erro}
      colunas={[
        { key: "entidade_tipo", label: "Tipo" },
        { key: "ar_nome", label: "AR" },
        { key: "plano_nome", label: "Plano" },
        { key: "status", label: "Status" },
        { key: "ciclo_tipo", label: "Ciclo" },
        { key: "split", label: "Split GS/AR" },
        { key: "asaas", label: "Asaas" },
      ]}
      linhas={assinaturas.map((a) => ({
        ...a,
        ar_nome: ars.find((x) => x.id === a.ar_id)?.nome ?? "-",
        plano_nome: planos.find((x) => x.id === a.plano_id)?.nome ?? "-",
        split: `${a.split_percent_gs ?? 70}/${a.split_percent_ar ?? 30}`,
        asaas: a.asaas_subscription_id ? "Integrado" : "Local",
      }))}
      campos={[
        { name: "entidade_tipo", label: "Tipo", type: "select", required: true, defaultValue: "AR", options: [
          { value: "AR", label: "AR" }, { value: "AC", label: "AC" }, { value: "CONTADOR", label: "Contador" },
        ] },
        { name: "ar_id", label: "AR", type: "select", options: arOptions },
        { name: "plano_id", label: "Plano", type: "select", required: true, options: planoOptions },
        { name: "status", label: "Status", type: "select", defaultValue: "ATIVA", options: [
          { value: "ATIVA", label: "Ativa" }, { value: "TRIAL", label: "Trial" },
          { value: "BLOQUEADA", label: "Bloqueada" }, { value: "CANCELADA", label: "Cancelada" },
          { value: "EXPIRADA", label: "Expirada" },
        ] },
        { name: "ciclo_tipo", label: "Ciclo", type: "select", defaultValue: "MENSAL", options: [
          { value: "MENSAL", label: "Mensal" }, { value: "TRIMESTRAL", label: "Trimestral" }, { value: "ANUAL", label: "Anual" },
        ] },
        { name: "split_percent_gs", label: "Split GS (%)", type: "number", defaultValue: 70 },
        { name: "split_percent_ar", label: "Split AR (%)", type: "number", defaultValue: 30 },
        { name: "asaas_subscription_id", label: "Asaas Sub ID (opcional)" },
      ]}
    />
  );
}
