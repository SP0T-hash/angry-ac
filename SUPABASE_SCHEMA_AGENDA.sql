-- ==============================================================================
-- GS VEMAPI — Schema de Agenda, Atendimento e Comissões 📅
-- ==============================================================================

-- ============================================================
-- 1. CAMPOS ADICIONAIS EM gs_clientes
-- ============================================================
ALTER TABLE gs_clientes ADD COLUMN IF NOT EXISTS numero_cliente TEXT;
ALTER TABLE gs_clientes ADD COLUMN IF NOT EXISTS indicacao TEXT;  -- Indicação: como conheceu

-- Índice para busca por número do cliente
CREATE INDEX IF NOT EXISTS idx_clientes_numero ON gs_clientes(ar_id, numero_cliente);

-- Função para gerar número sequencial do cliente
CREATE OR REPLACE FUNCTION gerar_numero_cliente(p_ar_id UUID)
RETURNS TEXT LANGUAGE plpgsql AS $$
DECLARE
  seq INT;
  ano TEXT := to_char(now(), 'YY');
BEGIN
  SELECT COALESCE(MAX(CAST(SPLIT_PART(numero_cliente, '/', 1) AS INT)), 0) + 1
  INTO seq
  FROM gs_clientes
  WHERE ar_id = p_ar_id AND numero_cliente LIKE '%/' || ano;

  RETURN seq || '/' || ano;
END;
$$;

-- Trigger para auto-gerar número do cliente
CREATE OR REPLACE FUNCTION trigger_gerar_numero_cliente()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  IF NEW.numero_cliente IS NULL THEN
    NEW.numero_cliente := gerar_numero_cliente(NEW.ar_id);
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_clientes_numero
  BEFORE INSERT ON gs_clientes
  FOR EACH ROW EXECUTE FUNCTION trigger_gerar_numero_cliente();

-- ============================================================
-- 2. NOVA TABELA: gs_agenda (Agendamento de Atendimentos)
-- ============================================================
CREATE TABLE IF NOT EXISTS gs_agenda (
  id                UUID DEFAULT gen_random_uuid() PRIMARY KEY,

  -- Organização
  ar_id             UUID NOT NULL REFERENCES gs_ars(id),
  unidade_id        UUID REFERENCES gs_unidades(id),
  ponto_id          UUID REFERENCES gs_pontos_atendimento(id),

  -- Cliente
  cliente_id        UUID REFERENCES gs_clientes(id),
  cliente_nome      TEXT NOT NULL,
  cliente_telefone  TEXT,
  cliente_email     TEXT,
  numero_cliente    TEXT,           -- Cópia do número do cliente para fácil consulta

  -- Agendamento
  data              DATE NOT NULL,
  hora_inicio       TIME NOT NULL,
  hora_fim          TIME,           -- Preenchido quando o atendimento termina

  -- Status do atendimento
  status            TEXT NOT NULL DEFAULT 'AGENDADO'
                    CHECK (status IN ('AGENDADO', 'CONFIRMADO', 'ATENDIDO', 'NAO_COMPARECEU',
                                      'REAGENDADO', 'CANCELADO')),

  -- Atendimento
  agente_id         UUID REFERENCES gs_usuarios(id),    -- AGR / funcionário que atendeu
  agente_nome       TEXT,                                -- Cópia do nome para relatórios
  observacoes       TEXT,                                -- Anotações do atendimento
  indicacao         TEXT,                                -- Como o cliente conheceu (cópia)

  -- Serviço
  tipo_servico      TEXT CHECK (tipo_servico IN ('CERTIFICADO', 'RENOVACAO', 'ORCAMENTO',
                                                  'SUPORTE', 'ENTREGA', 'OUTROS')),
  pedido_id         UUID REFERENCES gs_pedidos(id),     -- Pedido gerado no atendimento

  -- Controle do agendamento
  agendado_por      UUID REFERENCES gs_usuarios(id),    -- Quem fez o agendamento
  data_confirmacao  TIMESTAMPTZ,
  data_atendimento  TIMESTAMPTZ,                         -- Quando o status mudou para ATENDIDO
  motivo_cancelamento TEXT,

  created_at        TIMESTAMPTZ DEFAULT now(),
  updated_at        TIMESTAMPTZ DEFAULT now()
);

