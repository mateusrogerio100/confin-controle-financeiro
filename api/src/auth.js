import jwt from 'jsonwebtoken';
import { query } from './db.js';
import { HttpError } from './util.js';

const SECRET = process.env.JWT_SECRET || 'dev-secret-confin';
if (!process.env.JWT_SECRET) console.warn('⚠  JWT_SECRET não definido; usando segredo de desenvolvimento.');

export function gerarToken(usuario) {
  return jwt.sign({ sub: usuario.id }, SECRET, { expiresIn: '7d' });
}

export async function usuarioDoToken(token) {
  let payload;
  try {
    payload = jwt.verify(token, SECRET);
  } catch {
    throw new HttpError(401, 'Sessão expirada. Faça login novamente.');
  }
  const { rows } = await query(
    'SELECT id, nome, email, papel, familia_id FROM usuario WHERE id = $1',
    [payload.sub],
  );
  if (!rows[0]) throw new HttpError(401, 'Usuário não encontrado.');
  return rows[0];
}

/** Middleware: exige token JWT válido no header Authorization. */
export async function autenticar(req, _res, next) {
  const [tipo, token] = (req.headers.authorization || '').split(' ');
  if (tipo !== 'Bearer' || !token) throw new HttpError(401, 'Não autenticado.');
  req.usuario = await usuarioDoToken(token);
  next();
}

export function exigirFamilia(req, _res, next) {
  if (!req.usuario.familia_id) throw new HttpError(403, 'Você ainda não participa de uma família.');
  next();
}

export function exigirAdmin(req, _res, next) {
  if (req.usuario.papel !== 'ADMIN') throw new HttpError(403, 'Apenas o administrador da família pode fazer isso.');
  next();
}
