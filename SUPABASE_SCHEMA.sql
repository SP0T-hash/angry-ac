-- ==============================================================================
-- AC ANGRY - SCHEMA COMPLETO DE PRODUÇÃO 🛡️
-- Execute no SQL Editor do Supabase (em ordem)
-- ==============================================================================

-- ============================================================
-- EXTENSÕES NECESSÁRIAS
-- ============================================================
CREATE EXTENSION IF NOT EXISTS "pgcrypto";
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================
-- 1. TABELA: agr_users (Agentes de Registro)
-- ============================================================
CREATE TABLE IF NOT EXISTS agr_users (
  id            UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  cpf           TEXT NOT NULL UNIQUE,
  nome          TEXT NOT NULL,
  email         TEXT NOT NULL UNIQUE,
  role          TEXT NOT NULL DEFAULT 'AGR' CHECK (role IN ('AGR', 'SUPERVISOR', 'ADMIN')),
  is_active     BOOLEAN DEFAULT true,
  password_hash TEXT,               -- Hash bcrypt da senha
  cert_serial   TEXT,               -- Número de série do cert A3
  last_login    TIMESTAMPTZ,
  created_at    TIMESTAMPTZ DEFAULT now(),
  updated_at    TIMESTAMPTZ DEFAULT now()
);

-- ============================================================
-- 2. TABELA: protocols (Protocolos de Emissão)
-- ============================================================
CREATE TABLE IF NOT EXISTS protocols (
  id              UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  protocol_number TEXT NOT NULL UNIQUE,
  status          TEXT NOT NULL DEFAULT 'PENDING'
                  CHECK (status IN ('PENDING','IN_PROGRESS','BIOMETRY_OK','BIOMETRY_FAIL','ISSUED','CANCELLED','ERROR')),
  cert_type       TEXT NOT NULL,    -- PF-A1, PF-A3, PJ-A1, etc.

  -- Dados do titular
  holder_nome     TEXT NOT NULL,
  holder_cpf      TEXT NOT NULL,
  holder_cnpj     TEXT,
  holder_email    TEXT NOT NULL,
  holder_telefone TEXT,

  -- Controle de concorrência (Locker Logic)
  is_locked       BOOLEAN DEFAULT false,
  locked_by       UUID REFERENCES agr_users(id),
  locked_at       TIMESTAMPTZ,

  -- Biometria
  biometry_status TEXT DEFAULT 'PENDING' CHECK (biometry_status IN ('PENDING','CAPTURED','VALIDATED','FAILED')),
  biometry_score  NUMERIC(5,2),     -- Score NFIQ / liveness score
  face_photo_url  TEXT,             -- URL da foto capturada na videoconferência

  -- Emissão
  cert_serial     TEXT,
  cert_issued_at  TIMESTAMPTZ,
  cert_expires_at TIMESTAMPTZ,
  emission_code   TEXT,             -- Código entregue ao titular
  dossie_url      TEXT,

  -- Rastreabilidade
  agr_id          UUID REFERENCES agr_users(id),
  created_at      TIMESTAMPTZ DEFAULT now(),
  updated_at      TIMESTAMPTZ DEFAULT now()
);

-- ============================================================
-- 3. TABELA: security_nonces (Anti-Replay / CSRF)
-- ============================================================
CREATE TABLE IF NOT EXISTS security_nonces (
  id          UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  nonce       TEXT NOT NULL UNIQUE,
  scope       TEXT NOT NULL,        -- 'AUTH', 'SIGN', 'BIOMETRY', 'EMIT'
  protocol_id UUID REFERENCES protocols(id),
  agr_id      UUID REFERENCES agr_users(id),
  used        BOOLEAN DEFAULT false,
  expires_at  TIMESTAMPTZ NOT NULL,
  used_at     TIMESTAMPTZ,
  created_at  TIMESTAMPTZ DEFAULT now()
);

-- ============================================================
-- 4. TABELA: secure_sessions (Sessões AGR Autenticadas)
-- ============================================================
CREATE TABLE IF NOT EXISTS secure_sessions (
  id            UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  session_token TEXT NOT NULL UNIQUE,
  agr_id        UUID NOT NULL REFERENCES agr_users(id),
  cert_serial   TEXT,               -- Serial do cert A3 usado no login
  ip_address    TEXT,
  user_agent    TEXT,
  is_active     BOOLEAN DEFAULT true,
  expires_at    TIMESTAMPTZ NOT NULL,
  last_activity TIMESTAMPTZ DEFAULT now(),
  created_at    TIMESTAMPTZ DEFAULT now()
);

