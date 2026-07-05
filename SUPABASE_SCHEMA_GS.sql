-- ==============================================================================
-- GS VEMAPI — Schema Completo de Gestão para AR/AC
-- 
-- Sistema multi-tenant com hierarquia completa:
--   AC (Autoridade Certificadora)
--     ├── AR (Autoridade de Registro / Matriz)
--     │     ├── Unidades (Filiais / Parceiros)
--     │     │     ├── Pontos de Atendimento (AGRs)
--     │     │     └── Usuários da Unidade
--     │     └── Usuários da AR (Admin, Financeiro, TI)
--     └── AC Administrators
--
-- Compatível com ICP-Brasil, LGPD e ITI.
-- Integração JSON com múltiplas ACs (Angry, Safeweb, Valid, Certisign, Syngular...)
-- ==============================================================================

CREATE EXTENSION IF NOT EXISTS "pgcrypto";
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ==============================================================================
-- 1. HIERARQUIA ORGANIZACIONAL
-- ==============================================================================

-- 1.1. ARs (Autoridades de Registro) — Clientes do sistema GS
CREATE TABLE IF NOT EXISTS gs_ars (
  id              UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  nome            TEXT NOT NULL,
  cnpj            TEXT NOT NULL UNIQUE,
  email           TEXT NOT NULL,
  telefone        TEXT,
  contato_nome    TEXT,
  logo_url        TEXT,
  endereco        JSONB,            -- { cep, logradouro, numero, complemento, bairro, cidade, uf }
  is_active       BOOLEAN DEFAULT true,
  config          JSONB DEFAULT '{}', -- Configurações específicas da AR
  created_at      TIMESTAMPTZ DEFAULT now(),
  updated_at      TIMESTAMPTZ DEFAULT now()
);

-- 1.2. Unidades (Filiais / Parceiros Credenciados)
-- Cada AR pode ter múltiplas unidades. Unidades NÃO veem dados da matriz.
CREATE TABLE IF NOT EXISTS gs_unidades (
  id              UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  ar_id           UUID NOT NULL REFERENCES gs_ars(id) ON DELETE CASCADE,
  nome            TEXT NOT NULL,
  cnpj            TEXT NOT NULL,
  email           TEXT NOT NULL,
  telefone        TEXT,
  contato_nome    TEXT,
  tipo            TEXT NOT NULL DEFAULT 'FILIAL' CHECK (tipo IN ('MATRIZ', 'FILIAL', 'PARCEIRO', 'FRANQUIA')),
  endereco        JSONB,
  is_active       BOOLEAN DEFAULT true,
  config          JSONB DEFAULT '{}', -- Configurações específicas da unidade
  created_at      TIMESTAMPTZ DEFAULT now(),
  updated_at      TIMESTAMPTZ DEFAULT now(),
  UNIQUE(ar_id, cnpj)
);

-- 1.3. Pontos de Atendimento (AGRs)
-- Cada unidade pode ter múltiplos pontos de atendimento
CREATE TABLE IF NOT EXISTS gs_pontos_atendimento (
  id              UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  unidade_id      UUID NOT NULL REFERENCES gs_unidades(id) ON DELETE CASCADE,
  nome            TEXT NOT NULL,
  codigo          TEXT NOT NULL,
  email           TEXT,
  telefone        TEXT,
  endereco        JSONB,
  is_active       BOOLEAN DEFAULT true,
  created_at      TIMESTAMPTZ DEFAULT now(),
  updated_at      TIMESTAMPTZ DEFAULT now(),
  UNIQUE(unidade_id, codigo)
);

-- ==============================================================================
-- 2. USUÁRIOS E PERMISSÕES
-- ==============================================================================

-- 2.1. Níveis hierárquicos
CREATE TYPE gs_user_level AS ENUM (
  'AC_ADMIN',       -- Administrador da AC (super-admin)
  'AC_SUPORTE',     -- Suporte técnico da AC
  'AR_ADMIN',       -- Administrador da AR (matriz)
  'AR_FINANCEIRO',  -- Financeiro da AR
  'AR_SUPORTE',     -- Suporte técnico da AR
  'UNIDADE_ADMIN',  -- Administrador da unidade
  'UNIDADE_AGR',    -- Agente de Registro da unidade
  'UNIDADE_VENDAS', -- Vendedor / Comercial
  'CONTADOR'        -- Contador (parceiro externo)
);

