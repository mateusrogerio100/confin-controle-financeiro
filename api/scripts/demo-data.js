// Dados da "Família Souza" de demonstração (usados por seed.js e seed-sql.js).
import { hojeISO } from '../src/util.js';

export const SENHA = '123456';
export const LIMITE = 4500;
export const CODIGO = 'SOUZA1';
export const MEMBROS = [
  { nome: 'Ana Souza', email: 'ana@confin.app', papel: 'ADMIN' },
  { nome: 'Carlos Souza', email: 'carlos@confin.app', papel: 'MEMBRO' },
  { nome: 'Júlia Souza', email: 'julia@confin.app', papel: 'MEMBRO' },
];

// [descricao, categoria, meio, min, max, vezes por mês, quem (índice) | null = aleatório, dia fixo]
const MODELO = [
  ['Condomínio', 'MORADIA', 'PIX', 640, 640, 1, 0, 5],
  ['Conta de luz', 'MORADIA', 'DEBITO', 170, 260, 1, 0, 10],
  ['Conta de água', 'MORADIA', 'DEBITO', 80, 120, 1, 0, 12],
  ['Internet fibra', 'MORADIA', 'CREDITO', 119.9, 119.9, 1, 1, 15],
  ['Curso de inglês', 'EDUCACAO', 'CREDITO', 289, 289, 1, 0, 8],
  ['Supermercado', 'MERCADO', 'CREDITO', 260, 480, 3, null],
  ['Hortifruti', 'MERCADO', 'PIX', 45, 95, 2, null],
  ['Padaria', 'ALIMENTACAO', 'PIX', 12, 38, 5, null],
  ['iFood', 'ALIMENTACAO', 'CREDITO', 55, 110, 3, null],
  ['Farmácia', 'SAUDE', 'DEBITO', 35, 160, 2, null],
  ['Combustível', 'TRANSPORTE', 'CREDITO', 180, 260, 2, 1],
  ['Uber', 'TRANSPORTE', 'PIX', 18, 45, 2, 2],
  ['Cinema', 'LAZER', 'CREDITO', 60, 110, 1, 2],
  ['Passeio no parque', 'LAZER', 'DINHEIRO', 40, 90, 1, null],
  ['Presente de aniversário', 'OUTROS', 'PIX', 70, 150, 1, null],
];

/**
 * Gera 6 meses de despesas terminando hoje. "membro" é o índice em MEMBROS.
 * O mês atual fica em ~72% do limite, para a demo cruzar os 80% ao vivo.
 */
export function gerarDespesas() {
  // PRNG determinístico: a demo é sempre igual
  let semente = 42;
  const rand = () => {
    semente = (semente + 0x6d2b79f5) | 0;
    let t = Math.imul(semente ^ (semente >>> 15), 1 | semente);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };

  function gerarMes(ano, mes, ultimoDia, fator) {
    const lista = [];
    for (const [descricao, categoria, meio, min, max, vezes, quem, diaFixo] of MODELO) {
      for (let i = 0; i < vezes; i++) {
        const dia = diaFixo ? Math.min(diaFixo, ultimoDia) : 1 + Math.floor(rand() * ultimoDia);
        lista.push({
          descricao,
          categoria,
          meio,
          valor: Math.round((min + rand() * (max - min)) * fator * 100) / 100,
          data: `${ano}-${String(mes).padStart(2, '0')}-${String(dia).padStart(2, '0')}`,
          membro: quem ?? Math.floor(rand() * MEMBROS.length),
        });
      }
    }
    return lista;
  }

  const [anoAtual, mesAtual, diaAtual] = hojeISO().split('-').map(Number);
  const despesas = [];

  const fatores = [0.95, 1.1, 0.9, 1.2, 1.0];
  for (let k = 5; k >= 1; k--) {
    const ref = new Date(anoAtual, mesAtual - 1 - k, 1);
    const ultimo = new Date(ref.getFullYear(), ref.getMonth() + 1, 0).getDate();
    despesas.push(...gerarMes(ref.getFullYear(), ref.getMonth() + 1, ultimo, fatores[k - 1]));
  }

  const atual = gerarMes(anoAtual, mesAtual, diaAtual, 1);
  const soma = atual.reduce((s, d) => s + d.valor, 0);
  const ajuste = (LIMITE * 0.72) / soma;
  for (const d of atual) d.valor = Math.round(d.valor * ajuste * 100) / 100;
  despesas.push(...atual);

  return despesas;
}
