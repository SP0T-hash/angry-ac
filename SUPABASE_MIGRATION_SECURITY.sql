-- ==============================================================================
-- AC ANGRY / GS — MIGRAÇÃO DE SEGURANÇA (pós-auditoria)
-- Execute no SQL Editor do Supabase (em ordem) APÓS os schemas base.
-- ==============================================================================

-- ============================================================
-- 1. PKI PINNING — amarra o AGR à chave pública do certificado
-- ============================================================
-- Sem esta coluna, um atacante poderia se passar por um AGR usando um
-- certificado auto-assinado com o serial conhecido (spoofing de serial).
-- Com o pinning, o certificado apresentado deve corresponder à chave pública
-- registrada no enrollment.
ALTER TABLE agr_users
  ADD COLUMN IF NOT EXISTS cert_public_key_hash TEXT;

COMMENT ON COLUMN agr_users.cert_public_key_hash IS
  'SHA-256 do SPKI (chave pública DER) do certificado A3 do AGR. Populado no enrollment/login válido.';

-- Backfill: quando um AGR fizer login com certificado válido, o código
-- (src/app/api/auth/pki/route.ts) deve gravar cert_public_key_hash.
-- Exemplo de preenchimento manual (substitua pelos valores reais):
--   UPDATE agr_users SET cert_public_key_hash = '<sha256>' WHERE id = '<agr_id>';

-- ============================================================
-- 2. GS — trilha de auditoria (antes inexistente para o ERP)
-- ============================================================
CREATE TABLE IF NOT EXISTS gs_audit_logs (
  id           UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  usuario_id   UUID REFERENCES gs_usuarios(id),
  tabela       TEXT NOT NULL,
  acao         TEXT NOT NULL CHECK (acao IN ('INSERT','UPDATE','DELETE','LOGIN','LOGOUT')),
  registro_id  UUID,
  payload      JSONB,
  severity     TEXT DEFAULT 'INFO' CHECK (severity IN ('INFO','WARN','ERROR','CRITICAL')),
  ip_address   TEXT,
  user_agent   TEXT,
  created_at   TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_gs_audit_tabela    ON gs_audit_logs(tabela);
CREATE INDEX IF NOT EXISTS idx_gs_audit_usuario   ON gs_audit_logs(usuario_id);
CREATE INDEX IF NOT EXISTS idx_gs_audit_created   ON gs_audit_logs(created_at DESC);

ALTER TABLE gs_audit_logs ENABLE ROW LEVEL SECURITY;
-- O backend usa service_role (bypass RLS); o anon do cliente não tem acesso.
CREATE POLICY "gs_audit_service_only" ON gs_audit_logs FOR ALL TO service_role USING (true);

-- ============================================================
-- 3. gs_sessoes — reforço de inativação/revogação
-- ============================================================
-- Garante que sessões revogadas (is_active=false) sejam filtradas.
-- (A coluna is_active já existe no schema base; esta é apenas uma garantia de índice.)
CREATE INDEX IF NOT EXISTS idx_gs_sessoes_token_active
  ON gs_sessoes(token, is_active);

-- ============================================================
-- 4. Valores de seed mínimos (senhas em bcrypt, NUNCA texto puro)
-- ============================================================
-- O seed antigo usava 'admin123' em texto puro (fallback inseguro).
-- Gere um hash bcrypt para os usuários de teste e atualize:
--   UPDATE gs_usuarios SET password_hash = '<$2a$...bcrypt>' WHERE email = 'admin@vemapi.com.br';
-- O código em src/lib/gs/session.ts AGORA exige bcrypt ($2*) e rejeita texto puro.
