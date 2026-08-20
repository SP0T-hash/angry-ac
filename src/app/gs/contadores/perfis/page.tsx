import { redirect } from "next/navigation";
import { getGSSession } from "@/lib/gs/session";
import { NIVEL_LABEL, isAR } from "@/lib/gs/types";
import { gsList } from "@/lib/gs/data";
import GSLayout from "@/components/gs/GSLayout";
import GSListClient from "@/components/gs/GSListClient";

// AR admin cadastra os contadores e define o valor de custo por certificado
// que cada contabilidade paga à VEMAPI/AR.
export default async function GSContadorPerfisPage() {
  const sess = await getGSSession();
  if (!sess) redirect("/gs/login");

  let perfis: any[] = [];
  let erro = "";
  try {
    perfis = await gsList("gs_contadores", { colunas: "id,nome,email,telefone,valor_custo_cert,ativo,usuario_id", ordem: "nome" });
  } catch (e: any) { erro = e.message; }

  return (
    <GSLayout
      usuario={sess.usuario}
      nivelLabel={NIVEL_LABEL[sess.usuario.nivel]}
      isAR={isAR(sess.usuario.nivel)}
      titulo="Contadores"
      subtitulo="Perfis de contabilidades e valor de custo por certificado"
    >
      {erro && (
        <div role="alert" className="text-rose-600 text-sm bg-rose-50 border border-rose-100 rounded-lg px-3 py-2 mb-4">{erro}</div>
      )}
      <GSListClient
        usuario={sess.usuario}
        nivelLabel={NIVEL_LABEL[sess.usuario.nivel]}
        isAR={isAR(sess.usuario.nivel)}
        titulo="Contadores"
        subtitulo="Cada contador paga o valor de custo definido aqui. Eles geram o PIX pelo portal."
        tabela="gs_contadores"
        erro={erro}
        colunas={[
          { key: "nome", label: "Nome" },
          { key: "email", label: "Email" },
          { key: "telefone", label: "Telefone" },
          { key: "valor_custo_cert", label: "Custo/cert." },
          { key: "ativo", label: "Ativo" },
        ]}
        linhas={perfis.map((p) => ({
          ...p,
          valor_custo_cert: p.valor_custo_cert != null ? `R$ ${Number(p.valor_custo_cert).toFixed(2)}` : "—",
          ativo: p.ativo ? "Sim" : "Não",
        }))}
        campos={[
          { name: "nome", label: "Nome", required: true },
          { name: "email", label: "Email", type: "email" },
          { name: "telefone", label: "Telefone" },
          { name: "usuario_id", label: "ID do usuário (CONTADOR)", required: true },
          { name: "valor_custo_cert", label: "Valor de custo por certificado (R$)", type: "number" },
          { name: "ativo", label: "Ativo", type: "select", defaultValue: true, options: [{ value: true, label: "Sim" }, { value: false, label: "Não" }] },
        ]}
      />
    </GSLayout>
  );
}