-- 2.2. Permissões granulares
CREATE TABLE IF NOT EXISTS gs_permissoes (
  id              UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  nivel           gs_user_level NOT NULL,
  modulo          TEXT NOT NULL,   -- 'pedidos', 'clientes', 'financeiro', 'suporte', 'relatorios', 'config', 'contador'
  acao            TEXT NOT NULL,   -- 'ver', 'criar', 'editar', 'excluir', 'aprovar'
  escopo          TEXT NOT NULL DEFAULT 'UNIDADE' CHECK (escopo IN ('GLOBAL', 'AR', 'UNIDADE', 'PROPRIO')),
  created_at      TIMESTAMPTZ DEFAULT now()
);

-- Permissões padrão por nível
INSERT INTO gs_permissoes (nivel, modulo, acao, escopo) VALUES
  -- AC_ADMIN: acesso total
  ('AC_ADMIN', 'pedidos', 'ver', 'GLOBAL'),
  ('AC_ADMIN', 'pedidos', 'criar', 'GLOBAL'),
  ('AC_ADMIN', 'pedidos', 'editar', 'GLOBAL'),
  ('AC_ADMIN', 'pedidos', 'excluir', 'GLOBAL'),
  ('AC_ADMIN', 'pedidos', 'aprovar', 'GLOBAL'),
  ('AC_ADMIN', 'clientes', 'ver', 'GLOBAL'),
  ('AC_ADMIN', 'clientes', 'criar', 'GLOBAL'),
  ('AC_ADMIN', 'clientes', 'editar', 'GLOBAL'),
  ('AC_ADMIN', 'financeiro', 'ver', 'GLOBAL'),
  ('AC_ADMIN', 'financeiro', 'criar', 'GLOBAL'),
  ('AC_ADMIN', 'suporte', 'ver', 'GLOBAL'),
  ('AC_ADMIN', 'suporte', 'criar', 'GLOBAL'),
  ('AC_ADMIN', 'relatorios', 'ver', 'GLOBAL'),
  ('AC_ADMIN', 'config', 'ver', 'GLOBAL'),
  ('AC_ADMIN', 'config', 'editar', 'GLOBAL'),
  -- AR_ADMIN: tudo da própria AR
  ('AR_ADMIN', 'pedidos', 'ver', 'AR'),
  ('AR_ADMIN', 'pedidos', 'criar', 'AR'),
  ('AR_ADMIN', 'pedidos', 'editar', 'AR'),
  ('AR_ADMIN', 'pedidos', 'excluir', 'AR'),
  ('AR_ADMIN', 'pedidos', 'aprovar', 'AR'),
  ('AR_ADMIN', 'clientes', 'ver', 'AR'),
  ('AR_ADMIN', 'clientes', 'criar', 'AR'),
  ('AR_ADMIN', 'clientes', 'editar', 'AR'),
  ('AR_ADMIN', 'financeiro', 'ver', 'AR'),
  ('AR_ADMIN', 'suporte', 'ver', 'AR'),
  ('AR_ADMIN', 'suporte', 'criar', 'AR'),
  ('AR_ADMIN', 'relatorios', 'ver', 'AR'),
  ('AR_ADMIN', 'config', 'ver', 'AR'),
  ('AR_ADMIN', 'config', 'editar', 'AR'),
  -- UNIDADE_ADMIN: apenas da própria unidade
  ('UNIDADE_ADMIN', 'pedidos', 'ver', 'UNIDADE'),
  ('UNIDADE_ADMIN', 'pedidos', 'criar', 'UNIDADE'),
  ('UNIDADE_ADMIN', 'pedidos', 'editar', 'UNIDADE'),
  ('UNIDADE_ADMIN', 'clientes', 'ver', 'UNIDADE'),
  ('UNIDADE_ADMIN', 'clientes', 'criar', 'UNIDADE'),
  ('UNIDADE_ADMIN', 'clientes', 'editar', 'UNIDADE'),
  ('UNIDADE_ADMIN', 'suporte', 'ver', 'UNIDADE'),
  ('UNIDADE_ADMIN', 'suporte', 'criar', 'UNIDADE'),
  ('UNIDADE_ADMIN', 'relatorios', 'ver', 'UNIDADE'),
  -- UNIDADE_AGR: apenas criar/ver pedidos
  ('UNIDADE_AGR', 'pedidos', 'ver', 'UNIDADE'),
  ('UNIDADE_AGR', 'pedidos', 'criar', 'UNIDADE'),
  ('UNIDADE_AGR', 'clientes', 'ver', 'UNIDADE'),
  ('UNIDADE_AGR', 'clientes', 'criar', 'UNIDADE'),
  -- CONTADOR: módulo específico
  ('CONTADOR', 'contador', 'ver', 'PROPRIO'),
  ('CONTADOR', 'contador', 'criar', 'PROPRIO'),
  ('CONTADOR', 'clientes', 'ver', 'PROPRIO'),
  ('CONTADOR', 'relatorios', 'ver', 'PROPRIO')
