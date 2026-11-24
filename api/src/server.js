import express from 'express';
import cors from 'cors';
import { createServer } from 'node:http';
import { existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import { aplicarSchema } from './db.js';
import { iniciarRealtime } from './realtime.js';
import authRoutes from './routes/auth.js';
import familiaRoutes from './routes/familias.js';
import despesaRoutes from './routes/despesas.js';

const app = express();
const server = createServer(app);
const PORT = Number(process.env.PORT) || 3333;
const CORS_ORIGIN = process.env.CORS_ORIGIN || undefined;

app.use(cors(CORS_ORIGIN ? { origin: CORS_ORIGIN } : undefined));
app.use(express.json({ limit: '100kb' }));

app.get('/api/health', (_req, res) => res.json({ ok: true }));
app.use('/api/auth', authRoutes);
app.use('/api/familias', familiaRoutes);
app.use('/api/despesas', despesaRoutes);
app.use('/api', (_req, res) => res.status(404).json({ erro: 'Rota não encontrada.' }));

// Em produção a própria API serve o front-end compilado (web/dist): um único deploy.
const webDist = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..', 'web', 'dist');
if (existsSync(webDist)) {
  app.use(express.static(webDist));
  app.get(/^\/(?!api|socket\.io).*/, (_req, res) => res.sendFile(path.join(webDist, 'index.html')));
}

// Tratamento central de erros
app.use((err, _req, res, _next) => {
  if (err.status) return res.status(err.status).json({ erro: err.message });
  if (err.code === '23505') return res.status(409).json({ erro: 'Registro duplicado.' });
  if (err.code === '23514') return res.status(400).json({ erro: 'Dados inválidos.' });
  if (err.type === 'entity.parse.failed') return res.status(400).json({ erro: 'JSON inválido.' });
  console.error(err);
  res.status(500).json({ erro: 'Erro interno do servidor.' });
});

iniciarRealtime(server, CORS_ORIGIN);

await aplicarSchema();
server.listen(PORT, () => console.log(`🚀 API ConFin rodando em http://localhost:${PORT}`));
