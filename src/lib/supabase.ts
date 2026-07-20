/**
 * Compatibilidade — cliente browser real da infra centralizada.
 *
 * Histórico: este arquivo tinha um cliente "mock silencioso" que, na ausência
 * de env vars, gravava/linha em lugar nenhum sem erro. Isso foi removido.
 * Agora toda a aplicação usa lib/infra/supabase/client.ts, que LANÇA ERRO
 * explícito quando as env vars obrigatórias não estão configuradas.
 *
 * O export `supabase` é um Proxy lazy: na primeira propriedade acessada
 * (ex: .from, .auth), ele resolve a instância real de getSupabaseBrowser().
 * Isso evita criar o cliente em tempo de build (quando as envs podem faltar).
 */

import { getSupabaseBrowser } from '@/lib/infra/supabase/client';

let _instance: ReturnType<typeof getSupabaseBrowser> | null = null;

function getInstance() {
  if (!_instance) _instance = getSupabaseBrowser();
  return _instance;
}

export const supabase = new Proxy({} as ReturnType<typeof getSupabaseBrowser>, {
  get(_t, prop) {
    const client = getInstance();
    const value = (client as any)[prop];
    return typeof value === 'function' ? value.bind(client) : value;
  },
});

export function getSupabaseClient() {
  return getInstance();
}