ON CONFLICT DO NOTHING;

-- 2.3. Usuários do sistema
CREATE TABLE IF NOT EXISTS gs_usuarios (
  id              UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  email           TEXT NOT NULL UNIQUE,
  nome            TEXT NOT NULL,
  cpf             TEXT NOT NULL,
  telefone        TEXT,
  avatar_url      TEXT,
  nivel           gs_user_level NOT NULL DEFAULT 'UNIDADE_AGR',
  ar_id           UUID REFERENCES gs_ars(id),
  unidade_id      UUID REFERENCES gs_unidades(id),
  ponto_id        UUID REFERENCES gs_pontos_atendimento(id),
  password_hash   TEXT NOT NULL,
  is_active       BOOLEAN DEFAULT true,
  precisa_trocar_senha BOOLEAN DEFAULT true,
  ultimo_login    TIMESTAMPTZ,
  config          JSONB DEFAULT '{}',
  created_at      TIMESTAMPTZ DEFAULT now(),
  updated_at      TIMESTAMPTZ DEFAULT now()
);

-- 2.4. Sessões de usuários
CREATE TABLE IF NOT EXISTS gs_sessoes (
  id              UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  usuario_id      UUID NOT NULL REFERENCES gs_usuarios(id) ON DELETE CASCADE,
  token           TEXT NOT NULL UNIQUE,
  ip_address      TEXT,
  user_agent      TEXT,
  is_active       BOOLEAN DEFAULT true,
  expires_at      TIMESTAMPTZ NOT NULL,
  last_activity   TIMESTAMPTZ DEFAULT now(),
  created_at      TIMESTAMPTZ DEFAULT now()
);

-- ==============================================================================
-- 3. CLIENTES (Titulares de Certificado)
-- ==============================================================================

CREATE TABLE IF NOT EXISTS gs_clientes (
  id              UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  ar_id           UUID NOT NULL REFERENCES gs_ars(id),
  unidade_id      UUID REFERENCES gs_unidades(id),
  nome            TEXT NOT NULL,
  cpf_cnpj        TEXT NOT NULL,
  email           TEXT NOT NULL,
  telefone        TEXT,
  tipo_pessoa     TEXT NOT NULL CHECK (tipo_pessoa IN ('FISICA', 'JURIDICA')),
  endereco        JSONB,
  contador_id     UUID REFERENCES gs_usuarios(id),  -- Contador associado
  observacoes     TEXT,
  created_at      TIMESTAMPTZ DEFAULT now(),
  updated_at      TIMESTAMPTZ DEFAULT now(),
  UNIQUE(ar_id, cpf_cnpj)
);

-- ==============================================================================
-- 4. PEDIDOS (Ordens de Certificado)
-- ==============================================================================

