-- ==============================================================================
-- GS BILLING — Schema de Faturamento e Pagamentos 💰
--
-- Modelo Híbrido: Mensalidade + Taxa por certificado
-- Gateway: Asaas (Pix, Boleto, Cartão)
-- Split automático entre GS + AR + AC
-- ==============================================================================

-- ============================================================
-- 1. PLANOS (Nossos planos de assinatura)
-- ============================================================
CREATE TABLE IF NOT EXISTS gs_planos (
  id              UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  nome            TEXT NOT NULL,
  slug            TEXT NOT NULL UNIQUE,
  descricao       TEXT,
  publico_alvo    TEXT NOT NULL CHECK (publico_alvo IN ('AC', 'AR', 'UNIDADE', 'CONTADOR')),
  nivel           TEXT NOT NULL CHECK (nivel IN ('BASICO', 'PROFISSIONAL', 'ENTERPRISE')),

  -- Preços
  valor_mensal    NUMERIC(10,2) NOT NULL,       -- Mensalidade fixa
  taxa_por_cert   NUMERIC(10,2) DEFAULT 0,      -- Taxa adicional por certificado
  limite_certs    INT DEFAULT 0,                 -- 0 = ilimitado

  -- Funcionalidades incluídas
  max_usuarios    INT DEFAULT 2,
  max_unidades    INT DEFAULT 1,
  max_clientes    INT DEFAULT 0,                 -- 0 = ilimitado
  integracoes     TEXT[] DEFAULT '{}',           -- Integrações habilitadas
  suporte_tipo    TEXT DEFAULT 'EMAIL' CHECK (suporte_tipo IN ('EMAIL', 'CHAT', 'PRIORITARIO', 'CONCIERGE')),

  -- Recursos (feature flags)
  recursos        JSONB DEFAULT '{}',            -- Ex: {"relatorios": true, "api": true, "nf": false}

  -- Status
  is_active       BOOLEAN DEFAULT true,
  ordem           INT DEFAULT 0,                 -- Ordem de exibição
  created_at      TIMESTAMPTZ DEFAULT now(),
  updated_at      TIMESTAMPTZ DEFAULT now()
);

-- ============================================================
-- 2. ASSINATURAS (ARs/ACs/Contadores assinando nosso sistema)
-- ============================================================
CREATE TABLE IF NOT EXISTS gs_assinaturas (
  id                UUID DEFAULT gen_random_uuid() PRIMARY KEY,

  -- Quem está assinando
  ar_id             UUID REFERENCES gs_ars(id),
  contador_id       UUID REFERENCES gs_contadores(id),
  entidade_tipo     TEXT NOT NULL CHECK (entidade_tipo IN ('AR', 'AC', 'CONTADOR')),

  -- Plano
  plano_id          UUID NOT NULL REFERENCES gs_planos(id),
  status            TEXT NOT NULL DEFAULT 'ATIVA'
                    CHECK (status IN ('ATIVA', 'CANCELADA', 'EXPIRADA', 'TRIAL', 'BLOQUEADA')),

  -- Asaas subscription
  asaas_subscription_id TEXT,                    -- ID da assinatura no Asaas
  asaas_customer_id     TEXT,                    -- ID do cliente no Asaas

  -- Ciclo de faturamento
  data_inicio       TIMESTAMPTZ NOT NULL DEFAULT now(),
  data_proximo_ciclo TIMESTAMPTZ,
  data_cancelamento TIMESTAMPTZ,
  ciclo_tipo        TEXT NOT NULL DEFAULT 'MENSAL' CHECK (ciclo_tipo IN ('MENSAL', 'TRIMESTRAL', 'ANUAL')),
  trial_ate         TIMESTAMPTZ,                 -- Se trial, quando expira

  -- Consumo (taxa por certificado)
  certs_no_ciclo    INT DEFAULT 0,               -- Certificados emitidos no ciclo atual
  certs_faturados   INT DEFAULT 0,               -- Certificados já faturados
  excedente         NUMERIC(10,2) DEFAULT 0,     -- Valor excedente calculado

  -- Financeiro
  valor_mensal_cobrado NUMERIC(10,2),            -- Valor real cobrado (pode ter desconto)
  split_percent_gs     NUMERIC(5,2) DEFAULT 70,  -- % que fica com o GS
  split_percent_ar     NUMERIC(5,2) DEFAULT 30,  -- % que vai para o AR/AC

  -- Próximo passo: bloquear se não pagar
  dias_vencimento   INT DEFAULT 5,
  created_at        TIMESTAMPTZ DEFAULT now(),
  updated_at        TIMESTAMPTZ DEFAULT now()
);

