import pg from 'pg';
import { readFile } from 'node:fs/promises';

// NUMERIC -> number, DATE -> 'YYYY-MM-DD' (evita deslocamento de fuso), BIGINT (count) -> number
pg.types.setTypeParser(1700, (v) => parseFloat(v));
pg.types.setTypeParser(1082, (v) => v);
pg.types.setTypeParser(20, (v) => parseInt(v, 10));

if (!process.env.DATABASE_URL) {
  console.error('DATABASE_URL não definida. Copie .env.example para .env.');
  process.exit(1);
}

export const pool = new pg.Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.DATABASE_SSL === 'true' ? { rejectUnauthorized: false } : undefined,
});

export const query = (text, params) => pool.query(text, params);

/** Executa uma função dentro de uma transação. */
export async function transacao(fn) {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const resultado = await fn(client);
    await client.query('COMMIT');
    return resultado;
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
}

/** Cria as tabelas caso não existam (idempotente). */
export async function aplicarSchema() {
  const sql = await readFile(new URL('../db/schema.sql', import.meta.url), 'utf8');
  await pool.query(sql);
}
