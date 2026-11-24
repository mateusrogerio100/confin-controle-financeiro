import { Router } from 'express';
import bcrypt from 'bcryptjs';
import { query, transacao } from '../db.js';
import { autenticar, gerarToken } from '../auth.js';
import { HttpError, texto, validarEmail } from '../util.js';
import { notificarFamilia } from '../realtime.js';

const router = Router();

const publico = ({ senha_hash, ...u }) => u;

// RF001 - Cadastrar usuário
router.post('/register', async (req, res) => {
  const nome = texto(req.body.nome, 'Nome', { min: 2 });
  const email = validarEmail(req.body.email);
  const senha = String(req.body.senha ?? '');
  if (senha.length < 6) throw new HttpError(400, 'A senha deve ter pelo menos 6 caracteres.');

  const senha_hash = await bcrypt.hash(senha, 10); // RNF003

  const usuario = await transacao(async (db) => {
    // RN001 - e-mail único (também garantido pela constraint UNIQUE)
    const existe = await db.query('SELECT 1 FROM usuario WHERE email = $1', [email]);
    if (existe.rowCount) throw new HttpError(409, 'Este e-mail já está cadastrado.');

    // Se alguém convidou este e-mail, o usuário já entra na família
    const convite = await db.query(
      'SELECT familia_id FROM convite WHERE email = $1 ORDER BY criado_em LIMIT 1',
      [email],
    );
    const familiaId = convite.rows[0]?.familia_id ?? null;

    const { rows } = await db.query(
      `INSERT INTO usuario (nome, email, senha_hash, familia_id)
       VALUES ($1, $2, $3, $4) RETURNING *`,
      [nome, email, senha_hash, familiaId],
    );
    if (familiaId) await db.query('DELETE FROM convite WHERE email = $1', [email]);
    return rows[0];
  });

  if (usuario.familia_id) {
    notificarFamilia(usuario.familia_id, 'familia:atualizada', { autor_id: usuario.id });
  }
  res.status(201).json({ token: gerarToken(usuario), usuario: publico(usuario) });
});

router.post('/login', async (req, res) => {
  const email = String(req.body.email ?? '').trim().toLowerCase();
  const senha = String(req.body.senha ?? '');
  const { rows } = await query('SELECT * FROM usuario WHERE email = $1', [email]);
  const usuario = rows[0];
  if (!usuario || !(await bcrypt.compare(senha, usuario.senha_hash))) {
    throw new HttpError(401, 'E-mail ou senha incorretos.');
  }
  res.json({ token: gerarToken(usuario), usuario: publico(usuario) });
});

router.get('/me', autenticar, (req, res) => {
  res.json({ usuario: req.usuario });
});

export default router;