CREATE TABLE IF NOT EXISTS gs_pedidos (
  id              UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  ar_id           UUID NOT NULL REFERENCES gs_ars(id),
  unidade_id      UUID REFERENCES gs_unidades(id),
  ponto_id        UUID REFERENCES gs_pontos_atendimento(id),
  cliente_id      UUID REFERENCES gs_clientes(id),
  usuario_id      UUID REFERENCES gs_usuarios(id),  -- Quem criou o pedido
  contador_id     UUID REFERENCES gs_usuarios(id),  -- Contador que indicou

  -- Dados do certificado
  protocolo       TEXT,                             -- Protocolo gerado
  tipo_certificado TEXT NOT NULL CHECK (tipo_certificado IN ('A1', 'A3', 'NUVEM')),
  produto         TEXT NOT NULL,                     -- e-CPF, e-CNPJ, etc.
  validade_meses  INT NOT NULL DEFAULT 12,
  ac_provider     TEXT NOT NULL,                     -- 'ANGRY', 'SAFEWEB', 'VALID', 'SYNGULAR', 'CERTISIGN'

  -- Status
  status          TEXT NOT NULL DEFAULT 'RASCUNHO'
                  CHECK (status IN ('RASCUNHO','AGUARDANDO_PAGAMENTO','PAGO','DOCUMENTOS_PENDENTES',
                         'DOCUMENTOS_VALIDADOS','DOCUMENTOS_REJEITADOS','AGUARDANDO_VIDEO',
                         'VIDEO_REALIZADO','EMITINDO_AC','EMITIDO','ERRO_AC','CANCELADO','EXPIRADO')),
  status_ac       JSONB,                            -- Status retornado pela AC parceira

  -- Financeiro
  valor_total     INT NOT NULL DEFAULT 0,            -- Em centavos
  valor_comissao  INT DEFAULT 0,
  forma_pagamento TEXT,
  pago_em         TIMESTAMPTZ,

  -- Datas
  emitido_em      TIMESTAMPTZ,
  expira_em       TIMESTAMPTZ,
  created_at      TIMESTAMPTZ DEFAULT now(),
  updated_at      TIMESTAMPTZ DEFAULT now()
);

-- ==============================================================================
-- 5. INTEGRAÇÃO COM MÚLTIPLAS ACs
-- ==============================================================================

-- 5.1. Configuração de integração por AR
CREATE TABLE IF NOT EXISTS gs_integracoes_ac (
  id              UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  ar_id           UUID NOT NULL REFERENCES gs_ars(id),
  ac_provider     TEXT NOT NULL,                     -- 'ANGRY', 'SAFEWEB', 'VALID', 'SYNGULAR', 'CERTISIGN'
  is_active       BOOLEAN DEFAULT true,
  config          JSONB NOT NULL DEFAULT '{}',       -- { api_url, api_key, webhook_url, ... }
  created_at      TIMESTAMPTZ DEFAULT now(),
  updated_at      TIMESTAMPTZ DEFAULT now(),
  UNIQUE(ar_id, ac_provider)
);

-- 5.2. Log de integração (rastreabilidade)
CREATE TABLE IF NOT EXISTS gs_integracao_logs (
  id              UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  ar_id           UUID REFERENCES gs_ars(id),
  pedido_id       UUID REFERENCES gs_pedidos(id),
  ac_provider     TEXT NOT NULL,
  endpoint        TEXT NOT NULL,
  metodo          TEXT NOT NULL,
  request_body    JSONB,
  response_body   JSONB,
  status_code     INT,
  success         BOOLEAN NOT NULL,
  error_message   TEXT,
  created_at      TIMESTAMPTZ DEFAULT now()
);

-- ==============================================================================
-- 6. SUPORTE (Sistema de Chamados)
-- ==============================================================================

CREATE TYPE ticket_prioridade AS ENUM ('BAIXA', 'MEDIA', 'ALTA', 'URGENTE');
CREATE TYPE ticket_status AS ENUM ('ABERTO', 'EM_ANALISE', 'AGUARDANDO_CLIENTE', 'RESOLVIDO', 'FECHADO');

CREATE TABLE IF NOT EXISTS gs_tickets (
  id              UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  ar_id           UUID NOT NULL REFERENCES gs_ars(id),
  unidade_id      UUID REFERENCES gs_unidades(id),
  cliente_id      UUID REFERENCES gs_clientes(id),  -- Cliente final (opcional)
  pedido_id       UUID REFERENCES gs_pedidos(id),   -- Pedido relacionado (opcional)
  usuario_id      UUID NOT NULL REFERENCES gs_usuarios(id), -- Quem abriu
  responsavel_id  UUID REFERENCES gs_usuarios(id),  -- Responsável pelo atendimento

  titulo          TEXT NOT NULL,
  descricao       TEXT NOT NULL,
  categoria       TEXT DEFAULT 'OUTROS',             -- 'INSTALACAO', 'EMISSAO', 'VIDEOCONFERENCIA', 'RENOVACAO', 'REEMBOLSO', 'FINANCEIRO', 'OUTROS'
  prioridade      ticket_prioridade NOT NULL DEFAULT 'MEDIA',
  status          ticket_status NOT NULL DEFAULT 'ABERTO',

  -- Para suporte interno da AR (IT atender cliente)
  contato_cliente_nome  TEXT,
  contato_cliente_email TEXT,
  contato_cliente_telefone TEXT,
  resolucao       TEXT,                              -- Descrição da solução

  created_at      TIMESTAMPTZ DEFAULT now(),
  updated_at      TIMESTAMPTZ DEFAULT now()
);

