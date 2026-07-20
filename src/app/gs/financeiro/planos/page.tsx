import { redirect } from "next/navigation";
import { getGSSession } from "@/lib/gs/session";
import { NIVEL_LABEL, isAR } from "@/lib/gs/types";
import { gsList } from "@/lib/gs/data";
import GSListClient from "@/components/gs/GSListClient";

export default async function GSPlanosPage() {
  const sess = await getGSSession();
  if (!sess) redirect("/gs/login");

  let planos: any[] = []; let erro = "";
  try {
    planos = await gsList("gs_planos", { colunas: "id,nome,publico_alvo,valor_mensal,taxa_por_cert,ativo", ordem: "nome" });
  } catch (e: any) { erro = e.message; }

  return (
    <GSListClient
      usuario={sess.usuario}
      nivelLabel={NIVEL_LABEL[sess.usuario.nivel]}
      isAR={isAR(sess.usuario.nivel)}
      titulo="Planos"
      subtitulo="Planos de assinatura AR/AC/Contador"
      tabela="gs_planos"
      erro={erro}
      colunas={[
        { key: "nome", label: "Nome" },
        { key: "publico_alvo", label: "Público" },
        { key: "valor_mensal", label: "Mensal" },
        { key: "taxa_por_cert", label: "Tx/Cert" },
        { key: "ativo", label: "Ativo" },
      ]}
      linhas={planos.map((p) => ({ ...p, valor_mensal: `R$ ${(p.valor_mensal ?? 0).toFixed(2)}`, taxa_por_cert: `R$ ${(p.taxa_por_cert ?? 0).toFixed(2)}`, ativo: p.ativo ? "Sim" : "Não" }))}
      campos={[
        { name: "nome", label: "Nome", required: true },
        { name: "slug", label: "Slug" },
        { name: "publico_alvo", label: "Público-alvo" },
        { name: "nivel", label: "Nível" },
        { name: "valor_mensal", label: "Valor Mensal", type: "number" },
        { name: "taxa_por_cert", label: "Taxa por Certificado", type: "number" },
        { name: "ativo", label: "Ativo", type: "select", defaultValue: true, options: [{ value: true, label: "Sim" }, { value: false, label: "Não" }] },
      ]}
    />
  );
}
