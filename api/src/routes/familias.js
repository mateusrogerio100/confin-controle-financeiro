import { Router } from 'express';
import { query, transacao } from '../db.js';
import { autenticar, exigirAdmin, exigirFamilia } from '../auth.js';
import { HttpError, gerarCodigo, texto, validarEmail, validarValor } from '../util.js';
import { notificarFamilia } from '../realtime.js';

const router = Router();
router.use(autenticar);

async function codigoUnico(db) {
  for (;;) {
    const codigo = gerarCodigo();
    const { rowCount } = await db.query('SELECT 1 FROM familia WHERE codigo_convite = $1', [codigo]);
    if (!rowCount) return codigo;
  }
}

function semFamilia(req) {
  if (req.usuario.familia_id) throw new HttpError(409, 'Você já participa de uma família.');
}

// RF003 - Criar grupo familiar (o criador vira ADMIN)
router.post('/', async (req, res) => {
  semFamilia(req);
  const nome = texto(req.body.nome, 'Nome da família', { min: 2 });
  const limite = validarValor(req.body.limite_mensal ?? 0, { permitirZero: true });

  const familia = await transacao(async (db) => {
    const { rows } = await db.query(
      'INSERT INTO familia (nome, limite_mensal, codigo_convite) VALUES ($1, $2, $3) RETURNING *',
      [nome, limite, await codigoUnico(db)],
    );
    await db.query("UPDATE usuario SET familia_id = $1, papel = 'ADMIN' WHERE id = $2", [rows[0].id, req.usuario.id]);
    return rows[0];
  });
  res.status(201).json({ familia });
});

// Entrar em uma família pelo código de convite
router.post('/entrar', async (req, res) => {
  semFamilia(req);
  const codigo = String(req.body.codigo ?? '').trim().toUpperCase();
  const { rows } = await query('SELECT * FROM familia WHERE codigo_convite = $1', [codigo]);
  if (!rows[0]) throw new HttpError(404, 'Código de convite não encontrado.');

  await query("UPDATE usuario SET familia_id = $1, papel = 'MEMBRO' WHERE id = $2", [rows[0].id, req.usuario.id]);
  await query('DELETE FROM convite WHERE email = $1', [req.usuario.email]);
  notificarFamilia(rows[0].id, 'familia:atualizada', { autor_id: req.usuario.id });
  res.json({ familia: rows[0] });
});

router.use('/minha', exigirFamilia);

router.get('/minha', async (req, res) => {
  const fid = req.usuario.familia_id;
  const [familia, membros, convites] = await Promise.all([
    query('SELECT * FROM familia WHERE id = $1', [fid]),
    query(
      `SELECT id, nome, email, papel, criado_em FROM usuario
       WHERE familia_id = $1 ORDER BY papel, nome`,
      [fid],
    ),
    query('SELECT id, email, criado_em FROM convite WHERE familia_id = $1 ORDER BY criado_em DESC', [fid]),
  ]);
  res.json({ familia: familia.rows[0], membros: membros.rows, convites: convites.rows });
});

// Alterar nome e limite do orçamento (apenas ADMIN)
router.patch('/minha', exigirAdmin, async (req, res) => {
  const campos = [];
  const valores = [];
  if (req.body.nome !== undefined) {
    valores.push(texto(req.body.nome, 'Nome da família', { min: 2 }));
    campos.push(`nome = $${valores.length}`);
  }
  if (req.body.limite_mensal !== undefined) {
    valores.push(validarValor(req.body.limite_mensal, { permitirZero: true }));
    campos.push(`limite_mensal = $${valores.length}`);
  }
  if (!campos.length) throw new HttpError(400, 'Nada para atualizar.');
  valores.push(req.usuario.familia_id);
  const { rows } = await query(
    `UPDATE familia SET ${campos.join(', ')} WHERE id = $${valores.length} RETURNING *`,
    valores,
  );
  notificarFamilia(req.usuario.familia_id, 'familia:atualizada', { autor_id: req.usuario.id });
  res.json({ familia: rows[0] });
});

router.post('/minha/codigo', exigirAdmin, async (req, res) => {
  const codigo = await codigoUnico({ query });
  const { rows } = await query('UPDATE familia SET codigo_convite = $1 WHERE id = $2 RETURNING *', [
    codigo,
    req.usuario.familia_id,
  ]);
  res.json({ familia: rows[0] });
});

// RF003 - Adicionar membro por e-mail
router.post('/minha/convites', exigirAdmin, async (req, res) => {
  const email = validarEmail(req.body.email);
  const fid = req.usuario.familia_id;
  const { rows } = await query('SELECT id, familia_id FROM usuario WHERE email = $1', [email]);
  const alvo = rows[0];

  if (alvo) {
    if (alvo.familia_id === fid) throw new HttpError(409, 'Essa pessoa já faz parte da família.');
    if (alvo.familia_id) throw new HttpError(409, 'Essa pessoa já participa de outra família.');
    await query("UPDATE usuario SET familia_id = $1, papel = 'MEMBRO' WHERE id = $2", [fid, alvo.id]);
    notificarFamilia(fid, 'familia:atualizada', { autor_id: req.usuario.id });
    return res.status(201).json({ adicionado: true, mensagem: 'Membro adicionado à família.' });
  }

  await query('INSERT INTO convite (familia_id, email) VALUES ($1, $2) ON CONFLICT DO NOTHING', [fid, email]);
  res.status(201).json({
    adicionado: false,
    mensagem: 'Convite registrado. A pessoa entrará na família ao criar a conta com este e-mail.',
  });
});

router.delete('/minha/convites/:id', exigirAdmin, async (req, res) => {
  await query('DELETE FROM convite WHERE id = $1 AND familia_id = $2', [req.params.id, req.usuario.familia_id]);
  res.status(204).end();
});

// Remover membro (apenas ADMIN; não pode remover a si mesmo)
router.delete('/minha/membros/:id', exigirAdmin, async (req, res) => {
  const id = Number(req.params.id);
  if (id === req.usuario.id) throw new HttpError(400, 'Você não pode remover a si mesmo.');
  const { rowCount } = await query(
    "UPDATE usuario SET familia_id = NULL, papel = 'MEMBRO' WHERE id = $1 AND familia_id = $2",
    [id, req.usuario.familia_id],
  );
  if (!rowCount) throw new HttpError(404, 'Membro não encontrado.');
  notificarFamilia(req.usuario.familia_id, 'familia:atualizada', { autor_id: req.usuario.id, removido_id: id });
  res.status(204).end();
});

// Sair da família (membros comuns)
router.post('/minha/sair', async (req, res) => {
  if (req.usuario.papel === 'ADMIN') {
    throw new HttpError(400, 'O administrador não pode sair da família.');
  }
  const fid = req.usuario.familia_id;
  await query('UPDATE usuario SET familia_id = NULL WHERE id = $1', [req.usuario.id]);
  notificarFamilia(fid, 'familia:atualizada', { autor_id: req.usuario.id });
  res.status(204).end();
});

export default router;
