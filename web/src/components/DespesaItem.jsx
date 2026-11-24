import { brl, dataCurta, primeiroNome } from '../lib/format';
import { categoria, MEIOS } from '../lib/categorias';
import { IconeCategoria } from './ui';

export default function DespesaItem({ despesa: d, onClick, mostrarData = true }) {
  const cat = categoria(d.categoria);
  return (
    <button
      onClick={onClick}
      className="flex w-full cursor-pointer items-center gap-3 rounded-2xl p-2 text-left transition hover:bg-slate-50 dark:hover:bg-slate-800/60"
    >
      <IconeCategoria cat={d.categoria} />
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-semibold">{d.descricao || cat.label}</p>
        <p className="truncate text-xs text-slate-500 dark:text-slate-400">
          {primeiroNome(d.usuario_nome || 'Ex-membro')} · {MEIOS[d.meio_pagamento]?.label}
          {mostrarData && ` · ${dataCurta(d.data)}`}
        </p>
      </div>
      <span className="text-sm font-bold tabular-nums">-{brl(d.valor)}</span>
    </button>
  );
}