-- ============================================================
-- 3. COBRANÇAS (Faturas que emitimos para ARs/ACs/Contadores)
-- ============================================================
CREATE TABLE IF NOT EXISTS gs_cobrancas (
  id                UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  assinatura_id     UUID NOT NULL REFERENCES gs_assinaturas(id),

  -- Identificação
  numero            TEXT NOT NULL UNIQUE,          -- Fatura-2026-0001
  descricao         TEXT,                          -- "Mensalidade Jul/2026 + 15 certificados excedentes"

  -- Valores
  valor_mensalidade NUMERIC(10,2) NOT NULL DEFAULT 0,
  valor_excedente   NUMERIC(10,2) NOT NULL DEFAULT 0,
  valor_total       NUMERIC(10,2) NOT NULL,
  taxa_gateway      NUMERIC(10,2) DEFAULT 0,      -- Taxa do Asaas

  -- Período
  periodo_ref       TEXT NOT NULL,                  -- "2026-07"
  data_vencimento   DATE NOT NULL,
  data_pagamento    TIMESTAMPTZ,

  -- Status
  status            TEXT NOT NULL DEFAULT 'PENDENTE'
                    CHECK (status IN ('PENDENTE', 'VENCIDA', 'PAGA', 'CANCELADA', 'REEMBOLSADA', 'PARCIAL')),

  -- Asaas
  asaas_payment_id  TEXT,                          -- ID da cobrança no Asaas
  asaas_invoice_url TEXT,                          -- Link do boleto/pix
  asaas_pix_code    TEXT,                          -- Código Pix copia e cola
  asaas_bank_slip_url TEXT,                        -- URL do boleto

  -- Split
  repasse_gs        NUMERIC(10,2) DEFAULT 0,      -- Quanto ficou para o GS
  repasse_ar        NUMERIC(10,2) DEFAULT 0,      -- Quanto foi para o AR

  -- Auditoria
  pago_por          TEXT,                          -- 'PIX', 'BOLETO', 'CARTAO'
  conciliado        BOOLEAN DEFAULT false,
  created_at        TIMESTAMPTZ DEFAULT now(),
  updated_at        TIMESTAMPTZ DEFAULT now()
);

