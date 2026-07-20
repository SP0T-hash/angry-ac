/**
 * AC ANGRY - Cliente Supabase Admin (Service Role)
 *
 * ⚠️ NUNCA importar este módulo no client-side!
 *
 * Este módulo é agora um re-export da infra centralizada em
 * lib/infra/supabase/client.ts, que é a ÚNICA fonte de clientes Supabase
 * do projeto (sem mock silencioso). Mantido para compatibilidade de imports
 * legados do domínio AC.
 */

export {
  getSupabaseAdmin,
  getSupabaseAdminAsync,
} from '@/lib/infra/supabase/client';