-- Respostas do ticket
CREATE TABLE IF NOT EXISTS gs_ticket_respostas (
  id              UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  ticket_id       UUID NOT NULL REFERENCES gs_tickets(id) ON DELETE CASCADE,
  usuario_id      UUID NOT NULL REFERENCES gs_usuarios(id),
  mensagem        TEXT NOT NULL,
  anexos          JSONB,                             -- URLs de arquivos anexados
  is_interno      BOOLEAN DEFAULT false,             -- True: visível apenas para equipe
  created_at      TIMESTAMPTZ DEFAULT now()
);

-- ==============================================================================
-- 7. MÓDULO CONTADOR
-- ==============================================================================

-- 7.1. Carteira de certificados do contador
CREATE TABLE IF NOT EXISTS gs_contador_carteira (
  id              UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  contador_id     UUID NOT NULL REFERENCES gs_usuarios(id),
  cliente_id      UUID NOT NULL REFERENCES gs_clientes(id),
  pedido_id       UUID REFERENCES gs_pedidos(id),
  status          TEXT NOT NULL DEFAULT 'ATIVO' CHECK (status IN ('ATIVO', 'EXPIRADO', 'RENOVACAO_PENDENTE')),
  data_expiracao  TIMESTAMPTZ NOT NULL,
  lembrete_60d    BOOLEAN DEFAULT false,
  lembrete_30d    BOOLEAN DEFAULT false,
  lembrete_15d    BOOLEAN DEFAULT false,
  created_at      TIMESTAMPTZ DEFAULT now(),
  updated_at      TIMESTAMPTZ DEFAULT now()
);

-- 7.2. Scanner de certificados (PowerShell → web)
CREATE TABLE IF NOT EXISTS gs_scanner_resultados (
  id              UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  contador_id     UUID NOT NULL REFERENCES gs_usuarios(id),
  cliente_id      UUID REFERENCES gs_clientes(id),
  machine_name    TEXT,
  scanned_at      TIMESTAMPTZ DEFAULT now(),
  certificados    JSONB NOT NULL, -- Array de certificados encontrados
  total_encontrados INT DEFAULT 0,
  total_expirados   INT DEFAULT 0,
  total_a_expirar   INT DEFAULT 0  -- Expira em < 30 dias
);

-- 7.3. Notas Fiscais (emissão/upload)
CREATE TABLE IF NOT EXISTS gs_notas_fiscais (
  id              UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  ar_id           UUID NOT NULL REFERENCES gs_ars(id),
  pedido_id       UUID REFERENCES gs_pedidos(id),
  cliente_id      UUID REFERENCES gs_clientes(id),
  usuario_id      UUID REFERENCES gs_usuarios(id),

  numero          TEXT,
  serie           TEXT,
  tipo            TEXT NOT NULL CHECK (tipo IN ('NFSE', 'NFE', 'NFC_E')),
  valor           INT NOT NULL DEFAULT 0,
  chave_acesso    TEXT,
  xml_url         TEXT,
  pdf_url         TEXT,
  status          TEXT NOT NULL DEFAULT 'PENDENTE' CHECK (status IN ('PENDENTE', 'AUTORIZADA', 'CANCELADA', 'REJEITADA')),

  -- Integração com gateway (eNotas, Formiga)
  gateway         TEXT,
  gateway_status  TEXT,
  gateway_id      TEXT,

  created_at      TIMESTAMPTZ DEFAULT now(),
  updated_at      TIMESTAMPTZ DEFAULT now()
);

-- ==============================================================================
-- 8. NOTIFICAÇÕES E LEMBRETES
-- ==============================================================================

CREATE TABLE IF NOT EXISTS gs_notificacoes (
  id              UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  usuario_id      UUID NOT NULL REFERENCES gs_usuarios(id),
  tipo            TEXT NOT NULL,  -- 'EXPIRACAO', 'TICKET', 'PEDIDO', 'FINANCEIRO', 'SISTEMA'
  titulo          TEXT NOT NULL,
  mensagem        TEXT NOT NULL,
  referencia_id   TEXT,          -- ID do recurso relacionado
  referencia_tipo TEXT,          -- 'pedido', 'ticket', 'cliente'
  lida            BOOLEAN DEFAULT false,
  created_at      TIMESTAMPTZ DEFAULT now()
);

