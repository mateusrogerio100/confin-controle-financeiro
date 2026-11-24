import { useEffect, useMemo, useState } from 'react';
import { Receipt, Search } from 'lucide-react';
import { api } from '../lib/api';
import { brl, dataRelativa, mesAtual, primeiroNome } from '../lib/format';
import { CATEGORIAS } from '../lib/categorias';
import { useApp } from '../context/AppContext';
import { useToast } from '../context/ToastContext';
import DespesaItem from '../components/DespesaItem';
import { Carregando, SeletorMes, Vazio } from '../components/ui';

export default function Historico() {
  const { versao, abrirDespesa } = useApp();
  const toast = useToast();
  const [mes, setMes] = useState(mesAtual());
  const [cat, setCat] = useState('');
  const [membro, setMembro] = useState('');
  const [busca, setBusca] = useState('');
  const [buscaAtiva, setBuscaAtiva] = useState('');
  const [despesas, setDespesas] = useState(null);
  const [membros, setMembros] = useState([]);

  // Debounce da busca
  useEffect(() => {
    const t = setTimeout(() => setBuscaAtiva(busca), 300);
    return () => clearTimeout(t);
  }, [busca]);

  useEffect(() => {
    api('/familias/minha').then((r) => setMembros(r.membros)).catch(() => {});
  }, [versao]);

  useEffect(() => {
    let ativo = true;
    const p = new URLSearchParams({ mes });
    if (cat) p.set('categoria', cat);
    if (membro) p.set('usuario_id', membro);
    if (buscaAtiva) p.set('busca', buscaAtiva);
    api(`/despesas?${p}`)
      .then((r) => ativo && setDespesas(r.despesas))
      .catch((e) => toast({ tipo: 'erro', titulo: e.message }));
    return () => { ativo = false; };
  }, [mes, cat, membro, buscaAtiva, versao, toast]);

  const grupos = useMemo(() => {
    const mapa = new Map();
    for (const d of despesas ?? []) {
      if (!mapa.has(d.data)) mapa.set(d.data, []);
      mapa.get(d.data).push(d);
    }
    return [...mapa.entries()];
  }, [despesas]);

  const total = (despesas ?? []).reduce((s, d) => s + d.valor, 0);

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-end justify-between gap-4 animate-fade-up">
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight sm:text-3xl">Histórico</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400">Todas as despesas da família</p>
        </div>
        <SeletorMes mes={mes} onChange={setMes} />
      </div>

      <div className="flex flex-col gap-3 sm:flex-row">
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute top-1/2 left-4 size-4 -translate-y-1/2 text-slate-400" />
          <input
            className="input pl-11"
            placeholder="Buscar pela descrição…"
            value={busca}
            onChange={(e) => setBusca(e.target.value)}
          />
        </div>
        <select className="input sm:w-48" value={membro} onChange={(e) => setMembro(e.target.value)} aria-label="Filtrar por membro">
          <option value="">Todos os membros</option>
          {membros.map((m) => (
            <option key={m.id} value={m.id}>{primeiroNome(m.nome)}</option>
          ))}
        </select>
      </div>

      <div className="no-scrollbar -mx-4 flex gap-2 overflow-x-auto px-4 sm:mx-0 sm:flex-wrap sm:px-0">
        <button onClick={() => setCat('')} className={`chip ${cat === '' ? 'chip-on' : 'chip-off'}`}>Todas</button>
        {Object.entries(CATEGORIAS).map(([k, { label, icon: Icone, cor }]) => (
          <button key={k} onClick={() => setCat(cat === k ? '' : k)} className={`chip ${cat === k ? 'chip-on' : 'chip-off'}`}>
            <Icone className="size-3.5" style={cat === k ? undefined : { color: cor }} />
            {label}
          </button>
        ))}
      </div>

      {despesas === null ? (
        <Carregando />
      ) : despesas.length === 0 ? (
        <div className="card">
          <Vazio icon={Receipt} titulo="Nenhuma despesa encontrada" texto="Tente outro mês ou remova os filtros." />
        </div>
      ) : (
        <>
          <div className="flex items-center justify-between rounded-2xl bg-slate-100 px-5 py-3 text-sm dark:bg-slate-900">
            <span className="text-slate-500 dark:text-slate-400">{despesas.length} lançamentos</span>
            <span>Total: <strong className="tabular-nums">{brl(total)}</strong></span>
          </div>
          <div className="space-y-4">
            {grupos.map(([data, itens]) => (
              <section key={data} className="card p-3 sm:p-4">
                <header className="flex justify-between px-2 pt-1 pb-2 text-xs font-semibold text-slate-500 dark:text-slate-400">
                  <span>{dataRelativa(data)}</span>
                  <span className="tabular-nums">{brl(itens.reduce((s, d) => s + d.valor, 0))}</span>
                </header>
                {itens.map((d) => (
                  <DespesaItem key={d.id} despesa={d} mostrarData={false} onClick={() => abrirDespesa(d)} />
                ))}
              </section>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
