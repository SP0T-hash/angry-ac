import { redirect } from "next/navigation";
import { getGSSession } from "@/lib/gs/session";
import { NIVEL_LABEL, isAdmin, isAR } from "@/lib/gs/types";
import { gsKpis } from "@/lib/gs/data";
import GSDashboardClient from "./GSDashboardClient";

export default async function GSDashboardPage() {
  const sess = await getGSSession();
  if (!sess) redirect("/gs/login");

  let kpis = { ars: 0, unidades: 0, pedidos: 0, receitaMes: 0 };
  let erro = "";
  try {
    kpis = await gsKpis(sess.usuario);
  } catch (e: any) {
    erro = e.message || "Falha ao carregar indicadores.";
  }

  return (
    <GSDashboardClient
      usuario={sess.usuario}
      nivelLabel={NIVEL_LABEL[sess.usuario.nivel]}
      isAdmin={isAdmin(sess.usuario.nivel)}
      isAR={isAR(sess.usuario.nivel)}
      kpis={kpis}
      erro={erro}
    />
  );
}
