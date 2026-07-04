-- ==============================================================================
-- AC ANGRY - CORREÇÃO DAS TABELAS AUSENTES 🛠️
-- Execute todo este script no SQL Editor do Supabase
-- ==============================================================================

-- Garantir extensões
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ============================================================
-- 1. agr_users
-- ============================================================
CREATE TABLE IF NOT EXISTS agr_users (
  id            UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  cpf           TEXT NOT NULL UNIQUE,
  nome          TEXT NOT NULL,
  email         TEXT NOT NULL UNIQUE,
  role          TEXT NOT NULL DEFAULT 'AGR' CHECK (role IN ('AGR', 'SUPERVISOR', 'ADMIN')),
  is_active     BOOLEAN DEFAULT true,
  cert_serial   TEXT,
  last_login    TIMESTAMPTZ,
  created_at    TIMESTAMPTZ DEFAULT now(),
  updated_at    TIMESTAMPTZ DEFAULT now()
);

-- ============================================================
-- 2. security_nonces
-- ============================================================
CREATE TABLE IF NOT EXISTS security_nonces (
  id          UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  nonce       TEXT NOT NULL UNIQUE,
  scope       TEXT NOT NULL,
  protocol_id UUID REFERENCES protocols(id),
  agr_id      UUID REFERENCES agr_users(id),
  used        BOOLEAN DEFAULT false,
  expires_at  TIMESTAMPTZ NOT NULL,
  used_at     TIMESTAMPTZ,
  created_at  TIMESTAMPTZ DEFAULT now()
);

-- ============================================================
-- 3. secure_sessions
-- ============================================================
CREATE TABLE IF NOT EXISTS secure_sessions (
  id            UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  session_token TEXT NOT NULL UNIQUE,
  agr_id        UUID NOT NULL REFERENCES agr_users(id),
  cert_serial   TEXT,
  ip_address    TEXT,
  user_agent    TEXT,
  is_active     BOOLEAN DEFAULT true,
  expires_at    TIMESTAMPTZ NOT NULL,
  last_activity TIMESTAMPTZ DEFAULT now(),
  created_at    TIMESTAMPTZ DEFAULT now()
);

-- ============================================================
-- 4. rate_limit_buckets
-- ============================================================
CREATE TABLE IF NOT EXISTS rate_limit_buckets (
  id           UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  bucket_key   TEXT NOT NULL UNIQUE,
  action       TEXT NOT NULL,
  request_count INT DEFAULT 1,
  window_start  TIMESTAMPTZ DEFAULT now(),
  blocked_until TIMESTAMPTZ,
  created_at    TIMESTAMPTZ DEFAULT now(),
  updated_at    TIMESTAMPTZ DEFAULT now()
);

-- ============================================================
-- Índices
-- ============================================================
CREATE INDEX IF NOT EXISTS idx_protocols_status       ON protocols(status);
CREATE INDEX IF NOT EXISTS idx_protocols_locked_by    ON protocols(locked_by);
CREATE INDEX IF NOT EXISTS idx_protocols_holder_cpf   ON protocols(holder_cpf);
CREATE INDEX IF NOT EXISTS idx_nonces_nonce           ON security_nonces(nonce);
CREATE INDEX IF NOT EXISTS idx_nonces_expires         ON security_nonces(expires_at);
CREATE INDEX IF NOT EXISTS idx_sessions_token         ON secure_sessions(session_token);
CREATE INDEX IF NOT EXISTS idx_sessions_agr           ON secure_sessions(agr_id);
CREATE INDEX IF NOT EXISTS idx_audit_agr              ON audit_logs(agr_id);
CREATE INDEX IF NOT EXISTS idx_audit_protocol         ON audit_logs(protocol_id);
CREATE INDEX IF NOT EXISTS idx_audit_created          ON audit_logs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_rate_bucket_key        ON rate_limit_buckets(bucket_key, action);

-- ============================================================
-- Triggers
-- ============================================================
CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_protocols_updated_at ON protocols;
CREATE TRIGGER trg_protocols_updated_at
  BEFORE UPDATE ON protocols
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

DROP TRIGGER IF EXISTS trg_agr_users_updated_at ON agr_users;
CREATE TRIGGER trg_agr_users_updated_at
  BEFORE UPDATE ON agr_users
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- ============================================================
-- RLS
-- ============================================================
ALTER TABLE agr_users           ENABLE ROW LEVEL SECURITY;
ALTER TABLE security_nonces     ENABLE ROW LEVEL SECURITY;
ALTER TABLE secure_sessions     ENABLE ROW LEVEL SECURITY;
ALTER TABLE rate_limit_buckets  ENABLE ROW LEVEL SECURITY;

-- ============================================================
-- Seed data (se estiver vazio)
-- ============================================================
INSERT INTO agr_users (cpf, nome, email, role)
SELECT * FROM (VALUES
  ('11111111111', 'Carlos Silva',    'carlos@angry.ac.br',       'AGR'),
  ('22222222222', 'Maria Oliveira',  'maria@angry.ac.br',        'AGR'),
  ('33333333333', 'João Santos',     'joao@angry.ac.br',         'SUPERVISOR'),
  ('00000000000', 'Admin ANGRY',     'admin@angry.ac.br',        'ADMIN')
) AS v
WHERE NOT EXISTS (SELECT 1 FROM agr_users);

INSERT INTO protocols (protocol_number, status, cert_type, holder_nome, holder_cpf, holder_email, agr_id)
SELECT * FROM (VALUES
  ('PROTO-2026-0001', 'PENDING',       'PF-A3', 'Ana Beatriz Costa',   '12345678901', 'ana@email.com',      (SELECT id FROM agr_users WHERE cpf = '11111111111')),
  ('PROTO-2026-0002', 'BIOMETRY_OK',   'PF-A1', 'Pedro Henrique Lima', '98765432100', 'pedro@email.com',   (SELECT id FROM agr_users WHERE cpf = '22222222222')),
  ('PROTO-2026-0003', 'ISSUED',        'PJ-A1', 'Tech Solutions Ltda', '11223344556', 'contato@techsol.com',(SELECT id FROM agr_users WHERE cpf = '11111111111'))
) AS v
WHERE NOT EXISTS (SELECT 1 FROM protocols);

SELECT '✅ Correção concluída!' AS status;
SELECT table_name FROM information_schema.tables WHERE table_schema = 'public' ORDER BY table_name;
