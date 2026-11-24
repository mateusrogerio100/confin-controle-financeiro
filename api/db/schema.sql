-- ConFin - Sistema de Controle Financeiro Familiar
-- Modelo relacional: Familia (entidade central) -> Usuario -> Despesa

CREATE TABLE IF NOT EXISTS familia (
  id              SERIAL PRIMARY KEY,
  nome            VARCHAR(80)    NOT NULL,
  limite_mensal   NUMERIC(12,2)  NOT NULL DEFAULT 0 CHECK (limite_mensal >= 0),
  codigo_convite  VARCHAR(8)     NOT NULL UNIQUE,
  criado_em       TIMESTAMPTZ    NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS usuario (
  id          SERIAL PRIMARY KEY,
  nome        VARCHAR(80)  NOT NULL,
  email       VARCHAR(120) NOT NULL UNIQUE,              -- RN001: e-mail único
  senha_hash  VARCHAR(100) NOT NULL,                     -- RNF003: bcrypt
  papel       VARCHAR(10)  NOT NULL DEFAULT 'MEMBRO'
              CHECK (papel IN ('ADMIN', 'MEMBRO')),
  familia_id  INT REFERENCES familia(id) ON DELETE SET NULL,
  criado_em   TIMESTAMPTZ  NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS despesa (
  id              SERIAL PRIMARY KEY,
  valor           NUMERIC(12,2) NOT NULL CHECK (valor > 0),   -- RN002: apenas positivos
  data            DATE          NOT NULL DEFAULT CURRENT_DATE,
  categoria       VARCHAR(20)   NOT NULL CHECK (categoria IN
                  ('MERCADO','MORADIA','TRANSPORTE','SAUDE','LAZER','EDUCACAO','ALIMENTACAO','OUTROS')),
  meio_pagamento  VARCHAR(10)   NOT NULL CHECK (meio_pagamento IN ('CREDITO','DEBITO','PIX','DINHEIRO')),
  descricao       VARCHAR(120),
  usuario_id      INT REFERENCES usuario(id) ON DELETE SET NULL,
  familia_id      INT NOT NULL REFERENCES familia(id) ON DELETE CASCADE,
  criado_em       TIMESTAMPTZ   NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_despesa_familia_data ON despesa (familia_id, data);

-- Convites por e-mail (RF003): quem ainda não tem conta entra na família ao se cadastrar
CREATE TABLE IF NOT EXISTS convite (
  id          SERIAL PRIMARY KEY,
  familia_id  INT NOT NULL REFERENCES familia(id) ON DELETE CASCADE,
  email       VARCHAR(120) NOT NULL,
  criado_em   TIMESTAMPTZ  NOT NULL DEFAULT now(),
  UNIQUE (familia_id, email)
);

CREATE INDEX IF NOT EXISTS idx_usuario_familia ON usuario (familia_id);
CREATE INDEX IF NOT EXISTS idx_despesa_usuario ON despesa (usuario_id);
CREATE INDEX IF NOT EXISTS idx_convite_email ON convite (email);

-- Segurança: o acesso aos dados acontece somente pela nossa API (que conecta como dona das tabelas).
-- RLS ligado sem políticas bloqueia acessos diretos por outros papéis (ex.: API REST automática do Supabase).
ALTER TABLE familia ENABLE ROW LEVEL SECURITY;
ALTER TABLE usuario ENABLE ROW LEVEL SECURITY;
ALTER TABLE despesa ENABLE ROW LEVEL SECURITY;
ALTER TABLE convite ENABLE ROW LEVEL SECURITY;
