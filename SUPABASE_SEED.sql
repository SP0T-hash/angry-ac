-- ==============================================================================
-- AC ANGRY - DADOS DE SEED PARA TESTES 🧪
-- Execute APÓS o SUPABASE_SCHEMA.sql no SQL Editor do Supabase
-- ==============================================================================

-- ============================================================
-- 1. AGR Users (Agentes de Registro)
-- ============================================================
INSERT INTO agr_users (cpf, nome, email, role, is_active) VALUES
  ('11111111111', 'Carlos Silva',    'carlos@angry.ac.br',       'AGR',       true),
  ('22222222222', 'Maria Oliveira',  'maria@angry.ac.br',        'AGR',       true),
  ('33333333333', 'João Santos',     'joao@angry.ac.br',         'SUPERVISOR', true),
  ('00000000000', 'Admin ANGRY',     'admin@angry.ac.br',        'ADMIN',     true)
ON CONFLICT (cpf) DO NOTHING;

-- ============================================================
-- 2. Protocols (Protocolos de Teste)
-- ============================================================
INSERT INTO protocols (
  protocol_number, status, cert_type,
  holder_nome, holder_cpf, holder_email,
  agr_id
) VALUES
  ('PROTO-2026-0001', 'PENDING',     'PF-A3', 'Ana Beatriz Costa',  '12345678901', 'ana@email.com',      (SELECT id FROM agr_users WHERE cpf = '11111111111')),
  ('PROTO-2026-0002', 'BIOMETRY_OK', 'PF-A1', 'Pedro Henrique Lima','98765432100', 'pedro@email.com',    (SELECT id FROM agr_users WHERE cpf = '22222222222')),
  ('PROTO-2026-0003', 'ISSUED',      'PJ-A1', 'Tech Solutions Ltda','11223344556', 'contato@techsol.com',(SELECT id FROM agr_users WHERE cpf = '11111111111'))
ON CONFLICT (protocol_number) DO NOTHING;

-- ============================================================
-- 3. Rate Limit Buckets (Limpeza)
-- ============================================================
DELETE FROM rate_limit_buckets; -- Começa limpo para testes

-- ============================================================
-- 4. Security Nonces (Limpeza)
-- ============================================================
DELETE FROM security_nonces WHERE expires_at < now(); -- Limpa expirados

-- ============================================================
-- 5. Verificação
-- ============================================================
SELECT '✅ Seed concluído!' AS status;
SELECT 'AGR Users:' AS info, count(*) FROM agr_users;
SELECT 'Protocols:' AS info, count(*) FROM protocols;