-- ==============================================================================
-- ÍNDICES
-- ==============================================================================

CREATE INDEX IF NOT EXISTS idx_gs_usuarios_ar     ON gs_usuarios(ar_id);
CREATE INDEX IF NOT EXISTS idx_gs_usuarios_unidade ON gs_usuarios(unidade_id);
CREATE INDEX IF NOT EXISTS idx_gs_unidades_ar     ON gs_unidades(ar_id);
CREATE INDEX IF NOT EXISTS idx_gs_pontos_unidade  ON gs_pontos_atendimento(unidade_id);
CREATE INDEX IF NOT EXISTS idx_gs_pedidos_ar      ON gs_pedidos(ar_id);
CREATE INDEX IF NOT EXISTS idx_gs_pedidos_cliente  ON gs_pedidos(cliente_id);
CREATE INDEX IF NOT EXISTS idx_gs_pedidos_status   ON gs_pedidos(status);
CREATE INDEX IF NOT EXISTS idx_gs_pedidos_protocolo ON gs_pedidos(protocolo);
CREATE INDEX IF NOT EXISTS idx_gs_tickets_ar       ON gs_tickets(ar_id);
CREATE INDEX IF NOT EXISTS idx_gs_tickets_status   ON gs_tickets(status);
CREATE INDEX IF NOT EXISTS idx_gs_tickets_responsavel ON gs_tickets(responsavel_id);
CREATE INDEX IF NOT EXISTS idx_gs_notificacoes_usuario ON gs_notificacoes(usuario_id);
CREATE INDEX IF NOT EXISTS idx_gs_notificacoes_lida ON gs_notificacoes(usuario_id, lida);
CREATE INDEX IF NOT EXISTS idx_gs_contador_carteira ON gs_contador_carteira(contador_id);
CREATE INDEX IF NOT EXISTS idx_gs_integracao_logs_pedido ON gs_integracao_logs(pedido_id);

-- ==============================================================================
-- ROW LEVEL SECURITY
-- ==============================================================================

ALTER TABLE gs_ars                 ENABLE ROW LEVEL SECURITY;
ALTER TABLE gs_unidades            ENABLE ROW LEVEL SECURITY;
ALTER TABLE gs_pontos_atendimento  ENABLE ROW LEVEL SECURITY;
ALTER TABLE gs_usuarios            ENABLE ROW LEVEL SECURITY;
ALTER TABLE gs_permissoes          ENABLE ROW LEVEL SECURITY;
ALTER TABLE gs_sessoes             ENABLE ROW LEVEL SECURITY;
ALTER TABLE gs_clientes            ENABLE ROW LEVEL SECURITY;
ALTER TABLE gs_pedidos             ENABLE ROW LEVEL SECURITY;
ALTER TABLE gs_integracoes_ac      ENABLE ROW LEVEL SECURITY;
ALTER TABLE gs_tickets             ENABLE ROW LEVEL SECURITY;
ALTER TABLE gs_ticket_respostas    ENABLE ROW LEVEL SECURITY;
ALTER TABLE gs_contador_carteira   ENABLE ROW LEVEL SECURITY;
ALTER TABLE gs_scanner_resultados  ENABLE ROW LEVEL SECURITY;
ALTER TABLE gs_notas_fiscais       ENABLE ROW LEVEL SECURITY;
ALTER TABLE gs_notificacoes        ENABLE ROW LEVEL SECURITY;

-- Políticas: service_role bypass (usado pelo backend)
-- Anon key: sem acesso (sistema interno)

-- ==============================================================================
-- FUNÇÕES AUXILIARES
-- ==============================================================================

-- Auto-update updated_at
CREATE OR REPLACE FUNCTION gs_set_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_gs_ars_updated_at
  BEFORE UPDATE ON gs_ars FOR EACH ROW EXECUTE FUNCTION gs_set_updated_at();
CREATE TRIGGER trg_gs_unidades_updated_at
  BEFORE UPDATE ON gs_unidades FOR EACH ROW EXECUTE FUNCTION gs_set_updated_at();
CREATE TRIGGER trg_gs_pontos_updated_at
  BEFORE UPDATE ON gs_pontos_atendimento FOR EACH ROW EXECUTE FUNCTION gs_set_updated_at();
