/**
 * AC ANGRY - Cliente Supabase Admin (Service Role)
 *
 * ⚠️ NUNCA importar este módulo no client-side!
 * Contém a SUPABASE_SERVICE_ROLE_KEY que dá acesso total ao banco.
 */

import type { SupabaseClient } from '@supabase/supabase-js';

let client: SupabaseClient | null = null;

/**
 * Retorna uma instância lazy do cliente Supabase com service role.
 * Só cria o cliente na primeira chamada (evita crash em build time).
 */
export async function getSupabaseAdmin(): Promise<SupabaseClient> {
  if (client) return client;

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !serviceRoleKey) {
    throw new Error(
      '[SupabaseAdmin] NEXT_PUBLIC_SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY são obrigatórios.',
    );
  }

  const { createClient } = await import('@supabase/supabase-js');
  client = createClient(supabaseUrl, serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });

  return client;
}

/**
 * Limpa a instância (útil em testes).
 */
export function resetSupabaseAdmin(): void {
  client = null;
}
