// Configuração de ambiente para angry-ac (Landing + GS + AC Angry).
// Separa development / homologation / production e mantém a EMISSÃO DE
// CERTIFICADO ICP-BRASIL BLOQUEADA, salvo habilitação com AC/DPC + credenciais.

export type AppEnvironment = "development" | "homologation" | "production" | "sandbox";

function resolve(): AppEnvironment {
  const raw =
    process.env.NEXT_PUBLIC_APP_ENVIRONMENT ||
    process.env.APP_ENVIRONMENT ||
    process.env.NODE_ENV ||
    "development";
  if (raw === "production") return "production";
  if (raw === "homologation" || raw === "staging") return "homologation";
  if (raw === "sandbox") return "sandbox";
  return "development";
}

export const ENVIRONMENT: AppEnvironment = resolve();
export const IS_PRODUCTION = ENVIRONMENT === "production";

// Emissão ICP-Brasil real permanece BLOQUEADA por padrão.
// Só seria habilitada com AC_INTEGRATION_ENABLED=true + AC_API_URL (após AC/homologação).
export const ISSUANCE_BLOCKED = !(
  process.env.AC_INTEGRATION_ENABLED === "true" && process.env.AC_API_URL
);

export const ENVIRONMENT_LABEL =
  process.env.NEXT_PUBLIC_ENVIRONMENT_LABEL ||
  ({
    development: "Ambiente de desenvolvimento",
    homologation: "Ambiente de homologação",
    production: "Produção",
    sandbox: "Ambiente sandbox",
  }[ENVIRONMENT]);

export const SHOW_ENV_BANNER = !IS_PRODUCTION || process.env.NEXT_PUBLIC_SHOW_ENV_BANNER === "true";

export const PRODUCT_NAME = process.env.NEXT_PUBLIC_BRAND_NAME || "VEMAPI";