-- ============================================================
-- 5. TABELA: audit_logs (Trilha de Auditoria Imutável com Hash Chain)
-- ============================================================
-- O hash chain garante integridade dos logs: cada entrada contém
-- o hash SHA-256 da entrada anterior + dados atuais.
-- Qualquer alteração em um registro existente invalida toda a cadeia.
CREATE TABLE IF NOT EXISTS audit_logs (
  id            UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  event_type    TEXT NOT NULL,        -- 'LOGIN','LOCK','UNLOCK','BIOMETRY','EMIT', etc.
  agr_id        UUID REFERENCES agr_users(id),
  protocol_id   UUID REFERENCES protocols(id),
  ip_address    TEXT,
  user_agent    TEXT,
  payload       JSONB,                -- Dados do evento (sem info sensível)
  severity      TEXT DEFAULT 'INFO'  CHECK (severity IN ('INFO','WARN','ERROR','CRITICAL')),
  previous_hash TEXT,                 -- Hash SHA-256 da entrada anterior (blockchain-style)
  hash          TEXT NOT NULL,        -- Hash SHA-256 desta entrada
  created_at    TIMESTAMPTZ DEFAULT now(),
  -- Garante que o hash é único (impede duplicação)
  CONSTRAINT uq_audit_hash UNIQUE (hash)
);

-- Índice para busca rápida do último hash
CREATE INDEX IF NOT EXISTS idx_audit_hash ON audit_logs(hash DESC);

-- ============================================================
-- 6. TABELA: rate_limit_buckets (Rate Limiting por IP/AGR)
-- ============================================================
CREATE TABLE IF NOT EXISTS rate_limit_buckets (
  id           UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  bucket_key   TEXT NOT NULL UNIQUE, -- 'ip:1.2.3.4' ou 'agr:uuid'
  action       TEXT NOT NULL,        -- 'LOGIN', 'SIGN', 'EMIT'
  request_count INT DEFAULT 1,
  window_start  TIMESTAMPTZ DEFAULT now(),
  blocked_until TIMESTAMPTZ,
  created_at    TIMESTAMPTZ DEFAULT now(),
  updated_at    TIMESTAMPTZ DEFAULT now()
);

-- ============================================================
-- 7. TABELA: leads (Formulário de Contato - já existente)
-- ============================================================
CREATE TABLE IF NOT EXISTS leads (
  id         UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  nome       TEXT NOT NULL,
  startup    TEXT NOT NULL,
  email      TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- ============================================================
-- ÍNDICES DE PERFORMANCE
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
-- ROW LEVEL SECURITY (RLS) - Proteção por padrão
-- ============================================================
ALTER TABLE agr_users         ENABLE ROW LEVEL SECURITY;
ALTER TABLE protocols         ENABLE ROW LEVEL SECURITY;
ALTER TABLE security_nonces   ENABLE ROW LEVEL SECURITY;
ALTER TABLE secure_sessions   ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs        ENABLE ROW LEVEL SECURITY;
ALTER TABLE rate_limit_buckets ENABLE ROW LEVEL SECURITY;
ALTER TABLE leads             ENABLE ROW LEVEL SECURITY;

-- Políticas de acesso via Service Role (backend)
-- As APIs do Next.js usam SUPABASE_SERVICE_ROLE_KEY, que bypassa RLS.
-- O anon key do cliente só pode acessar leads (formulário público).

CREATE POLICY "leads_insert_public" ON leads FOR INSERT WITH CHECK (true);
CREATE POLICY "leads_select_public" ON leads FOR SELECT USING (true);

-- ============================================================
-- FUNÇÃO: Calcular hash chain para audit_logs (blockchain-style)
-- ============================================================
CREATE OR REPLACE FUNCTION compute_audit_hash()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
DECLARE
  last_hash TEXT;
  raw_data TEXT;
BEGIN
  -- Buscar o hash da última entrada
  SELECT hash INTO last_hash FROM audit_logs
    ORDER BY created_at DESC, id DESC LIMIT 1;

  -- Concatenar dados da entrada atual com o hash anterior
  raw_data := COALESCE(last_hash, 'genesis')
    || COALESCE(NEW.event_type, '')
    || COALESCE(NEW.agr_id::TEXT, '')
    || COALESCE(NEW.protocol_id::TEXT, '')
    || COALESCE(NEW.ip_address, '')
    || COALESCE(NEW.payload::TEXT, '')
    || COALESCE(NEW.severity, 'INFO')
    || COALESCE(EXTRACT(EPOCH FROM NOW())::TEXT, '');

  NEW.previous_hash := last_hash;
  NEW.hash := encode(sha256(raw_data::bytea), 'hex');

  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_audit_logs_hash
  BEFORE INSERT ON audit_logs
  FOR EACH ROW EXECUTE FUNCTION compute_audit_hash();

-- ============================================================
-- FUNÇÃO: Limpar nonces expirados (agendar via pg_cron se disponível)
-- ============================================================
CREATE OR REPLACE FUNCTION cleanup_expired_nonces()
RETURNS void LANGUAGE plpgsql AS $$
BEGIN
  DELETE FROM security_nonces WHERE expires_at < now();
  DELETE FROM rate_limit_buckets WHERE window_start < now() - INTERVAL '1 hour';
END;
$$;

-- ============================================================
-- FUNÇÃO: Auto-update updated_at
-- ============================================================
CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_protocols_updated_at
  BEFORE UPDATE ON protocols
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TRIGGER trg_agr_users_updated_at
  BEFORE UPDATE ON agr_users
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- ============================================================
-- DADOS INICIAIS (Admin padrão para testes)
-- ============================================================
INSERT INTO agr_users (cpf, nome, email, role)
VALUES ('00000000000', 'Admin ANGRY', 'admin@angry.ac.br', 'ADMIN')
ON CONFLICT (cpf) DO NOTHING;