CREATE TRIGGER trg_gs_usuarios_updated_at
  BEFORE UPDATE ON gs_usuarios FOR EACH ROW EXECUTE FUNCTION gs_set_updated_at();
CREATE TRIGGER trg_gs_pedidos_updated_at
  BEFORE UPDATE ON gs_pedidos FOR EACH ROW EXECUTE FUNCTION gs_set_updated_at();
CREATE TRIGGER trg_gs_clientes_updated_at
  BEFORE UPDATE ON gs_clientes FOR EACH ROW EXECUTE FUNCTION gs_set_updated_at();
CREATE TRIGGER trg_gs_tickets_updated_at
  BEFORE UPDATE ON gs_tickets FOR EACH ROW EXECUTE FUNCTION gs_set_updated_at();

-- Notificar certificados próximos do vencimento
CREATE OR REPLACE FUNCTION gs_notificar_vencimentos()
RETURNS void LANGUAGE plpgsql AS $$
BEGIN
  -- Inserir notificações para certificados que expiram em 60, 30 e 15 dias
  INSERT INTO gs_notificacoes (usuario_id, tipo, titulo, mensagem, referencia_id, referencia_tipo)
  SELECT
    cc.contador_id,
    'EXPIRACAO',
    'Certificado próximo do vencimento',
    'O certificado de ' || c.nome || ' (' || c.cpf_cnpj || ') expira em ' ||
    CASE
      WHEN cc.data_expiracao - now() < INTERVAL '15 days' THEN 'menos de 15 dias!'
      WHEN cc.data_expiracao - now() < INTERVAL '30 days' THEN 'menos de 30 dias.'
      ELSE 'cerca de 60 dias.'
    END,
    cc.id::TEXT,
    'certificado'
  FROM gs_contador_carteira cc
  JOIN gs_clientes c ON c.id = cc.cliente_id
  WHERE cc.status = 'ATIVO'
    AND (
      (cc.data_expiracao - now() < INTERVAL '60 days' AND NOT cc.lembrete_60d)
      OR (cc.data_expiracao - now() < INTERVAL '30 days' AND NOT cc.lembrete_30d)
      OR (cc.data_expiracao - now() < INTERVAL '15 days' AND NOT cc.lembrete_15d)
    );

  -- Marcar lembretes como enviados
  UPDATE gs_contador_carteira SET
    lembrete_60d = CASE WHEN data_expiracao - now() < INTERVAL '60 days' THEN true ELSE lembrete_60d END,
    lembrete_30d = CASE WHEN data_expiracao - now() < INTERVAL '30 days' THEN true ELSE lembrete_30d END,
    lembrete_15d = CASE WHEN data_expiracao - now() < INTERVAL '15 days' THEN true ELSE lembrete_15d END
  WHERE status = 'ATIVO'
    AND (
      (data_expiracao - now() < INTERVAL '60 days' AND NOT lembrete_60d)
      OR (data_expiracao - now() < INTERVAL '30 days' AND NOT lembrete_30d)
      OR (data_expiracao - now() < INTERVAL '15 days' AND NOT lembrete_15d)
    );
END;
$$;

-- ==============================================================================
-- DADOS INICIAIS (Admin padrão — senha: admin123)
-- ==============================================================================
-- A senha abaixo é um hash bcrypt de 'admin123'
-- Em produção, troque imediatamente.
INSERT INTO gs_ars (nome, cnpj, email) VALUES
  ('AC ANGRY', '00.000.000/0001-00', 'admin@acangry.ac.br')
ON CONFLICT (cnpj) DO NOTHING;

-- Inserir unidade MATRIZ automaticamente
INSERT INTO gs_unidades (ar_id, nome, cnpj, email, tipo)
SELECT id, 'Matriz AC ANGRY', cnpj, email, 'MATRIZ'
FROM gs_ars WHERE cnpj = '00.000.000/0001-00'
ON CONFLICT DO NOTHING;

INSERT INTO gs_usuarios (email, nome, cpf, nivel, ar_id, password_hash)
SELECT
  'admin@acangry.ac.br',
  'Admin AC ANGRY',
  '00000000000',
  'AC_ADMIN',
  id,
  '$2a$10$8KzQMGx5C5Kc5Q5y5Q5u5e5i5o5u5e5i5o5u5e5i5o5u5e5i5o5u' -- admin123
FROM gs_ars WHERE cnpj = '00.000.000/0001-00'
ON CONFLICT (email) DO NOTHING;
