import { redirect } from "next/navigation";
import { getGSSession } from "@/lib/gs/session";
import { NIVEL_LABEL, isAR } from "@/lib/gs/types";
import { gsList } from "@/lib/gs/data";
import { defaultBranding } from "@/lib/gs/tenantBranding";
import GSListClient from "@/components/gs/GSListClient";
import ArsBrandingPanel from "@/components/gs/ArsBrandingPanel";

export default async function GSArsPage() {
  const sess = await getGSSession();
  if (!sess) redirect("/gs/login");

  let ars: any[] = [];
  let erro = "";
  try {
    ars = await gsList("gs_ars", { colunas: "id,nome,slug,cnpj,email,is_active,logo_url,branding,created_at", ordem: "created_at" });
  } catch (e: any) { erro = e.message; }

  return (
    <>
    <GSListClient
      usuario={sess.usuario}
      nivelLabel={NIVEL_LABEL[sess.usuario.nivel]}
      isAR={isAR(sess.usuario.nivel)}
      titulo="Autoridades de Registro (ARs)"
      subtitulo="Gestão multi-tenant de ARs parceiras"
      tabela="gs_ars"
      erro={erro}
      colunas={[
        { key: "nome", label: "Nome" },
        { key: "cnpj", label: "CNPJ", mono: true },
        { key: "email", label: "Email" },
        { key: "ativo", label: "Ativo" },
        { key: "criado_em", label: "Criado em" },
        { key: "marca", label: "Marca" },
      ]}
      linhas={ars.map((a) => {
        const branding = (a.branding ?? {}) as { primary?: string };
        const primary = branding.primary || defaultBranding().primary;
        return {
          ...a,
          ativo: a.is_active ? "Sim" : "Não",
          criado_em: new Date(a.created_at).toLocaleDateString("pt-BR"),
          marca: a.logo_url ? `● logo · ${primary}` : `● ${primary}`,
        };
      })}
      campos={[
        { name: "nome", label: "Nome", required: true },
        { name: "cnpj", label: "CNPJ", required: true },
        { name: "email", label: "Email", type: "email" },
        { name: "telefone", label: "Telefone" },
        { name: "is_active", label: "Ativo", type: "select", defaultValue: true, options: [{ value: true, label: "Sim" }, { value: false, label: "Não" }] },
      ]}
    />
    <ArsBrandingPanel ars={ars} />
    </>
  );
}
