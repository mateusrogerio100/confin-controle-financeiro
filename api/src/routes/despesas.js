import { Router } from 'express';
import { query } from '../db.js';
import { autenticar, exigirFamilia } from '../auth.js';
import {
  CATEGORIAS,
  HttpError,
  MEIOS_PAGAMENTO,
  hojeISO,
  texto,
  validarData,
  validarMes,
  validarValor,
} from '../util.js';
import { notificarFamilia } from '../realtime.js';
import { resumoCompleto, saldoDoMes } from '../resumo.js';

const router = Router();
router.use(autenticar, exigirFamilia);

function validarDespesa(body) {
  const categoria = String(body.categoria ?? '').toUpperCase();
  if (!CATEGORIAS.includes(categoria)) throw new HttpError(400, 'Selecione uma categoria válida.');
  const meio = String(body.meio_pagamento ?? '').toUpperCase();
  if (!MEIOS_PAGAMENTO.includes(meio)) throw new HttpError(400, 'Selecione o meio de pagamento.');
  return {
    valor: validarValor(body.valor), // RN002
    data: body.data ? validarData(body.data) : hojeISO(),
    categoria,
    meio_pagamento: meio,
    descricao: texto(body.descricao, 'Descrição', { max: 120, opcional: true }),
  };
}

async function buscarDespesa(id, familiaId) {
  const { rows } = await query(
    `SELECT d.*, u.nome AS usuario_nome FROM despesa d
       LEFT JOIN usuario u ON u.id = d.usuario_id
      WHERE d.id = $1 AND d.familia_id = $2`,
    [id, familiaId],
  );
  if (!rows[0]) throw new HttpError(404, 'Despesa não encontrada.');
  return rows[0];
}

function podeAlterar(usuario, despesa) {
  if (usuario.papel !== 'ADMIN' && despesa.usuario_id !== usuario.id) {
    throw new HttpError(403, 'Você só pode alterar as despesas que registrou.');
  }
}

// GET /api/despesas/resumo?mes=AAAA-MM  -> dados do Dashboard (RF004)
router.get('/resumo', async (req, res) => {
  res.json(await resumoCompleto(req.usuario.familia_id, validarMes(req.query.mes)));
});

// GET /api/despesas?mes=AAAA-MM&categoria=&usuario_id=&busca=  -> Histórico
router.get('/', async (req, res) => {
  const mes = validarMes(req.query.mes);
  const valores = [req.usuario.familia_id, `${mes}-01`];
  const filtros = ['d.familia_id = $1', 'd.data >= $2::date', "d.data < $2::date + INTERVAL '1 month'"];
  if (req.query.categoria) {
    valores.push(String(req.query.categoria).toUpperCase());
    filtros.push(`d.categoria = $${valores.length}`);
  }
  if (req.query.usuario_id) {
    valores.push(Number(req.query.usuario_id));
    filtros.push(`d.usuario_id = $${valores.length}`);
  }
  if (req.query.busca) {
    valores.push(`%${String(req.query.busca).trim()}%`);
    filtros.push(`d.descricao ILIKE $${valores.length}`);
  }
  const { rows } = await query(
    `SELECT d.*, u.nome AS usuario_nome
       FROM despesa d LEFT JOIN usuario u ON u.id = d.usuario_id
      WHERE ${filtros.join(' AND ')}
      ORDER BY d.data DESC, d.id DESC`,
    valores,
  );
  res.json({ despesas: rows });
});

// RF002 / UC002 - Registrar despesa
router.post('/', async (req, res) => {
  const d = validarDespesa(req.body);
  const { familia_id, id: usuario_id } = req.usuario;
  const { rows } = await query(
    `INSERT INTO despesa (valor, data, categoria, meio_pagamento, descricao, usuario_id, familia_id)
     VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *`,
    [d.valor, d.data, d.categoria, d.meio_pagamento, d.descricao, usuario_id, familia_id],
  );
  const despesa = { ...rows[0], usuario_nome: req.usuario.nome };
  const saldo = await saldoDoMes(familia_id, d.data.slice(0, 7));

  notificarFamilia(familia_id, 'despesa:criada', { autor_id: usuario_id, despesa, saldo });
  // Cenário alternativo do UC002: permite salvar, mas devolve o alerta
  res.status(201).json({ despesa, saldo });
});

router.put('/:id', async (req, res) => {
  const atual = await buscarDespesa(req.params.id, req.usuario.familia_id);
  podeAlterar(req.usuario, atual);
  const d = validarDespesa(req.body);
  await query(
    `UPDATE despesa SET valor = $1, data = $2, categoria = $3, meio_pagamento = $4, descricao = $5
      WHERE id = $6`,
    [d.valor, d.data, d.categoria, d.meio_pagamento, d.descricao, atual.id],
  );
  const despesa = await buscarDespesa(atual.id, req.usuario.familia_id);
  const saldo = await saldoDoMes(req.usuario.familia_id, d.data.slice(0, 7));
  notificarFamilia(req.usuario.familia_id, 'despesa:editada', { autor_id: req.usuario.id, despesa, saldo });
  res.json({ despesa, saldo });
});

router.delete('/:id', async (req, res) => {
  const atual = await buscarDespesa(req.params.id, req.usuario.familia_id);
  podeAlterar(req.usuario, atual);
  await query('DELETE FROM despesa WHERE id = $1', [atual.id]);
  notificarFamilia(req.usuario.familia_id, 'despesa:excluida', { autor_id: req.usuario.id, despesa: atual });
  res.status(204).end();
});

export default router;
