'use client';

import React, { useState } from 'react';
import { X, Save, Trash2 } from 'lucide-react';
import { gsMutate, gsDelete } from "@/lib/gs/mutate-client";

export interface CampoForm {
  name: string;
  label: string;
  type?: "text" | "email" | "number" | "select" | "textarea" | "date";
  options?: { value: string | boolean; label: string }[];
  required?: boolean;
  defaultValue?: any;
}

interface GSFormModalProps {
  open: boolean;
  titulo: string;
  tabela: string;
  campos: CampoForm[];
  registro?: Record<string, any> | null;
  onClose: () => void;
  onSaved: () => void;
}

export default function GSFormModal({
  open, titulo, tabela, campos, registro, onClose, onSaved,
}: GSFormModalProps) {
  const [form, setForm] = useState<Record<string, any>>(() => {
    const init: Record<string, any> = {};
    campos.forEach((c) => {
      init[c.name] = registro?.[c.name] ?? c.defaultValue ?? "";
    });
    return init;
  });
  const [saving, setSaving] = useState(false);
  const [erro, setErro] = useState("");

  if (!open) return null;

  const handleChange = (name: string, value: any) => {
    setForm((f) => ({ ...f, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setErro("");
    // Limpa campos vazios e converte números
    const data: Record<string, any> = {};
    campos.forEach((c) => {
      let v = form[c.name];
      if (v === "" || v === null || v === undefined) return;
      if (c.type === "number") v = Number(v);
      if (v === "true") v = true;
      if (v === "false") v = false;
      data[c.name] = v;
    });
    const res = await gsMutate(tabela, data, registro?.id);
    if (!res.ok) {
      setErro(res.error || "Erro ao salvar.");
      setSaving(false);
      return;
    }
    setSaving(false);
    onSaved();
    onClose();
  };

  const handleDelete = async () => {
    if (!registro?.id) return;
    if (!confirm("Confirma a exclusão deste registro?")) return;
    setSaving(true);
    const res = await gsDelete(tabela, registro.id);
    if (!res.ok) { setErro(res.error || "Erro ao excluir."); setSaving(false); return; }
    setSaving(false);
    onSaved();
    onClose();
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 sticky top-0 bg-white">
          <h3 className="text-base font-black text-slate-900">{titulo}</h3>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-700 p-1 hover:bg-slate-100 rounded-lg">
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {campos.map((c) => (
            <div key={c.name}>
              <label className="text-xs font-bold text-slate-500 uppercase tracking-wide">
                {c.label}{c.required && <span className="text-rose-500"> *</span>}
              </label>
              <div className="mt-1.5">
                {c.type === "select" ? (
                  <select
                    value={form[c.name] ?? ""}
                    onChange={(e) => handleChange(c.name, e.target.value)}
                    className="w-full py-2.5 px-3 rounded-xl border border-slate-200 outline-none focus:ring-2 focus:ring-emerald-500/40 focus:border-emerald-400 text-sm text-slate-800 bg-white"
                  >
                    <option value="">Selecione...</option>
                    {c.options?.map((o) => (
                      <option key={String(o.value)} value={String(o.value)}>{o.label}</option>
                    ))}
                  </select>
                ) : c.type === "textarea" ? (
                  <textarea
                    value={form[c.name] ?? ""}
                    onChange={(e) => handleChange(c.name, e.target.value)}
                    rows={3}
                    className="w-full py-2.5 px-3 rounded-xl border border-slate-200 outline-none focus:ring-2 focus:ring-emerald-500/40 focus:border-emerald-400 text-sm text-slate-800"
                  />
                ) : (
                  <input
                    type={c.type === "date" ? "date" : c.type === "number" ? "number" : c.type === "email" ? "email" : "text"}
                    value={form[c.name] ?? ""}
                    onChange={(e) => handleChange(c.name, e.target.value)}
                    className="w-full py-2.5 px-3 rounded-xl border border-slate-200 outline-none focus:ring-2 focus:ring-emerald-500/40 focus:border-emerald-400 text-sm text-slate-800"
                  />
                )}
              </div>
            </div>
          ))}

          {erro && (
            <div className="text-sm text-rose-600 bg-rose-50 border border-rose-100 rounded-lg px-3 py-2">{erro}</div>
          )}

          <div className="flex items-center justify-between pt-2">
            {registro?.id ? (
              <button type="button" onClick={handleDelete} disabled={saving}
                className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-rose-600 hover:bg-rose-50 text-sm font-bold disabled:opacity-50">
                <Trash2 size={15} /> Excluir
              </button>
            ) : <span />}
            <button type="submit" disabled={saving}
              className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-bold shadow-lg shadow-emerald-600/20 transition active:scale-95 disabled:opacity-50">
              <Save size={15} /> {saving ? "Salvando..." : "Salvar"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
