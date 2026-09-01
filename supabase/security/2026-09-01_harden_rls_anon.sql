-- ============================================================================
-- SECURITY AUDIT 2026-09-01 — HARDENING RLS / chave anon
-- Aplica em: projeto Supabase lzmylpfdmgspleezgynz (banco compartilhado,
--             usado pelos 3 ambientes: sandbox, homolog, producao)
--
-- Objetivo:
--   A chave anon (publica, embarcada no bundle do browser) tinha acesso
--   de LEITURA (PII em gs_contadores: cpf/email/telefone/valores) e de
--   ESCRITA (INSERT/UPDATE/DELETE) em quase todas as tabelas public.*.
--   Esta migracao adota deny-by-default:
--     1. REVOKE de anon/authenticated em 35 tabelas sensiveis
--     2. RLS habilitado em TODAS as tabelas public.*
--     3. leads  -> apenas INSERT para anon (formulario publico da Landing)
--     4. tickets-> mantem acesso do papel authenticated (Portal, Supabase Auth)
--   O papel service_role (usado pelo backend) nao e afetado (bypassa RLS).
--
-- Reversao: remover as 2 politicas criadas e REVOKE/GRANT inversos que
--   estao documentados no fim deste arquivo.
-- ============================================================================

BEGIN;

-- ───────────────────────────────────────────────────────────────────────────
-- 1. REVOKE do papel anon/authenticated nas tabelas sensiveis
--    (tudo, exceto leads/tickets que ganham politica minima abaixo)
-- ───────────────────────────────────────────────────────────────────────────
REVOKE ALL ON TABLE
  agr_users, audit_logs, certificates, fraud_blacklist,
  gs_agenda, gs_ars, gs_assinaturas, gs_clientes, gs_cobrancas,
  gs_comissoes, gs_contador_carteira, gs_contadores, gs_faturas,
  gs_formas_pagamento, gs_gateway_logs, gs_integracao_logs,
  gs_integracoes_ac, gs_notas_fiscais, gs_notificacoes, gs_pedidos,
  gs_permissoes, gs_planos, gs_pontos_atendimento, gs_scanner_resultados,
  gs_sessoes, gs_taxas, gs_ticket_respostas, gs_tickets,
  gs_transacoes, gs_unidades, gs_usuarios,
  protocols, rate_limit_buckets, secure_sessions, security_nonces
FROM anon, authenticated;

REVOKE ALL ON ALL SEQUENCES IN SCHEMA public FROM anon, authenticated;
REVOKE ALL ON ALL FUNCTIONS IN SCHEMA public FROM anon, authenticated;

-- ───────────────────────────────────────────────────────────────────────────
-- 2. leads — formulario publico (Landing). Permite SOMENTE INSERT para anon.
-- ───────────────────────────────────────────────────────────────────────────
REVOKE ALL ON TABLE leads FROM anon, authenticated;
GRANT INSERT ON TABLE leads TO anon;

-- ───────────────────────────────────────────────────────────────────────────
-- 3. tickets — Portal (Supabase Auth, papel authenticated).
--    Preserva o comportamento atual do Portal com RLS.
-- ───────────────────────────────────────────────────────────────────────────
REVOKE ALL ON TABLE tickets FROM anon;

