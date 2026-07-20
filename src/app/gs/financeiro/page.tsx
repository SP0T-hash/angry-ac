import { redirect } from "next/navigation";
import { getGSSession } from "@/lib/gs/session";
import { NIVEL_LABEL, isAR } from "@/lib/gs/types";
import { gsList } from "@/lib/gs/data";
import GSLayout from "@/components/gs/GSLayout";
import { Wallet, FileText, CreditCard } from "lucide-react";

export default async function GSFinanceiroPage() {
  const sess = await getGSSession();
  if (!sess) redirect("/gs/login");

  let planos: any[] = []; let cobrancas: any[] = []; let assinaturas: any[] = [];
  let erro = "";
  try {
    [planos, cobrancas, assinaturas] = await Promise.all([
      gsList("gs_planos", { colunas: "id,nome", ordem: "nome" }),
      gsList("gs_cobrancas", { colunas: "id,status", ordem: "numero" }),
      gsList("gs_assinaturas", { colunas: "id,status", ordem: "created_at" }),
    ]);
  } catch (e: any) { erro = e.message; }

  const cards = [
    { titulo: "Planos", subtitulo: "Assinatura AR/AC/Contador", href: "/gs/financeiro/planos", icon: Wallet, count: planos.length },
    { titulo: "Cobranças", subtitulo: "Faturas e pagamentos", href: "/gs/financeiro/cobrancas", icon: FileText, count: cobrancas.length },
    { titulo: "Assinaturas", subtitulo: "Split de receita GS/AR", href: "/gs/financeiro/assinaturas", icon: CreditCard, count: assinaturas.length },
  ];

  return (
    <GSLayout
      usuario={sess.usuario}
      nivelLabel={NIVEL_LABEL[sess.usuario.nivel]}
      isAR={isAR(sess.usuario.nivel)}
      titulo="Financeiro"
      subtitulo="Gestão financeira do GS (planos, cobranças e assinaturas)"
    >
      {erro && (
        <div role="alert" className="text-rose-600 text-sm bg-rose-50 border border-rose-100 rounded-lg px-3 py-2 mb-4">{erro}</div>
      )}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {cards.map((c) => (
          <a
            key={c.href}
            href={c.href}
            className="bg-white border border-slate-100 rounded-2xl shadow-card p-6 hover:border-emerald-200 hover:bg-emerald-50/30 transition flex flex-col gap-4"
          >
            <div className="w-11 h-11 rounded-xl bg-emerald-600 text-white flex items-center justify-center">
              <c.icon size={22} />
            </div>
            <div>
              <h3 className="text-slate-900 font-black text-lg tracking-tight">{c.titulo}</h3>
              <p className="text-xs text-slate-400 font-bold uppercase tracking-widest mt-0.5">{c.subtitulo}</p>
            </div>
            <span className="text-3xl font-black text-emerald-600">{c.count}</span>
          </a>
        ))}
      </div>
    </GSLayout>
  );
}
