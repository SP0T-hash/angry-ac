"use client";

import React, { useState } from "react";
import { QRCodeSVG } from "qrcode.react";
import { gsMutate } from "@/lib/gs/mutate-client";
import { Wallet, Users, FileText, Copy, Check } from "lucide-react";

interface Perfil { nome?: string; valor_custo_cert?: number; ar_id?: string }

type CobrancaStatus = "idle" | "criando" | "ok" | "erro";
type Cobranca = { numero: string; valor: number } | null;

function formatBRL(v: number): string {
  return v.toLocaleString("pt-BR", { style: "currency", currency: "BRL", minimumFractionDigits: 2 });
}

// Gera a cobrança PIX de custo para um pedido do contador e exibe o QR de referência.
function GerarCobranca({
  pedido, valorCusto, arId, contadorId, chavePix,
}: {
  pedido: Record<string, any>;
  valorCusto: number;
  arId?: string;
  contadorId: string;
  chavePix: string | null;
}) {
  const [status, setStatus] = useState("idle" as CobrancaStatus);
  const [mensagem, setMensagem] = useState("");
  const [cobranca, setCobranca] = useState(null as Cobranca);
  const [copiado, setCopiado] = useState(false);

  const gerar = async () => {
    setStatus("criando");
    const valor = Number(valorCusto) || 0;
    const numero = `CONT-${Date.now().toString(36).toUpperCase()}`;
    const periodo = new Date().toISOString().slice(0, 7);
    const vencimento = new Date(Date.now() + 5 * 86400000).toISOString().slice(0, 10);
    const res = await gsMutate("gs_cobrancas", {
      ar_id: arId,
      contador_id: contadorId,
      numero,
      descricao: `Custo de certificado - pedido ${pedido.id?.slice(0, 8) ?? ""}`,
      periodo_ref: periodo,
      data_vencimento: vencimento,
      valor_total: valor,
      status: "PENDENTE",
    });
    if (!res.ok) {
      setStatus("erro");
      setMensagem(res.error || "Falha ao gerar cobrança.");
      return;
    }
    setCobranca({ numero, valor });
    setStatus("ok");
  };

  const payload = cobranca && chavePix
    ? `PAGAMENTO VEMAPI | CHAVE:${chavePix} | VALOR:${formatBRL(cobranca.valor)} | REF:${cobranca.numero}`
    : "";

  const copiar = async () => {
    try { await navigator.clipboard.writeText(chavePix ?? ""); setCopiado(true); setTimeout(() => setCopiado(false), 1500); } catch {}
  };

  return (
    <div className="text-right">
      {status !== "ok" && (
        <button
          onClick={gerar}
          disabled={status === "criando"}
          className="px-3 py-1.5 rounded-lg bg-brand text-white text-xs font-bold hover:bg-brand transition disabled:opacity-50"
        >
          {status === "criando" ? "Gerando..." : "Gerar PIX de custo"}
        </button>
      )}
      {status === "erro" && <span className="text-rose-600 text-xs font-bold">{mensagem}</span>}

      {status === "ok" && cobranca && (
        <div className="mt-3 inline-block text-left bg-white border border-slate-200 rounded-xl p-4 shadow-sm">
          <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2">PIX — referência {cobranca.numero}</p>
          {chavePix ? (
            <div className="flex items-center gap-4">
              <QRCodeSVG value={payload} size={120} level="M" className="rounded-lg" />
              <div className="max-w-[200px]">
                <p className="text-sm font-black text-slate-900">{formatBRL(cobranca.valor)}</p>
                <p className="text-[11px] text-slate-500 mt-1 break-all">Chave: {chavePix}</p>
                <button onClick={copiar} className="mt-2 inline-flex items-center gap-1 text-[11px] font-bold text-brand hover:underline">
                  {copiado ? <Check size={12} /> : <Copy size={12} />} Copiar chave
                </button>
                <p className="text-[10px] text-slate-400 mt-2 leading-snug">Pague via PIX usando a chave acima. O QR é a referência desta cobrança.</p>
              </div>
            </div>
          ) : (
            <p className="text-xs text-amber-600 font-bold max-w-[220px]">
              Nenhuma chave PIX configurada. Cadastre uma forma PIX em Financeiro → Formas de pagamento.
            </p>
          )}
        </div>
      )}
    </div>
  );
}

