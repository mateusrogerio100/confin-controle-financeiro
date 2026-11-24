export class HttpError extends Error {
  constructor(status, message) {
    super(message);
    this.status = status;
  }
}

export const CATEGORIAS = ['MERCADO', 'MORADIA', 'TRANSPORTE', 'SAUDE', 'LAZER', 'EDUCACAO', 'ALIMENTACAO', 'OUTROS'];
export const MEIOS_PAGAMENTO = ['CREDITO', 'DEBITO', 'PIX', 'DINHEIRO'];

const TZ = 'America/Sao_Paulo';

/** Data de hoje no fuso de Brasília, formato YYYY-MM-DD. */
export function hojeISO() {
  return new Intl.DateTimeFormat('en-CA', { timeZone: TZ }).format(new Date());
}

/** Mês atual, formato YYYY-MM. */
export function mesAtual() {
  return hojeISO().slice(0, 7);
}

export function validarMes(mes) {
  if (mes === undefined || mes === '') return mesAtual();
  if (!/^\d{4}-(0[1-9]|1[0-2])$/.test(mes)) throw new HttpError(400, 'Mês inválido (use AAAA-MM).');
  return mes;
}

export function validarData(data) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(data) || Number.isNaN(Date.parse(data))) {
    throw new HttpError(400, 'Data inválida.');
  }
  return data;
}

export function validarEmail(email) {
  const e = String(email ?? '').trim().toLowerCase();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e)) throw new HttpError(400, 'E-mail inválido.');
  return e;
}

export function texto(valor, campo, { min = 1, max = 80, opcional = false } = {}) {
  const t = String(valor ?? '').trim();
  if (!t && opcional) return null;
  if (t.length < min || t.length > max) {
    throw new HttpError(400, `${campo} deve ter entre ${min} e ${max} caracteres.`);
  }
  return t;
}

/** Valida valor monetário. RN002: precisa ser positivo. */
export function validarValor(valor, { permitirZero = false } = {}) {
  const n = typeof valor === 'string' ? Number(valor.replace(',', '.')) : Number(valor);
  if (!Number.isFinite(n)) throw new HttpError(400, 'Valor inválido.');
  if (permitirZero ? n < 0 : n <= 0) throw new HttpError(400, 'O valor deve ser maior que zero.');
  if (n > 9_999_999) throw new HttpError(400, 'Valor muito alto.');
  return Math.round(n * 100) / 100;
}

const ALFABETO = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
export function gerarCodigo(tamanho = 6) {
  let c = '';
  for (let i = 0; i < tamanho; i++) c += ALFABETO[Math.floor(Math.random() * ALFABETO.length)];
  return c;
}
