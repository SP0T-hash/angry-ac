/**
 * INFRA — Cliente Supabase único e centralizado 🛡️
 *
 * Regra de fronteira: NUNCA há cliente mock silencioso. Se as variáveis de
 * ambiente obrigatórias não estiverem configuradas, o cliente LANÇA ERRO
 * explícito em vez de gravar/ler em lugar nenhum.
 *
 * Três perfis:
 *  - getSupabaseBrowser(): cliente anon (NEXT_PUBLIC_*) p/ uso no browser
 *  - getSupabaseServer():  cliente anon p/ Server Components / Route Handlers
 *  - getSupabaseAdmin():    cliente service-role (privilégio total, server-only)
 */

import { createClient, type SupabaseClient } from '@supabase/supabase-js';

function requireEnv(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(
      `[INFRA] Variável de ambiente obrigatória ausente: ${name}. ` +
        `Configure .env.development / .env.production antes de subir.`,
    );
  }
  return value;
}

// ─────────────────────────────────────────────────────────────
// Browser (anon)
// ─────────────────────────────────────────────────────────────
let _browser: SupabaseClient | null = null;
export function getSupabaseBrowser(): SupabaseClient {
  if (_browser) return _browser;
  const url = requireEnv('NEXT_PUBLIC_SUPABASE_URL');
  const key = requireEnv('NEXT_PUBLIC_SUPABASE_ANON_KEY');
  _browser = createClient(url, key, {
    auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: true },
  });
  return _browser;
}

// ─────────────────────────────────────────────────────────────
// Server (anon) — mesmo perfil do browser, instância própria
// ─────────────────────────────────────────────────────────────
let _server: SupabaseClient | null = null;
export function getSupabaseServer(): SupabaseClient {
  if (_server) return _server;
  const url = requireEnv('NEXT_PUBLIC_SUPABASE_URL');
  const key = requireEnv('NEXT_PUBLIC_SUPABASE_ANON_KEY');
  _server = createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  return _server;
}

// ─────────────────────────────────────────────────────────────
// Admin (service-role) — privilégio total, NUNCA no browser
// ─────────────────────────────────────────────────────────────
let _admin: SupabaseClient | null = null;
let _adminInit: Promise<SupabaseClient> | null = null;

export function getSupabaseAdmin(): SupabaseClient {
  if (_admin) return _admin;
  if (_adminInit) {
    // Em runtime síncrono retornamos a promessa pendente através de cache;
    // para uso síncrono garantimos a criação aqui (env já validada).
    throw new Error(
      '[INFRA] getSupabaseAdmin() chamado de forma síncrona durante init. ' +
        'Use a versão async ou garanta que as envs estejam presentes.',
    );
  }
  const url = requireEnv('NEXT_PUBLIC_SUPABASE_URL');
  const key = requireEnv('SUPABASE_SERVICE_ROLE_KEY');
  _admin = createClient(url, key, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
  return _admin;
}

/**
 * Versão async (preferida em Route Handlers) — cria sob demanda e cacheia.
 */
export async function getSupabaseAdminAsync(): Promise<SupabaseClient> {
  if (_admin) return _admin;
  if (_adminInit) return _adminInit;
  _adminInit = (async () => {
    const url = requireEnv('NEXT_PUBLIC_SUPABASE_URL');
    const key = requireEnv('SUPABASE_SERVICE_ROLE_KEY');
    return createClient(url, key, {
      auth: { autoRefreshToken: false, persistSession: false },
    });
  })();
  _admin = await _adminInit;
  return _admin;
}
