-- Migration: formas de pagamento por AR (ou globais) no GS.
-- Aplicar em bancos existentes (SUPABASE_SCHEMA_BILLING.sql já inclui a tabela
-- para instalações novas).
CREATE TABLE IF NOT EXISTS gs_formas_pagamento (
  id              UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  ar_id           UUID REFERENCES gs_ars(id) ON DELETE CASCADE,
  tipo            TEXT NOT NULL CHECK (tipo IN ('PIX', 'CARTAO', 'BOLETO')),
  descricao       TEXT,
  ativo           BOOLEAN DEFAULT true,
  ordem           INT DEFAULT 0,
  config          JSONB DEFAULT '{}',
  created_at      TIMESTAMPTZ DEFAULT now(),
  updated_at      TIMESTAMPTZ DEFAULT now()
);

-- Seed: formas globais padrão (PIX, Cartão, Boleto).
INSERT INTO gs_formas_pagamento (tipo, descricao, ativo, ordem)
SELECT 'PIX', 'Pix', true, 1 WHERE NOT EXISTS (SELECT 1 FROM gs_formas_pagamento WHERE tipo = 'PIX' AND ar_id IS NULL);
INSERT INTO gs_formas_pagamento (tipo, descricao, ativo, ordem)
SELECT 'CARTAO', 'Cartão de crédito', true, 2 WHERE NOT EXISTS (SELECT 1 FROM gs_formas_pagamento WHERE tipo = 'CARTAO' AND ar_id IS NULL);
INSERT INTO gs_formas_pagamento (tipo, descricao, ativo, ordem)
SELECT 'BOLETO', 'Boleto bancário', true, 3 WHERE NOT EXISTS (SELECT 1 FROM gs_formas_pagamento WHERE tipo = 'BOLETO' AND ar_id IS NULL);
