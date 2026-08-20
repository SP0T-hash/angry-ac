"use client";

import React, { useState } from "react";
import { X, Save, Eye } from "lucide-react";
import { gsMutate } from "@/lib/gs/mutate-client";
import type { ArBranding } from "@/lib/gs/tenantBranding";

// Editor de marca (white-label) de uma AR. Salva slug, logo_url e o JSONB
// `branding` (cores + environmentLabel) na tabela gs_ars.
export default function ArBrandingEditor({
  ar,
  onClose,
  onSaved,
}: {
  ar: Record<string, any>;
  onClose: () => void;
  onSaved: () => void;
}) {
  const b: Partial<ArBranding> = ar.branding ?? {};
  const [nome, setNome] = useState(ar.nome ?? "");
  const [slug, setSlug] = useState(ar.slug ?? "");
  const [logoUrl, setLogoUrl] = useState(ar.logo_url ?? "");
  const [primary, setPrimary] = useState(b.primary ?? "#10b981");
  const [verification, setVerification] = useState(b.verification ?? "#8ce2ba");
  const [background, setBackground] = useState(b.background ?? "#f7f8fa");
  const [ink, setInk] = useState(b.ink ?? "#14202b");
  const [environmentLabel, setEnvironmentLabel] = useState(
    b.environmentLabel ?? "Ambiente de homologação",
  );
  const [saving, setSaving] = useState(false);
  const [erro, setErro] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setErro("");
    const data: Record<string, any> = {
      nome,
      slug: slug || undefined,
      logo_url: logoUrl || undefined,
      branding: { primary, verification, background, ink, environmentLabel },
    };
    const res = await gsMutate("gs_ars", data, ar.id);
    if (!res.ok) {
      setErro(res.error || "Erro ao salvar.");
      setSaving(false);
      return;
    }
    setSaving(false);
    onSaved();
    onClose();
  };

  const Field = ({
    label, value, onChange, type = "text",
  }: { label: string; value: string; onChange: (v: string) => void; type?: string }) => (
    <div>
      <label className="text-xs font-bold text-slate-500 uppercase tracking-wide">{label}</label>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="mt-1.5 w-full py-2.5 px-3 rounded-xl border border-slate-200 outline-none focus:ring-2 focus:ring-emerald-500/40 focus:border-emerald-400 text-sm text-slate-800 bg-white"
      />
    </div>
  );

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 sticky top-0 bg-white">
          <h3 className="text-base font-black text-slate-900">Marca — {ar.nome}</h3>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-700 p-1 hover:bg-slate-100 rounded-lg">
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <Field label="Nome de exibição" value={nome} onChange={setNome} />
          <Field label="Slug público (white-label: /?ar=slug)" value={slug} onChange={setSlug} />
          <Field label="URL do logo" value={logoUrl} onChange={setLogoUrl} />

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-bold text-slate-500 uppercase tracking-wide">Primária</label>
              <input type="color" value={primary} onChange={(e) => setPrimary(e.target.value)}
                className="mt-1.5 w-full h-10 rounded-xl border border-slate-200 bg-white" />
            </div>
            <div>
              <label className="text-xs font-bold text-slate-500 uppercase tracking-wide">Verificação</label>
              <input type="color" value={verification} onChange={(e) => setVerification(e.target.value)}
                className="mt-1.5 w-full h-10 rounded-xl border border-slate-200 bg-white" />
            </div>
            <div>
              <label className="text-xs font-bold text-slate-500 uppercase tracking-wide">Fundo</label>
              <input type="color" value={background} onChange={(e) => setBackground(e.target.value)}
                className="mt-1.5 w-full h-10 rounded-xl border border-slate-200 bg-white" />
            </div>
            <div>
              <label className="text-xs font-bold text-slate-500 uppercase tracking-wide">Texto (ink)</label>
              <input type="color" value={ink} onChange={(e) => setInk(e.target.value)}
                className="mt-1.5 w-full h-10 rounded-xl border border-slate-200 bg-white" />
            </div>
          </div>

          <Field label="Rótulo de ambiente (ex.: Ambiente de homologação)" value={environmentLabel} onChange={setEnvironmentLabel} />

          <div className="flex items-center gap-3 p-3 rounded-xl border border-slate-100 bg-slate-50">
            <Eye size={16} className="text-slate-400" />
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg" style={{ background: primary }} />
              <div className="w-8 h-8 rounded-lg" style={{ background: verification }} />
              <span className="text-xs text-slate-500">Pré-visualização</span>
            </div>
          </div>

          {erro && <div className="text-sm text-rose-600 bg-rose-50 border border-rose-100 rounded-lg px-3 py-2">{erro}</div>}

          <div className="flex items-center justify-end pt-2">
            <button type="submit" disabled={saving}
              className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-bold shadow-lg shadow-emerald-600/20 transition active:scale-95 disabled:opacity-50">
              <Save size={15} /> {saving ? "Salvando..." : "Salvar marca"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