-- ============================================================
-- 4. FATURAS (ARs emitem para os CLIENTES finais)
-- ============================================================
CREATE TABLE IF NOT EXISTS gs_faturas (
  id                UUID DEFAULT gen_random_uuid() PRIMARY KEY,

  -- Quem está cobrando
  ar_id             UUID REFERENCES gs_ars(id),
  unidade_id        UUID REFERENCES gs_unidades(id),
  usuario_id        UUID REFERENCES gs_usuarios(id),  -- Quem emitiu

  -- Cliente final
  cliente_id        UUID REFERENCES gs_clientes(id),
  cliente_nome      TEXT NOT NULL,
  cliente_documento TEXT NOT NULL,                    -- CPF/CNPJ
  cliente_email     TEXT,
  cliente_telefone  TEXT,

  -- Pedido relacionado
  pedido_id         UUID REFERENCES gs_pedidos(id),

  -- Valores
  valor_original    NUMERIC(10,2) NOT NULL,          -- Valor do certificado
  valor_desconto    NUMERIC(10,2) DEFAULT 0,
  valor_total       NUMERIC(10,2) NOT NULL,          -- Valor cobrado do cliente
  taxa_gateway      NUMERIC(10,2) DEFAULT 0,

  -- Descrição
  descricao         TEXT,                            -- "Certificado PF A3 - 3 anos - Maria Silva"
  tipo_cobranca     TEXT NOT NULL DEFAULT 'UNICA'
                    CHECK (tipo_cobranca IN ('UNICA', 'RECORRENTE', 'PARCELAMENTO')),
  parcelas          INT DEFAULT 1,

  -- Datas
  data_emissao      TIMESTAMPTZ NOT NULL DEFAULT now(),
  data_vencimento   DATE NOT NULL,
  data_pagamento    TIMESTAMPTZ,

  -- Status
  status            TEXT NOT NULL DEFAULT 'PENDENTE'
                    CHECK (status IN ('PENDENTE', 'VENCIDA', 'PAGA', 'CANCELADA', 'REEMBOLSADA', 'PARCIAL')),

  -- Meio de pagamento escolhido pelo cliente
  meio_pagamento    TEXT CHECK (meio_pagamento IN ('PIX', 'BOLETO', 'CARTAO', 'TRANSFERENCIA')),

  -- Asaas
  asaas_payment_id    TEXT,
  asaas_invoice_url   TEXT,                           -- Link de pagamento (Pix/Boleto/Cartão)
  asaas_pix_code      TEXT,
  asaas_bank_slip_url TEXT,
  asaas_card_url      TEXT,                           -- Link para pagamento com cartão

  -- Split automático (Asaas split)
  split_gs            NUMERIC(10,2) DEFAULT 0,        -- % vai para o GS (taxa de plataforma)
  split_ar            NUMERIC(10,2) DEFAULT 0,        -- % vai para o AR
  split_ac            NUMERIC(10,2) DEFAULT 0,        -- % vai para a AC (se aplicável)

  -- Conciliação
  conciliado          BOOLEAN DEFAULT false,
  data_conciliacao    TIMESTAMPTZ,

  created_at          TIMESTAMPTZ DEFAULT now(),
  updated_at          TIMESTAMPTZ DEFAULT now()
);

-- ============================================================
-- 5. TRANSACOES (Livro-razão financeiro)
-- ============================================================
CREATE TABLE IF NOT EXISTS gs_transacoes (
  id                UUID DEFAULT gen_random_uuid() PRIMARY KEY,

  -- Classificação
  tipo              TEXT NOT NULL CHECK (tipo IN (
                      'RECEITA_MENSALIDADE', 'RECEITA_TAXA_CERT', 'RECEITA_REPASSE',
                      'RECEITA_CLIENTE', 'DESPESA_GATEWAY', 'DESPESA_REPASSE',
                      'ESTORNO', 'REEMBOLSO', 'TAXA_ADMINISTRATIVA'
                    )),
  descricao         TEXT NOT NULL,

  -- Valores
  valor_bruto       NUMERIC(10,2) NOT NULL,
  valor_liquido     NUMERIC(10,2) NOT NULL,
  valor_taxa        NUMERIC(10,2) DEFAULT 0,

  -- Referências
  cobranca_id       UUID REFERENCES gs_cobrancas(id),
  fatura_id         UUID REFERENCES gs_faturas(id),
  assinatura_id     UUID REFERENCES gs_assinaturas(id),
  pedido_id         UUID REFERENCES gs_pedidos(id),
  ar_id             UUID REFERENCES gs_ars(id),

  -- Asaas
  asaas_transaction_id TEXT,
  asaas_fee             NUMERIC(10,2),                 -- Taxa cobrada pelo Asaas

  -- Conciliação
  conciliado        BOOLEAN DEFAULT false,
  data_conciliacao  TIMESTAMPTZ,

  created_at        TIMESTAMPTZ DEFAULT now()
);

-- ============================================================
-- 6. GATEWAY LOGS (Integração Asaas)
-- ============================================================
CREATE TABLE IF NOT EXISTS gs_gateway_logs (
  id                UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  evento            TEXT NOT NULL,                     -- 'PAYMENT_CREATED', 'PAYMENT_RECEIVED', etc.
  acao              TEXT NOT NULL,                     -- 'CRIAR_COBRANCA', 'WEBHOOK_RECEIVED'
  request_body      JSONB,
  response_body     JSONB,
  status_code       INT,
  sucesso           BOOLEAN DEFAULT false,

  -- Referência
  fatura_id         UUID REFERENCES gs_faturas(id),
  cobranca_id       UUID REFERENCES gs_cobrancas(id),
  asaas_payment_id  TEXT,
  asaas_event_id    TEXT,

  created_at        TIMESTAMPTZ DEFAULT now()
);

