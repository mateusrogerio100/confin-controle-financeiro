const moeda = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' });
const moedaCurta = new Intl.NumberFormat('pt-BR', {
  style: 'currency',
  currency: 'BRL',
  notation: 'compact',
  maximumFractionDigits: 1,
});

export const brl = (n) => moeda.format(n ?? 0);
export const brlCurto = (n) => moedaCurta.format(n ?? 0);

const MESES = ['Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho', 'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'];
const MESES_CURTOS = ['jan', 'fev', 'mar', 'abr', 'mai', 'jun', 'jul', 'ago', 'set', 'out', 'nov', 'dez'];
const DIAS = ['domingo', 'segunda', 'terça', 'quarta', 'quinta', 'sexta', 'sábado'];

/** Data local de hoje (YYYY-MM-DD). */
export function hojeISO() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}
export const mesAtual = () => hojeISO().slice(0, 7);

export function somarMes(mes, delta) {
  const [a, m] = mes.split('-').map(Number);
  const d = new Date(a, m - 1 + delta, 1);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
}

export function nomeMes(mes) {
  const [a, m] = mes.split('-').map(Number);
  return `${MESES[m - 1]} ${a}`;
}
export function mesCurto(mes) {
  return MESES_CURTOS[Number(mes.split('-')[1]) - 1];
}

export function dataCurta(iso) {
  const [, m, d] = iso.split('-').map(Number);
  return `${String(d).padStart(2, '0')} ${MESES_CURTOS[m - 1]}`;
}

/** "Hoje", "Ontem" ou "Segunda, 03 nov" */
export function dataRelativa(iso) {
  const hoje = hojeISO();
  const ontem = new Date();
  ontem.setDate(ontem.getDate() - 1);
  const ontemISO = `${ontem.getFullYear()}-${String(ontem.getMonth() + 1).padStart(2, '0')}-${String(ontem.getDate()).padStart(2, '0')}`;
  if (iso === hoje) return 'Hoje';
  if (iso === ontemISO) return 'Ontem';
  const [a, m, d] = iso.split('-').map(Number);
  const dia = DIAS[new Date(a, m - 1, d).getDay()];
  return `${dia[0].toUpperCase()}${dia.slice(1)}, ${dataCurta(iso)}`;
}

export function iniciais(nome = '') {
  const partes = nome.trim().split(/\s+/);
  return ((partes[0]?.[0] ?? '') + (partes.length > 1 ? partes.at(-1)[0] : '')).toUpperCase();
}

export const primeiroNome = (nome = '') => nome.trim().split(/\s+/)[0];

const CORES_AVATAR = ['#10b981', '#6366f1', '#f59e0b', '#ec4899', '#0ea5e9', '#8b5cf6', '#ef4444', '#14b8a6'];
export const corAvatar = (id = 0) => CORES_AVATAR[Math.abs(Number(id)) % CORES_AVATAR.length];
