import { createClient } from '@supabase/supabase-js';

const getSupabaseClient = () => {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  
  // Se não tiver variáveis, retorna cliente mock para não quebrar o build
  if (!supabaseUrl || !supabaseAnonKey) {
    console.log('[SUPABASE] Usando modo mock - variáveis não configuradas');
    return {
      from: () => ({
        insert: () => Promise.resolve({ data: null, error: null }),
        select: () => ({
          eq: () => Promise.resolve({ data: [], error: null }),
          order: () => Promise.resolve({ data: [], error: null }),
          limit: () => Promise.resolve({ data: [], error: null })
        })
      }),
      auth: {
        signInWithPassword: () => Promise.resolve({ data: null, error: null }),
        signOut: () => Promise.resolve({ error: null }),
        onAuthStateChange: () => ({ data: { subscription: { unsubscribe: () => {} } } })
      }
    };
  }
  
  return createClient(supabaseUrl, supabaseAnonKey, {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true,
    }
  });
};

export const supabase = getSupabaseClient();