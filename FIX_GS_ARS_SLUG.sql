-- Migration: adiciona slug público à gs_ars (white-label por AR).
-- Aplicar em bancos já existentes (o SUPABASE_SCHEMA_GS.sql já inclui a coluna
-- para instalações novas).
ALTER TABLE gs_ars ADD COLUMN IF NOT EXISTS slug TEXT UNIQUE;

-- Preenche slugs a partir do nome para ARs existentes (idempotente).
UPDATE gs_ars
SET slug = lower(regexp_replace(nome, '[^a-zA-Z0-9]+', '-', 'g'))
WHERE slug IS NULL AND nome IS NOT NULL;

-- Garante unicidade de slugs gerados (colisões viram <slug>-<id curto>).
UPDATE gs_ars
SET slug = slug || '-' || substring(id::text, 1, 4)
WHERE id IN (
  SELECT id FROM (
    SELECT id, row_number() OVER (PARTITION BY slug ORDER BY created_at) AS rn
    FROM gs_ars
  ) t WHERE rn > 1
);
