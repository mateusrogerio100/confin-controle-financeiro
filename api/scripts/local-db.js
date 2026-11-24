// Sobe um PostgreSQL real localmente (sem Docker) para desenvolvimento.
// Uso: npm run db:local   (deixe este terminal aberto)
import EmbeddedPostgres from 'embedded-postgres';
import { existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const dataDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '.pgdata');
const PORT = 5433;

const pg = new EmbeddedPostgres({
  databaseDir: dataDir,
  user: 'postgres',
  password: 'postgres',
  port: PORT,
  persistent: true,
  initdbFlags: ['--encoding=UTF8', '--locale=C'],
});

if (!existsSync(path.join(dataDir, 'PG_VERSION'))) {
  console.log('Inicializando cluster PostgreSQL em', dataDir);
  await pg.initialise();
}

try {
  await pg.start();
} catch {
  console.error(
    `\nNão foi possível iniciar o PostgreSQL. Provavelmente ele já está rodando na porta ${PORT}` +
      ' (outro terminal aberto). Se não estiver, reinicie o computador ou apague api/.pgdata/postmaster.pid.\n',
  );
  process.exit(1);
}

try {
  await pg.createDatabase('confin');
  console.log('Banco "confin" criado.');
} catch {
  // já existe
}

console.log(`\nPostgreSQL rodando em postgresql://postgres:postgres@localhost:${PORT}/confin`);
console.log('Pressione Ctrl+C para parar.\n');

const parar = async () => {
  await pg.stop();
  process.exit(0);
};
process.on('SIGINT', parar);
process.on('SIGTERM', parar);