-- ============================================================
-- 7. TAXAS CONFIGURÁVEIS (Por AR, por produto)
-- ============================================================
CREATE TABLE IF NOT EXISTS gs_taxas (
  id                UUID DEFAULT gen_random_uuid() PRIMARY KEY,

  ar_id             UUID REFERENCES gs_ars(id),
  produto_tipo      TEXT NOT NULL,                     -- 'PF_A3', 'PJ_A1', etc.
  valor_repasse     NUMERIC(10,2) NOT NULL,           -- Quanto o AR cobra do cliente
  valor_custo       NUMERIC(10,2) NOT NULL,           -- Custo da AC para o AR
  taxa_gs           NUMERIC(10,2) DEFAULT 0,           -- Taxa que o GS ganha nesse produto

  is_active         BOOLEAN DEFAULT true,
  created_at        TIMESTAMPTZ DEFAULT now(),
  updated_at        TIMESTAMPTZ DEFAULT now(),

  UNIQUE (ar_id, produto_tipo)
);

-- ============================================================
-- ÍNDICES
-- ============================================================
CREATE INDEX IF NOT EXISTS idx_assinaturas_ar ON gs_assinaturas(ar_id);
CREATE INDEX IF NOT EXISTS idx_assinaturas_status ON gs_assinaturas(status);
CREATE INDEX IF NOT EXISTS idx_cobrancas_assinatura ON gs_cobrancas(assinatura_id);
CREATE INDEX IF NOT EXISTS idx_cobrancas_status ON gs_cobrancas(status);
CREATE INDEX IF NOT EXISTS idx_faturas_ar ON gs_faturas(ar_id);
CREATE INDEX IF NOT EXISTS idx_faturas_cliente ON gs_faturas(cliente_id);
CREATE INDEX IF NOT EXISTS idx_faturas_status ON gs_faturas(status);
CREATE INDEX IF NOT EXISTS idx_faturas_pedido ON gs_faturas(pedido_id);
CREATE INDEX IF NOT EXISTS idx_transacoes_ar ON gs_transacoes(ar_id);
CREATE INDEX IF NOT EXISTS idx_transacoes_tipo ON gs_transacoes(tipo);
CREATE INDEX IF NOT EXISTS idx_transacoes_conciliado ON gs_transacoes(conciliado);
CREATE INDEX IF NOT EXISTS idx_gateway_logs_asaas_id ON gs_gateway_logs(asaas_payment_id);
CREATE INDEX IF NOT EXISTS idx_taxas_ar_produto ON gs_taxas(ar_id, produto_tipo);

-- ============================================================
-- RLS
-- ============================================================
ALTER TABLE gs_planos        ENABLE ROW LEVEL SECURITY;
ALTER TABLE gs_assinaturas   ENABLE ROW LEVEL SECURITY;
ALTER TABLE gs_cobrancas     ENABLE ROW LEVEL SECURITY;
ALTER TABLE gs_faturas       ENABLE ROW LEVEL SECURITY;
ALTER TABLE gs_transacoes    ENABLE ROW LEVEL SECURITY;
ALTER TABLE gs_gateway_logs  ENABLE ROW LEVEL SECURITY;
ALTER TABLE gs_taxas         ENABLE ROW LEVEL SECURITY;

-- ============================================================
-- TRIGGER: auto-update updated_at
-- ============================================================
CREATE TRIGGER trg_gs_planos_updated_at
  BEFORE UPDATE ON gs_planos FOR EACH ROW EXECUTE FUNCTION set_updated_at();
CREATE TRIGGER trg_gs_assinaturas_updated_at
  BEFORE UPDATE ON gs_assinaturas FOR EACH ROW EXECUTE FUNCTION set_updated_at();
