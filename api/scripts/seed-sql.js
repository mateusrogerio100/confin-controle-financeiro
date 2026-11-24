// Gera o seed da demo como um script SQL (para colar no SQL Editor do Supabase/Neon
// quando não for possível conectar direto no banco).
// Uso: npm run db:seed-sql > seed.sql
import bcrypt from 'bcryptjs';
import { CODIGO, LIMITE, MEMBROS, SENHA, gerarDespesas } from './demo-data.js';

const q = (s) => `'${String(s).replace(/'/g, "''")}'`;
const hash = await bcrypt.hash(SENHA, 10);
const emails = MEMBROS.map((m) => q(m.email)).join(', ');

const membros = MEMBROS.map((m) => `(${q(m.nome)}, ${q(m.email)}, ${q(m.papel)})`).join(',\n  ');
const despesas = gerarDespesas()
  .map((d) => `(${d.valor}, ${q(d.data)}, ${q(d.categoria)}, ${q(d.meio)}, ${q(d.descricao)}, ${q(MEMBROS[d.membro].email)})`)
  .join(',\n  ');

console.log(`-- Seed da Família Souza (gerado por scripts/seed-sql.js)
DELETE FROM familia WHERE id IN (SELECT familia_id FROM usuario WHERE email IN (${emails}));
DELETE FROM usuario WHERE email IN (${emails});

WITH f AS (
  INSERT INTO familia (nome, limite_mensal, codigo_convite) VALUES ('Família Souza', ${LIMITE}, ${q(CODIGO)}) RETURNING id
)
INSERT INTO usuario (nome, email, senha_hash, papel, familia_id)
SELECT v.nome, v.email, ${q(hash)}, v.papel, f.id FROM f, (VALUES
  ${membros}
) AS v(nome, email, papel);

INSERT INTO despesa (valor, data, categoria, meio_pagamento, descricao, usuario_id, familia_id)
SELECT v.valor, v.data::date, v.categoria, v.meio, v.descricao, u.id, u.familia_id
FROM (VALUES
  ${despesas}
) AS v(valor, data, categoria, meio, descricao, email)
JOIN usuario u ON u.email = v.email;`);
