-- Migration: contabilidades (perfis de contador + cobrança por contador).
-- Para bancos existentes (SUPABASE_SCHEMA_BILLING.sql já inclui nas instalações novas).

ALTER TABLE gs_contadores
  ADD COLUMN IF NOT EXISTS usuario_id UUID REFERENCES gs_usuarios(id),
  ADD COLUMN IF NOT EXISTS telefone TEXT,
  ADD COLUMN IF NOT EXISTS valor_custo_cert NUMERIC(10,2);

ALTER TABLE gs_cobrancas
  ADD COLUMN IF NOT EXISTS ar_id UUID REFERENCES gs_ars(id),
  ADD COLUMN IF NOT EXISTS contador_id UUID REFERENCES gs_usuarios(id);