-- ───────────────────────────────────────────────────────────────────────────
-- 4. RLS deny-by-default em todas as tabelas public.*
--    (service_role continua acesando via bypass; sem politica = negado)
-- ───────────────────────────────────────────────────────────────────────────
ALTER TABLE agr_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE certificates ENABLE ROW LEVEL SECURITY;
ALTER TABLE fraud_blacklist ENABLE ROW LEVEL SECURITY;
ALTER TABLE gs_agenda ENABLE ROW LEVEL SECURITY;
ALTER TABLE gs_ars ENABLE ROW LEVEL SECURITY;
ALTER TABLE gs_assinaturas ENABLE ROW LEVEL SECURITY;
ALTER TABLE gs_clientes ENABLE ROW LEVEL SECURITY;
ALTER TABLE gs_cobrancas ENABLE ROW LEVEL SECURITY;
ALTER TABLE gs_comissoes ENABLE ROW LEVEL SECURITY;
ALTER TABLE gs_contador_carteira ENABLE ROW LEVEL SECURITY;
ALTER TABLE gs_contadores ENABLE ROW LEVEL SECURITY;
ALTER TABLE gs_faturas ENABLE ROW LEVEL SECURITY;
ALTER TABLE gs_formas_pagamento ENABLE ROW LEVEL SECURITY;
ALTER TABLE gs_gateway_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE gs_integracao_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE gs_integracoes_ac ENABLE ROW LEVEL SECURITY;
ALTER TABLE gs_notas_fiscais ENABLE ROW LEVEL SECURITY;
ALTER TABLE gs_notificacoes ENABLE ROW LEVEL SECURITY;
ALTER TABLE gs_pedidos ENABLE ROW LEVEL SECURITY;
ALTER TABLE gs_permissoes ENABLE ROW LEVEL SECURITY;
ALTER TABLE gs_planos ENABLE ROW LEVEL SECURITY;
ALTER TABLE gs_pontos_atendimento ENABLE ROW LEVEL SECURITY;
ALTER TABLE gs_scanner_resultados ENABLE ROW LEVEL SECURITY;
ALTER TABLE gs_sessoes ENABLE ROW LEVEL SECURITY;
ALTER TABLE gs_taxas ENABLE ROW LEVEL SECURITY;
ALTER TABLE gs_ticket_respostas ENABLE ROW LEVEL SECURITY;
ALTER TABLE gs_tickets ENABLE ROW LEVEL SECURITY;
ALTER TABLE gs_transacoes ENABLE ROW LEVEL SECURITY;
ALTER TABLE gs_unidades ENABLE ROW LEVEL SECURITY;
ALTER TABLE gs_usuarios ENABLE ROW LEVEL SECURITY;
ALTER TABLE protocols ENABLE ROW LEVEL SECURITY;
ALTER TABLE rate_limit_buckets ENABLE ROW LEVEL SECURITY;
ALTER TABLE secure_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE security_nonces ENABLE ROW LEVEL SECURITY;
ALTER TABLE tickets ENABLE ROW LEVEL SECURITY;
ALTER TABLE leads ENABLE ROW LEVEL SECURITY;

-- ───────────────────────────────────────────────────────────────────────────
-- 5. Politicas minimas
-- ───────────────────────────────────────────────────────────────────────────
DROP POLICY IF EXISTS "leads_anon_insert" ON leads;
CREATE POLICY "leads_anon_insert" ON leads
  FOR INSERT TO anon
  WITH CHECK (true);

DROP POLICY IF EXISTS "tickets_authenticated_all" ON tickets;
CREATE POLICY "tickets_authenticated_all" ON tickets
  FOR ALL TO authenticated
  USING (true)
  WITH CHECK (true);

-- ───────────────────────────────────────────────────────────────────────────
-- 6. Default privileges: tabelas novas ja nascem sem acesso a anon/authenticated
-- ───────────────────────────────────────────────────────────────────────────
ALTER DEFAULT PRIVILEGES IN SCHEMA public REVOKE ALL ON TABLES FROM anon, authenticated;
ALTER DEFAULT PRIVILEGES IN SCHEMA public REVOKE ALL ON SEQUENCES FROM anon, authenticated;
ALTER DEFAULT PRIVILEGES IN SCHEMA public REVOKE ALL ON FUNCTIONS FROM anon, authenticated;

COMMIT;

-- ============================================================================
-- REVERSAO (se necessario):
--   GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public
--     TO anon, authenticated;
--   ALTER TABLE ... DISABLE ROW LEVEL SECURITY;   (para cada tabela)
-- ============================================================================