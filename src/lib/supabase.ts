/**
 * Supabase Client with Lazy Initialization + Deep Chainable Proxy
 *
 * O proxy constrói uma cadeia de operações (ex: from → select → eq → single)
 * e só executa contra o cliente real quando o terminal .then() é chamado
 * (via await). Isso permite lazy initialization sem quebrar o chaining.
 */

// ─────────────────────────────────────────────────────────────
// Mock client p/ ambiente sem variáveis configuradas
// ─────────────────────────────────────────────────────────────
function createMockClient() {
  const chainable: any = new Proxy({} as any, {
    get: (t: any, prop: string) => {
      if (prop === 'then') return async (r: any) => r({ data: [], error: null });
      if (prop === 'single' || prop === 'maybeSingle' || prop === 'insert' ||
          prop === 'update' || prop === 'upsert' || prop === 'delete')
        return () => Promise.resolve({ data: null, error: null });
      return () => chainable;
    },
  });
  return {
    from: () => chainable,
    rpc: () => Promise.resolve({ data: null, error: null }),
    auth: {
      signInWithPassword: () => Promise.resolve({ data: null, error: null }),
      signOut: () => Promise.resolve({ error: null }),
      getSession: () => Promise.resolve({ data: { session: null }, error: null }),
      getUser: () => Promise.resolve({ data: { user: null }, error: null }),
      onAuthStateChange: () => ({ data: { subscription: { unsubscribe: () => {} } } }),
    },
  };
}

// ─────────────────────────────────────────────────────────────
// Inicialização lazy do cliente real
// ─────────────────────────────────────────────────────────────
let clientPromise: Promise<any> | null = null;

function getClientPromise(): Promise<any> {
  if (!clientPromise) {
    clientPromise = (async () => {
      const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
      const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
      if (!url || !key) {
        console.log('[Supabase] Modo mock');
        return createMockClient();
      }
      const { createClient } = await import('@supabase/supabase-js');
      return createClient(url, key, {
        auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: true },
      });
    })();
  }
  return clientPromise;
}

// ─────────────────────────────────────────────────────────────
// Chainable Proxy — grava operações e executa só no .then()
// ─────────────────────────────────────────────────────────────
function makeChain(
  exec: () => Promise<any>,
  ops: Array<{ name: string; args: any[] }> = [],
): any {
  return new Proxy({} as any, {
    get(_target, prop: string) {
      // Terminal: executa toda a cadeia contra o cliente real
      if (prop === 'then') {
        return async (resolve: (v: any) => void, reject: (e: any) => void) => {
          try {
            let result = await exec();
            for (const op of ops) {
              result = result[op.name](...op.args);
            }
            if (result && typeof result.then === 'function') result = await result;
            resolve(result);
          } catch (e) { reject(e); }
        };
      }
      if (prop === 'catch') {
        return async (reject: (e: any) => void) => {
          try { await makeChain(exec, ops).then(undefined, reject); }
          catch (e) { reject(e); }
        };
      }
      // Não-terminal: acumula operação e retorna nova cadeia
      return (...args: any[]) => makeChain(exec, [...ops, { name: prop, args }]);
    },
  });
}

// ─────────────────────────────────────────────────────────────
// Proxy de entrada: redireciona from/rpc/auth… para makeChain
// ─────────────────────────────────────────────────────────────
export const supabase = new Proxy({} as any, {
  get(_target, prop: string) {
    // from() e rpc() iniciam cadeia com o método no cliente
    if (prop === 'from' || prop === 'rpc') {
      return (...args: any[]) =>
        makeChain(() => getClientPromise().then((c: any) => c[prop](...args)));
    }
    // Props como auth, storage → objeto aninhado
    return makeChain(() => getClientPromise().then((c: any) => c[prop]));
  },
});

// Helper para obter o cliente real diretamente
export async function getSupabaseClient(): Promise<any> {
  return getClientPromise();
}
