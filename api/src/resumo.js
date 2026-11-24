import { query } from './db.js';
import { hojeISO, mesAtual } from './util.js';

/** RN004 - níveis de alerta do orçamento */
export function nivelAlerta(percentual) {
  if (percentual >= 100) return 'ESTOURADO';
  if (percentual >= 80) return 'ATENCAO';
  return 'OK';
}

/**
 * Lógica central (seção 10 da documentação):
 * saldo_restante = limite_mensal - soma das despesas do mês.
 */
export async function saldoDoMes(familiaId, mes = mesAtual()) {
  const { rows } = await query(
    `SELECT f.limite_mensal AS limite,
            COALESCE(SUM(d.valor), 0) AS total
       FROM familia f
       LEFT JOIN despesa d ON d.familia_id = f.id
            AND d.data >= $2::date
            AND d.data <  $2::date + INTERVAL '1 month'
      WHERE f.id = $1
      GROUP BY f.id`,
    [familiaId, `${mes}-01`],
  );
  const { limite, total } = rows[0];
  const percentual = limite > 0 ? (total / limite) * 100 : 0;
  return {
    mes,
    limite,
    total,
    saldo: Math.round((limite - total) * 100) / 100,
    percentual: Math.round(percentual * 10) / 10,
    alerta: limite > 0 ? nivelAlerta(percentual) : 'OK',
  };
}

/** Dados completos do Dashboard (RF004). */
export async function resumoCompleto(familiaId, mes) {
  const params = [familiaId, `${mes}-01`];
  const filtroMes = `d.familia_id = $1
    AND d.data >= $2::date
    AND d.data <  $2::date + INTERVAL '1 month'`;

  const [saldo, porCategoria, porMembro, porMeio, historico, ultimas] = await Promise.all([
    saldoDoMes(familiaId, mes),
    query(
      `SELECT categoria, SUM(valor) AS total, COUNT(*) AS quantidade
         FROM despesa d WHERE ${filtroMes}
        GROUP BY categoria ORDER BY total DESC`,
      params,
    ),
    query(
      `SELECT u.id, COALESCE(u.nome, 'Ex-membro') AS nome, SUM(d.valor) AS total, COUNT(*) AS quantidade
         FROM despesa d LEFT JOIN usuario u ON u.id = d.usuario_id
        WHERE ${filtroMes}
        GROUP BY u.id, u.nome ORDER BY total DESC`,
      params,
    ),
    query(
      `SELECT meio_pagamento, SUM(valor) AS total
         FROM despesa d WHERE ${filtroMes}
        GROUP BY meio_pagamento ORDER BY total DESC`,
      params,
    ),
    query(
      `SELECT to_char(m.inicio, 'YYYY-MM') AS mes, COALESCE(SUM(d.valor), 0) AS total
         FROM generate_series($2::date - INTERVAL '5 months', $2::date, INTERVAL '1 month') AS m(inicio)
         LEFT JOIN despesa d ON d.familia_id = $1
              AND d.data >= m.inicio AND d.data < m.inicio + INTERVAL '1 month'
        GROUP BY m.inicio ORDER BY m.inicio`,
      params,
    ),
    query(
      `SELECT d.*, u.nome AS usuario_nome
         FROM despesa d LEFT JOIN usuario u ON u.id = d.usuario_id
        WHERE ${filtroMes}
        ORDER BY d.data DESC, d.id DESC LIMIT 6`,
      params,
    ),
  ]);

  // Quanto ainda dá para gastar por dia até o fim do mês (só no mês corrente)
  let diasRestantes = null;
  let porDia = null;
  if (mes === mesAtual()) {
    const hoje = hojeISO();
    const [a, m, d] = hoje.split('-').map(Number);
    const ultimoDia = new Date(a, m, 0).getDate();
    diasRestantes = ultimoDia - d + 1;
    porDia = saldo.saldo > 0 ? Math.floor((saldo.saldo / diasRestantes) * 100) / 100 : 0;
  }

  return {
    ...saldo,
    dias_restantes: diasRestantes,
    disponivel_por_dia: porDia,
    por_categoria: porCategoria.rows,
    por_membro: porMembro.rows,
    por_meio: porMeio.rows,
    historico: historico.rows,
    ultimas: ultimas.rows,
  };
}
