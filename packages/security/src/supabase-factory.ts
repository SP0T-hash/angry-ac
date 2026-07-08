/**
 * Factory unificado para cliente Supabase Admin
 * Evita múltiplas inicializações e garante configuração consistente
 */

import { createClient, SupabaseClient } from '@supabase/supabase-js';

let _adminClient: SupabaseClient | null = null;
let _initPromise: Promise<SupabaseClient> | null = null;

/**
 * Retorna cliente Supabase com service role key (backend apenas)
 * Usa lazy initialization com promise caching para evitar race conditions
 */
export async function getSupabaseAdmin(): Promise<SupabaseClient> {
  if (_adminClient) return _adminClient;
  if (_initPromise) return _initPromise;

  _initPromise = (async () => {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const key = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!url || !key) {
      throw new Error(
        '[AC ANGRY] NEXT_PUBLIC_SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY são obrigatórios.',
      );
    }

    _adminClient = createClient(url, key, {
      auth: { autoRefreshToken: false, persistSession: false },
    });

    return _adminClient;
  })();

  return _initPromise;
}