-- ============================================================
-- 3. NOVA TABELA: gs_comissoes (Comissões por Atendimento)
-- ============================================================
CREATE TABLE IF NOT EXISTS gs_comissoes (
  id                UUID DEFAULT gen_random_uuid() PRIMARY KEY,

  -- Quem recebe
  agente_id         UUID NOT NULL REFERENCES gs_usuarios(id),
  ar_id             UUID NOT NULL REFERENCES gs_ars(id),

  -- O que gerou a comissão
  agenda_id         UUID REFERENCES gs_agenda(id),
  pedido_id         UUID REFERENCES gs_pedidos(id),

  -- Valores
  tipo              TEXT NOT NULL CHECK (tipo IN ('ATENDIMENTO', 'VENDA', 'COMISSAO_CERT')),
  valor_bruto       INT NOT NULL DEFAULT 0,               -- Em centavos
  percentual        NUMERIC(5,2) DEFAULT 0,               -- % aplicada
  valor_comissao    INT NOT NULL DEFAULT 0,               -- Valor da comissão em centavos

  -- Status
  status            TEXT NOT NULL DEFAULT 'PENDENTE'
                    CHECK (status IN ('PENDENTE', 'PAGA', 'CANCELADA')),

  -- Período de referência
  mes_referencia    TEXT NOT NULL,                         -- '2026-07'
  data_pagamento    TIMESTAMPTZ,

  created_at        TIMESTAMPTZ DEFAULT now(),
  updated_at        TIMESTAMPTZ DEFAULT now()
);

-- ============================================================
-- 4. ÍNDICES
-- ============================================================
CREATE INDEX IF NOT EXISTS idx_agenda_data        ON gs_agenda(ar_id, data);
CREATE INDEX IF NOT EXISTS idx_agenda_status      ON gs_agenda(status);
CREATE INDEX IF NOT EXISTS idx_agenda_agente      ON gs_agenda(agente_id);
CREATE INDEX IF NOT EXISTS idx_agenda_cliente     ON gs_agenda(cliente_id);
CREATE INDEX IF NOT EXISTS idx_agenda_unidade     ON gs_agenda(unidade_id);

CREATE INDEX IF NOT EXISTS idx_comissoes_agente   ON gs_comissoes(agente_id, mes_referencia);
CREATE INDEX IF NOT EXISTS idx_comissoes_status   ON gs_comissoes(status);
CREATE INDEX IF NOT EXISTS idx_comissoes_mes      ON gs_comissoes(ar_id, mes_referencia);

-- ============================================================
-- 5. TRIGGER: auto-update updated_at
-- ============================================================
CREATE TRIGGER trg_agenda_updated_at
  BEFORE UPDATE ON gs_agenda FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TRIGGER trg_comissoes_updated_at
  BEFORE UPDATE ON gs_comissoes FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- ============================================================
-- 6. RLS
-- ============================================================
ALTER TABLE gs_agenda     ENABLE ROW LEVEL SECURITY;
ALTER TABLE gs_comissoes  ENABLE ROW LEVEL SECURITY;

-- ============================================================
-- 7. FUNÇÃO: Calcular comissão do agente
-- ============================================================
CREATE OR REPLACE FUNCTION calcular_comissao_atendimento(
  p_agenda_id UUID,
  p_percentual NUMERIC DEFAULT 10.0
)
RETURNS UUID LANGUAGE plpgsql AS $$
DECLARE
  v_agenda RECORD;
  v_comissao_id UUID;
  v_valor_comissao INT;
BEGIN
  -- Busca dados do agendamento
  SELECT * INTO v_agenda FROM gs_agenda WHERE id = p_agenda_id;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Agendamento não encontrado';
  END IF;

  IF v_agenda.status != 'ATENDIDO' THEN
    RAISE EXCEPTION 'Agendamento precisa estar como ATENDIDO';
  END IF;

  -- Valor base: R$ 10,00 por atendimento (configurável)
  v_valor_comissao := ROUND(1000 * (p_percentual / 100));  -- 10% de R$10 = R$1 = 100 centavos

  -- Cria registro de comissão
  INSERT INTO gs_comissoes (
    agente_id, ar_id, agenda_id, tipo,
    valor_bruto, percentual, valor_comissao,
    status, mes_referencia
  ) VALUES (
    v_agenda.agente_id, v_agenda.ar_id, p_agenda_id, 'ATENDIMENTO',
    1000, p_percentual, v_valor_comissao,
    'PENDENTE', to_char(now(), 'YYYY-MM')
  ) RETURNING id INTO v_comissao_id;

  RETURN v_comissao_id;
END;
$$;
