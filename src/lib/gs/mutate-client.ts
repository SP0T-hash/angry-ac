'use client';

// Hook de mutação do módulo GS (client-side).
// Usa a API /api/gs/mutate (protegida por sessão httpOnly).

export async function gsMutate(
  tabela: string,
  data: Record<string, any>,
  id?: string,
): Promise<{ ok: boolean; id?: string; error?: string }> {
  const res = await fetch("/api/gs/mutate", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ tabela, id, data }),
  });
  const json = await res.json();
  if (!res.ok) return { ok: false, error: json.error || "Erro ao salvar." };
  return { ok: true, id: json.id };
}

export async function gsDelete(
  tabela: string,
  id: string,
): Promise<{ ok: boolean; error?: string }> {
  const res = await fetch("/api/gs/mutate", {
    method: "DELETE",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ tabela, id }),
  });
  const json = await res.json();
  if (!res.ok) return { ok: false, error: json.error || "Erro ao excluir." };
  return { ok: true };
}
