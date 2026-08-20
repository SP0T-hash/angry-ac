import { redirect } from "next/navigation";
import { getGSSession } from "@/lib/gs/session";
import { NIVEL_LABEL, isAR } from "@/lib/gs/types";
import { gsList } from "@/lib/gs/data";
import GSLayout from "@/components/gs/GSLayout";
import ContadorPortal from "@/components/gs/ContadorPortal";

// Portal do contador: vê a carteira e os pedidos dos seus clientes (escopo por
// contador_id) e gera o PIX de custo (valor_custo_cert) para pagar à VEMAPI/AR.
export default async function GSContadorPage() {
  const sess = await getGSSession();
  if (!sess) redirect("/gs/login");
  const isContador = sess.usuario.nivel === "CONTADOR";

  let perfil: any = null;
  let carteira: any[] = [];
  let pedidos: any[] = [];
  let chavePix: string | null = null;
  let erro = "";

  try {
    const perfis = (await gsList("gs_contadores", {
      colunas: "id,nome,valor_custo_cert,ar_id,usuario_id",
    })) as any[];
    perfil = perfis.find((p) => p.usuario_id === sess.usuario.id) ?? null;

    carteira = (await gsList("gs_contador_carteira", {
      usuario: sess.usuario,
      ordem: "data_expiracao",
    })) as any[];
    carteira = carteira.filter((c) => c.contador_id === sess.usuario.id);

    const todos = (await gsList("gs_pedidos", {
      usuario: sess.usuario,
      colunas: "id,cliente_id,contador_id,produto,tipo_certificado,status,valor_total,created_at",
      ordem: "created_at",
    })) as any[];
    pedidos = todos.filter((p) => p.contador_id === sess.usuario.id);

    if (perfil?.ar_id) {
      const formas = (await gsList("gs_formas_pagamento", {
        colunas: "ar_id,tipo,config",
      })) as any[];
      const pix = formas.find((f) => f.tipo === "PIX" && (f.ar_id === perfil.ar_id || f.ar_id == null));
      chavePix = pix?.config?.chave_pix ?? null;
    }
  } catch (e: any) {
    erro = e.message;
  }

  return (
    <GSLayout
      usuario={sess.usuario}
      nivelLabel={NIVEL_LABEL[sess.usuario.nivel]}
      isAR={isAR(sess.usuario.nivel)}
      isContador={isContador}
      titulo="Portal do Contador"
      subtitulo="Carteira de clientes, pedidos e cobrança PIX de custo"
    >
      <ContadorPortal
        perfil={perfil}
        carteira={carteira}
        pedidos={pedidos}
        chavePix={chavePix}
        contadorId={sess.usuario.id}
        erro={erro}
      />
    </GSLayout>
  );
}
