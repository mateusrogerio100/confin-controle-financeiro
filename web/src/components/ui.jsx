import { useEffect, useRef, useState } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { corAvatar, iniciais, mesAtual, nomeMes, somarMes } from '../lib/format';
import { categoria } from '../lib/categorias';

export function Logo({ className = 'size-9' }) {
  return <img src="/icon.svg" alt="" className={`${className} rounded-xl shadow-lg shadow-brand-600/30`} />;
}

export function Avatar({ nome, id, className = 'size-9 text-xs' }) {
  return (
    <span
      className={`inline-flex shrink-0 items-center justify-center rounded-full font-bold text-white ${className}`}
      style={{ backgroundColor: corAvatar(id) }}
      title={nome}
    >
      {iniciais(nome)}
    </span>
  );
}

export function IconeCategoria({ cat, className = 'size-11' }) {
  const { icon: Icone, cor } = categoria(cat);
  return (
    <span
      className={`inline-flex shrink-0 items-center justify-center rounded-2xl ${className}`}
      style={{ backgroundColor: `${cor}1f`, color: cor }}
    >
      <Icone className="size-[45%]" strokeWidth={2.2} />
    </span>
  );
}

export function SeletorMes({ mes, onChange }) {
  const atual = mes === mesAtual();
  return (
    <div className="inline-flex items-center gap-1 rounded-2xl border border-slate-200 bg-white p-1 dark:border-slate-800 dark:bg-slate-900">
      <button className="btn-icon size-8" onClick={() => onChange(somarMes(mes, -1))} aria-label="Mês anterior">
        <ChevronLeft className="size-4" />
      </button>
      <span className="min-w-32 text-center text-sm font-semibold">{nomeMes(mes)}</span>
      <button
        className="btn-icon size-8 disabled:opacity-30"
        onClick={() => onChange(somarMes(mes, 1))}
        disabled={atual}
        aria-label="Próximo mês"
      >
        <ChevronRight className="size-4" />
      </button>
    </div>
  );
}

/** Número que "conta" até o valor final (efeito no saldo do dashboard). */
export function NumeroAnimado({ valor, formatar }) {
  const [exibido, setExibido] = useState(valor);
  const anterior = useRef(valor);

  useEffect(() => {
    const inicio = anterior.current;
    const fim = valor;
    anterior.current = valor;
    if (inicio === fim) return;
    const t0 = performance.now();
    const dur = 700;
    let raf;
    const passo = (t) => {
      const p = Math.min(1, (t - t0) / dur);
      const e = 1 - (1 - p) ** 3;
      setExibido(inicio + (fim - inicio) * e);
      if (p < 1) raf = requestAnimationFrame(passo);
    };
    raf = requestAnimationFrame(passo);
    return () => cancelAnimationFrame(raf);
  }, [valor]);

  return formatar(exibido);
}

export function Vazio({ icon: Icone, titulo, texto, children }) {
  return (
    <div className="flex flex-col items-center px-6 py-12 text-center">
      <span className="mb-4 inline-flex size-14 items-center justify-center rounded-2xl bg-slate-100 text-slate-400 dark:bg-slate-800">
        <Icone className="size-7" />
      </span>
      <p className="font-semibold">{titulo}</p>
      {texto && <p className="mt-1 max-w-xs text-sm text-slate-500 dark:text-slate-400">{texto}</p>}
      {children}
    </div>
  );
}

export function Carregando() {
  return (
    <div className="flex justify-center py-16">
      <span className="size-8 animate-spin rounded-full border-3 border-brand-500 border-t-transparent" />
    </div>
  );
}