export default function ContadorPortal({
  perfil, carteira, pedidos, chavePix, contadorId, erro,
}: {
  perfil: Perfil | null;
  carteira: Record<string, any>[];
  pedidos: Record<string, any>[];
  chavePix: string | null;
  contadorId: string;
  erro?: string;
}) {
  const valorCusto = Number(perfil?.valor_custo_cert) || 0;
  const now = new Date();

  return (
    <div className="space-y-6">
      {erro && <div role="alert" className="text-rose-600 text-sm bg-rose-50 border border-rose-100 rounded-lg px-3 py-2">{erro}</div>}

      {!perfil && (
        <div className="text-amber-700 text-sm bg-amber-50 border border-amber-100 rounded-lg px-3 py-2">
          Nenhum perfil de contador vinculado a este usuário. Solicite ao gestor da AR que crie seu perfil e defina o valor de custo.
        </div>
      )}

      {perfil && (
        <div className="flex items-center gap-4 bg-white border border-slate-100 rounded-2xl shadow-card p-5">
          <div className="w-11 h-11 rounded-xl bg-brand text-white flex items-center justify-center"><Wallet size={22} /></div>
          <div>
            <h3 className="text-slate-900 font-black text-lg tracking-tight">{perfil.nome || "Contador"}</h3>
            <p className="text-xs text-slate-400 font-bold uppercase tracking-widest mt-0.5">
              Custo por certificado: {valorCusto ? formatBRL(valorCusto) : "não definido"}
            </p>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <section className="bg-white border border-slate-100 rounded-2xl shadow-card p-5">
          <h4 className="flex items-center gap-2 text-sm font-black text-slate-900 uppercase tracking-wide mb-3">
            <Users size={16} className="text-brand" /> Carteira de clientes
          </h4>
          {carteira.length === 0 && <p className="text-sm text-slate-400">Sem clientes na carteira.</p>}
          <div className="divide-y divide-slate-100">
            {carteira.map((c) => {
              const expira = c.data_expiracao ? new Date(c.data_expiracao) : null;
              const dias = expira ? Math.ceil((expira.getTime() - now.getTime()) / 86400000) : null;
              const alerta = !expira ? "—" : dias != null && dias < 0 ? "Expirado" : dias != null && dias <= 30 ? "Vence em ≤30d" : dias != null && dias <= 60 ? "Vence em ≤60d" : "OK";
              return (
                <div key={c.id} className="py-2 flex items-center justify-between text-sm">
                  <span className="text-slate-700">Cliente {String(c.cliente_id).slice(0, 8)}</span>
                  <span className="text-slate-400">{c.status}</span>
                  <span className={`font-bold ${alerta === "OK" ? "text-emerald-600" : "text-amber-600"}`}>{alerta}</span>
                </div>
              );
            })}
          </div>
        </section>

        <section className="bg-white border border-slate-100 rounded-2xl shadow-card p-5">
          <h4 className="flex items-center gap-2 text-sm font-black text-slate-900 uppercase tracking-wide mb-3">
            <FileText size={16} className="text-brand" /> Pedidos dos meus clientes
          </h4>
          {pedidos.length === 0 && <p className="text-sm text-slate-400">Sem pedidos vinculados.</p>}
          <div className="space-y-3">
            {pedidos.map((p) => (
              <div key={p.id} className="border border-slate-100 rounded-xl p-3 flex items-center justify-between gap-3">
                <div className="min-w-0">
                  <p className="text-sm font-bold text-slate-800 truncate">{p.produto || p.tipo_certificado || "Certificado"}</p>
                  <p className="text-[11px] text-slate-400">{String(p.id).slice(0, 8)} · {p.status}</p>
                </div>
                <GerarCobranca pedido={p} valorCusto={valorCusto} arId={perfil?.ar_id} contadorId={contadorId} chavePix={chavePix} />
              </div>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}
