// Contadores — gestão de contadores e carteira de clientes (gs_contador_carteira)
import { redirect } from "next/navigation";
import { getGSSession } from "@/lib/gs/session";
import { NIVEL_LABEL, isAR } from "@/lib/gs/types";
import { gsList } from "@/lib/gs/data";
import GSListClient from "@/components/gs/GSListClient";

export default async function GSContadoresPage() {
  const sess = await getGSSession();
  if (!sess) redirect("/gs/login");
  const isContador = sess.usuario.nivel === "CONTADOR";

  let rows: any[] = [];
  let erro = "";
  try {
    rows = await gsList("gs_contador_carteira", { usuario: sess.usuario, ordem: "data_expiracao" });
    // Contador só enxerga a própria carteira (isolamento de tenant).
    if (isContador) rows = rows.filter((r: any) => r.contador_id === sess.usuario.id);
  } catch (e: any) { erro = e.message; }

  // Alerta de renovação: destaca certificados próximos do vencimento
  const now = new Date();
  const alerta30d = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
  const alerta60d = new Date(now.getTime() + 60 * 24 * 60 * 60 * 1000);

  return (
    <GSListClient
      usuario={sess.usuario}
      nivelLabel={NIVEL_LABEL[sess.usuario.nivel]}
      isAR={isAR(sess.usuario.nivel)}
      titulo="Contadores"
      subtitulo="Carteira de clientes e alertas de renovação de certificados"
      tabela="gs_contador_carteira"
      erro={erro}
      colunas={[
        { key: "status", label: "Status Cert." },
        { key: "data_expiracao", label: "Expira em" },
        { key: "lembrete_alert", label: "Alerta" },
        { key: "cliente_id", label: "Cliente" },
        { key: "pedido_id", label: "Pedido" },
      ]}
      linhas={rows.map((c) => {
        const expira = new Date(c.data_expiracao);
        const diasRestantes = Math.ceil((expira.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
        let alerta = "OK";
        if (expira < now) alerta = "⚠️ EXPIRADO";
        else if (expira < alerta30d) alerta = "🔴 ≤30d";
        else if (expira < alerta60d) alerta = "🟡 ≤60d";
        return {
          ...c,
          data_expiracao: c.data_expiracao ? new Date(c.data_expiracao).toLocaleDateString("pt-BR") : "—",
          lembrete_alert: alerta,
        };
      })}
      campos={[
        { name: "contador_id", label: "Contador ID", required: true },
        { name: "cliente_id", label: "Cliente ID", required: true },
        { name: "pedido_id", label: "Pedido ID" },
        { name: "status", label: "Status do Certificado", type: "select", options: [
          { value: "ATIVO", label: "Ativo" },
          { value: "EXPIRADO", label: "Expirado" },
          { value: "RENOVACAO_PENDENTE", label: "Renovação Pendente" },
        ]},
        { name: "data_expiracao", label: "Data Expiração", type: "date", required: true },
        { name: "lembrete_60d", label: "Lembrete 60d", type: "select", options: [
          { value: false, label: "Não enviado" },
          { value: true, label: "Enviado" },
        ]},
        { name: "lembrete_30d", label: "Lembrete 30d", type: "select", options: [
          { value: false, label: "Não enviado" },
          { value: true, label: "Enviado" },
        ]},
        { name: "lembrete_15d", label: "Lembrete 15d", type: "select", options: [
          { value: false, label: "Não enviado" },
          { value: true, label: "Enviado" },
        ]},
      ]}
    />
  );
}
