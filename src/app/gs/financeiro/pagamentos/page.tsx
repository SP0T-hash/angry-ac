import { redirect } from "next/navigation";
import { getGSSession } from "@/lib/gs/session";
import { NIVEL_LABEL, isAR } from "@/lib/gs/types";
import { gsList } from "@/lib/gs/data";
import GSLayout from "@/components/gs/GSLayout";
import GSListClient from "@/components/gs/GSListClient";
import GsapReveal from "@/components/gs/GsapReveal";

export default async function GSPagamentosPage() {
  const sess = await getGSSession();
  if (!sess) redirect("/gs/login");

  let formas: any[] = [];
  let erro = "";
  try {
    formas = await gsList("gs_formas_pagamento", {
      colunas: "id,tipo,descricao,ativo,ordem,ar_id",
      ordem: "ordem",
    });
  } catch (e: any) { erro = e.message; }

  return (
    <GSLayout
      usuario={sess.usuario}
      nivelLabel={NIVEL_LABEL[sess.usuario.nivel]}
      isAR={isAR(sess.usuario.nivel)}
      titulo="Formas de pagamento"
      subtitulo="Métodos aceitos (PIX, cartão, boleto) por AR ou globais. Integração com gateway exige credencial."
    >
      <GsapReveal className="space-y-6">
        {erro && (
          <div role="alert" className="text-rose-600 text-sm bg-rose-50 border border-rose-100 rounded-lg px-3 py-2">{erro}</div>
        )}
        <GSListClient
          usuario={sess.usuario}
          nivelLabel={NIVEL_LABEL[sess.usuario.nivel]}
          isAR={isAR(sess.usuario.nivel)}
          titulo="Formas de pagamento"
          subtitulo="Configure PIX, cartão e boleto disponíveis para cada AR (ou globais)."
          tabela="gs_formas_pagamento"
          erro={erro}
          colunas={[
            { key: "tipo", label: "Tipo" },
            { key: "descricao", label: "Descrição" },
            { key: "escopo", label: "Escopo" },
            { key: "ativo", label: "Ativo" },
          ]}
          linhas={formas.map((f) => ({
            ...f,
            escopo: f.ar_id ? "AR" : "Global",
            ativo: f.ativo ? "Sim" : "Não",
          }))}
          campos={[
            {
              name: "tipo", label: "Tipo", required: true, type: "select",
              options: [
                { value: "PIX", label: "PIX" },
                { value: "CARTAO", label: "Cartão de crédito" },
                { value: "BOLETO", label: "Boleto" },
              ],
            },
            { name: "descricao", label: "Descrição" },
            {
              name: "ativo", label: "Ativo", type: "select", defaultValue: true,
              options: [{ value: true, label: "Sim" }, { value: false, label: "Não" }],
            },
          ]}
        />
      </GsapReveal>
    </GSLayout>
  );
}
