import { redirect } from "next/navigation";
import { getGSSession } from "@/lib/gs/session";

export async function requireGSSession() {
  const sess = await getGSSession();
  if (!sess) redirect("/gs/login");
  return sess;
}
