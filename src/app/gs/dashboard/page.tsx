import { redirect } from "next/navigation";
import { getGSSession } from "@/lib/gs/session";
import { NIVEL_LABEL, isAdmin, isAR } from "@/lib/gs/types";
import GSDashboardClient from "./GSDashboardClient";

export default async function GSDashboardPage() {
  const sess = await getGSSession();
  if (!sess) redirect("/gs/login");

  return (
    <GSDashboardClient
      usuario={sess.usuario}
      nivelLabel={NIVEL_LABEL[sess.usuario.nivel]}
      isAdmin={isAdmin(sess.usuario.nivel)}
      isAR={isAR(sess.usuario.nivel)}
    />
  );
}
