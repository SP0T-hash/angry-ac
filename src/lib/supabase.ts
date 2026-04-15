// Configuração Supabase com lazy initialization
let supabaseInstance: any = null;

const createSupabaseClient = async () => {
  if (supabaseInstance) return supabaseInstance;
  
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  
  if (!supabaseUrl || !supabaseAnonKey) {
    console.log('[SUPABASE] Usando modo mock');
    supabaseInstance = {
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
    return supabaseInstance;
  }
  
  const { createClient } = await import('@supabase/supabase-js');
  supabaseInstance = createClient(supabaseUrl, supabaseAnonKey, {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true,
    }
  });
  return supabaseInstance;
};

// Proxy que inicializa o cliente apenas quando usado
export const supabase = new Proxy({} as any, {
  get: (target, prop) => {
    return async (...args: any[]) => {
      const client = await createSupabaseClient();
      return client[prop](...args);
    };
  }
});