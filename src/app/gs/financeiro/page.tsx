import { redirect } from "next/navigation";
import { getGSSession } from "@/lib/gs/session";
import { NIVEL_LABEL, isAR } from "@/lib/gs/types";
import { gsList } from "@/lib/gs/data";
import GSShell from "@/components/gs/GSShell";
import GSTable from "@/components/gs/GSTable";

export default async function GSFinanceiroPage() {
  const sess = await getGSSession();
  if (!sess) redirect("/gs/login");

  let planos: any[] = []; let cobrancas: any[] = []; let erro = "";
  try {
    planos = await gsList("gs_planos", { colunas: "id,nome,publico_alvo,valor_mensal,taxa_por_cert,ativo", ordem: "nome" });
    cobrancas = await gsList("gs_cobrancas", { colunas: "id,numero,valor_total,status,repasse_gs,repasse_ar", ordem: "numero" });
  } catch (e: any) { erro = e.message; }

  return (
    <GSShell usuario={sess.usuario} nivelLabel={NIVEL_LABEL[sess.usuario.nivel]} isAR={isAR(sess.usuario.nivel)}
      titulo="Financeiro / Billing" subtitulo="Planos, assinaturas, cobranças e repasses">
      {erro && <div className="text-rose-600 text-sm bg-rose-50 border border-rose-100 rounded-lg px-3 py-2 mb-4">{erro}</div>}
      <div className="space-y-6">
        <GSTable titulo="Planos" colunas={[
          { key: "nome", label: "Nome" },
          { key: "publico_alvo", label: "Público" },
          { key: "valor_mensal", label: "Mensal" },
          { key: "taxa_por_cert", label: "Tx/Cert" },
          { key: "ativo", label: "Ativo" },
        ]} linhas={planos.map((p) => ({ ...p, valor_mensal: `R$ ${(p.valor_mensal ?? 0).toFixed(2)}`, taxa_por_cert: `R$ ${(p.taxa_por_cert ?? 0).toFixed(2)}`, ativo: p.ativo ? "Sim" : "Não" }))} />
        <GSTable titulo="Cobranças" colunas={[
          { key: "numero", label: "Número", mono: true },
          { key: "valor_total", label: "Total" },
          { key: "status", label: "Status" },
          { key: "repasse_gs", label: "Repasse GS" },
          { key: "repasse_ar", label: "Repasse AR" },
        ]} linhas={cobrancas.map((c) => ({ ...c, valor_total: `R$ ${(c.valor_total ?? 0).toFixed(2)}`, repasse_gs: `R$ ${(c.repasse_gs ?? 0).toFixed(2)}`, repasse_ar: `R$ ${(c.repasse_ar ?? 0).toFixed(2)}` }))} />
      </div>
    </GSShell>
  );
}
