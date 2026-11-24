// Popula o banco com a "Família Souza" de demonstração.
// Uso: npm run db:seed   (recria apenas os dados da família demo; usa o DATABASE_URL do .env)
import bcrypt from 'bcryptjs';
import { aplicarSchema, pool, transacao } from '../src/db.js';
import { CODIGO, LIMITE, MEMBROS, SENHA, gerarDespesas } from './demo-data.js';

await aplicarSchema();

await transacao(async (db) => {
  const emails = MEMBROS.map((m) => m.email);
  await db.query('DELETE FROM familia WHERE id IN (SELECT familia_id FROM usuario WHERE email = ANY($1))', [emails]);
  await db.query('DELETE FROM usuario WHERE email = ANY($1)', [emails]);

  const { rows: [familia] } = await db.query(
    "INSERT INTO familia (nome, limite_mensal, codigo_convite) VALUES ('Família Souza', $1, $2) RETURNING id",
    [LIMITE, CODIGO],
  );

  const hash = await bcrypt.hash(SENHA, 10);
  const ids = [];
  for (const m of MEMBROS) {
    const { rows } = await db.query(
      'INSERT INTO usuario (nome, email, senha_hash, papel, familia_id) VALUES ($1,$2,$3,$4,$5) RETURNING id',
      [m.nome, m.email, hash, m.papel, familia.id],
    );
    ids.push(rows[0].id);
  }

  const despesas = gerarDespesas();
  for (const d of despesas) {
    await db.query(
      `INSERT INTO despesa (valor, data, categoria, meio_pagamento, descricao, usuario_id, familia_id)
       VALUES ($1,$2,$3,$4,$5,$6,$7)`,
      [d.valor, d.data, d.categoria, d.meio, d.descricao, ids[d.membro], familia.id],
    );
  }
  console.log(`✔ Família Souza criada com ${despesas.length} despesas.`);
});

console.log(`\nContas de demonstração (senha ${SENHA}):`);
for (const m of MEMBROS) console.log(`  ${m.papel.padEnd(6)}  ${m.email}`);
console.log(`Código de convite da família: ${CODIGO}\n`);
await pool.end();
