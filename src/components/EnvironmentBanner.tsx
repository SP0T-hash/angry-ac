import { ENVIRONMENT, ENVIRONMENT_LABEL, ISSUANCE_BLOCKED, PRODUCT_NAME } from "@/lib/env";

const STYLES: Record<string, string> = {
  development: "bg-amber-500 text-black",
  homologation: "bg-sky-600 text-white",
  sandbox: "bg-violet-600 text-white",
  production: "bg-emerald-600 text-white",
};

// Indicador fixo de ambiente. Em produção aparece discreto; em dev/homologação/
// sandbox deixa claro o estado (emissão bloqueada). Não expõe marcas de fornecedor.
export function EnvironmentBanner() {
  if (ENVIRONMENT === "production") {
    return (
      <div className="fixed bottom-2 right-2 z-[100] rounded-full px-3 py-1 text-xs font-medium bg-emerald-600 text-white shadow">
        {PRODUCT_NAME} · Produção
      </div>
    );
  }
  return (
    <div
      className={`fixed bottom-2 right-2 z-[100] rounded-full px-3 py-1 text-xs font-semibold shadow ${STYLES[ENVIRONMENT]}`}
    >
      {PRODUCT_NAME} · {ENVIRONMENT_LABEL}
      {ISSUANCE_BLOCKED ? " · emissão bloqueada" : ""}
    </div>
  );
}