CREATE TRIGGER trg_gs_cobrancas_updated_at
  BEFORE UPDATE ON gs_cobrancas FOR EACH ROW EXECUTE FUNCTION set_updated_at();
CREATE TRIGGER trg_gs_faturas_updated_at
  BEFORE UPDATE ON gs_faturas FOR EACH ROW EXECUTE FUNCTION set_updated_at();
CREATE TRIGGER trg_gs_taxas_updated_at
  BEFORE UPDATE ON gs_taxas FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- ============================================================
-- FUNÇÃO: Gerar número sequencial de cobrança
-- ============================================================
CREATE OR REPLACE FUNCTION gerar_numero_cobranca()
RETURNS TEXT LANGUAGE plpgsql AS $$
DECLARE
  ano TEXT := to_char(now(), 'YYYY');
  seq INT;
BEGIN
  SELECT COALESCE(MAX(CAST(SPLIT_PART(numero, '-', 3) AS INT)), 0) + 1
  INTO seq
  FROM gs_cobrancas
  WHERE numero LIKE 'FAT-' || ano || '-%';

  RETURN 'FAT-' || ano || '-' || LPAD(seq::TEXT, 4, '0');
END;
$$;

-- ============================================================
-- DADOS INICIAIS: Planos
-- ============================================================
INSERT INTO gs_planos (nome, slug, descricao, publico_alvo, nivel, valor_mensal, taxa_por_cert, limite_certs, max_usuarios, max_unidades, integracoes, suporte_tipo, recursos, ordem) VALUES
('AR Básico',   'ar-basico',       'Para ARs em início de operação',         'AR',       'BASICO',      97,  0.50, 100,  2, 1,  '{angry}', 'EMAIL', '{"relatorios": false, "api": false, "nf": false, "contador": false}', 1),
('AR Profissional', 'ar-profissional', 'Para ARs com volume médio',          'AR',       'PROFISSIONAL',197, 0.30, 500,  5, 3,  '{angry, safeweb}', 'CHAT', '{"relatorios": true, "api": true, "nf": true, "contador": false}', 2),
('AR Enterprise', 'ar-enterprise', 'Para ARs de alto volume',               'AR',       'ENTERPRISE',  397, 0.15, 0,   15, 10, '{angry, safeweb, valid, certisign}', 'PRIORITARIO', '{"relatorios": true, "api": true, "nf": true, "contador": true}', 3),
('AC Básico',    'ac-basico',      'Integração com até 2 ARs',               'AC',       'BASICO',      297, 0.00, 0,   3,  0,  '{angry}', 'EMAIL', '{"relatorios": false, "api": false}', 4),
('AC Profissional', 'ac-profissional', 'Integração ilimitada de ARs',        'AC',       'PROFISSIONAL',597, 0.00, 0,   10, 0,  '{angry, safeweb, valid}', 'PRIORITARIO', '{"relatorios": true, "api": true, "nf": true}', 5),
('Contador Básico', 'contador-basico', 'Gestão de carteira de clientes',     'CONTADOR', 'BASICO',      47,  0.00, 0,   1,  0,  '{}', 'EMAIL', '{"carteira": true, "scanner": true, "nf": false}', 6),
('Contador Profissional', 'contador-profissional', 'Carteira + NF + Relatórios', 'CONTADOR', 'PROFISSIONAL', 97, 0.00, 0, 3, 0, '{}', 'CHAT', '{"carteira": true, "scanner": true, "nf": true, "relatorios": true}', 7)
ON CONFLICT (slug) DO NOTHING;

-- ============================================================
-- TABELA: gs_contadores (corrige FK órfã em gs_assinaturas.contador_id)
-- ============================================================
CREATE TABLE IF NOT EXISTS gs_contadores (
  id            UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  nome          TEXT NOT NULL,
  email         TEXT,
  ar_id         UUID REFERENCES gs_ars(id),
  ativo         BOOLEAN DEFAULT true,
  criado_em     TIMESTAMPTZ DEFAULT now()
);
