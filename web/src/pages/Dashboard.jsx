import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { Bar, BarChart, CartesianGrid, Cell, Pie, PieChart, ReferenceLine, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { ArrowRight, CalendarDays, CircleCheck, Receipt, Settings2, TriangleAlert, TrendingUp } from 'lucide-react';
import { api } from '../lib/api';
import { brl, brlCurto, mesAtual, mesCurto, nomeMes, primeiroNome } from '../lib/format';
import { categoria, MEIOS } from '../lib/categorias';
import { useAuth } from '../context/AuthContext';
import { useApp } from '../context/AppContext';
import { useToast } from '../context/ToastContext';
import DespesaItem from '../components/DespesaItem';
import { Avatar, Carregando, NumeroAnimado, SeletorMes, Vazio } from '../components/ui';

const EIXO = { fontSize: 12, fill: '#94a3b8' };

function Dica({ children }) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs shadow-lg dark:border-slate-700 dark:bg-slate-800">
      {children}
    </div>
  );
}

export default function Dashboard() {
  const { usuario } = useAuth();
  const { versao, abrirDespesa } = useApp();
  const toast = useToast();
  const [mes, setMes] = useState(mesAtual());
  const [r, setR] = useState(null);
  const [pulso, setPulso] = useState(0);
  const primeiraCarga = useRef(true);

  useEffect(() => {
    let ativo = true;
    api(`/despesas/resumo?mes=${mes}`)
      .then((dados) => {
        if (!ativo) return;
        setR(dados);
        if (!primeiraCarga.current) setPulso((p) => p + 1);
        primeiraCarga.current = false;
      })
      .catch((e) => toast({ tipo: 'erro', titulo: e.message }));
    return () => { ativo = false; };
  }, [mes, versao, toast]);

  useEffect(() => { primeiraCarga.current = true; }, [mes]);

  if (!r) return <Carregando />;

  const semLimite = r.limite <= 0;
  const qtd = r.por_categoria.reduce((s, c) => s + c.quantidade, 0);
  const corBarra = r.alerta === 'ESTOURADO' ? 'bg-red-400' : r.alerta === 'ATENCAO' ? 'bg-amber-300' : 'bg-white';

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4 animate-fade-up">
        <div>
          <p className="text-sm font-medium text-slate-500 dark:text-slate-400">Olá, {primeiroNome(usuario.nome)} 👋</p>
          <h1 className="text-2xl font-extrabold tracking-tight sm:text-3xl">Resumo da família</h1>
        </div>
        <SeletorMes mes={mes} onChange={setMes} />
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        {/* Card principal de saldo */}
        <section className="relative animate-fade-up overflow-hidden rounded-3xl bg-gradient-to-br from-brand-500 via-brand-700 to-emerald-950 p-6 text-white shadow-xl shadow-brand-900/20 sm:p-8 lg:col-span-2">
          {pulso > 0 && <span key={pulso} className="pointer-events-none absolute inset-0 animate-flash bg-white" />}
          <div className="pointer-events-none absolute -top-24 -right-16 size-72 rounded-full bg-white/10 blur-2xl" />
          <div className="pointer-events-none absolute -bottom-32 left-10 size-72 rounded-full bg-emerald-300/10 blur-3xl" />

          <div className="relative">
            <p className="text-sm font-medium text-white/75">
              {semLimite ? 'Total gasto' : r.saldo < 0 ? 'Acima do limite' : 'Saldo disponível'} em {nomeMes(mes).split(' ')[0]}
            </p>
            <p className="mt-1 text-4xl font-extrabold tracking-tight tabular-nums sm:text-5xl">
              <NumeroAnimado valor={semLimite ? r.total : r.saldo} formatar={brl} />
            </p>

            {semLimite ? (
              <Link to="/familia" className="mt-5 inline-flex items-center gap-2 rounded-xl bg-white/15 px-3 py-2 text-sm font-semibold hover:bg-white/25">
                <Settings2 className="size-4" /> Defina um limite mensal para acompanhar o orçamento
              </Link>
            ) : (
              <>
                <div className="mt-6 h-3 overflow-hidden rounded-full bg-white/20">
                  <div
                    className={`h-full rounded-full transition-all duration-700 ${corBarra}`}
                    style={{ width: `${Math.min(100, r.percentual)}%` }}
                  />
                </div>
                <div className="mt-2 flex justify-between text-sm text-white/80">
                  <span><strong className="text-white">{brl(r.total)}</strong> gastos</span>
                  <span>{r.percentual.toLocaleString('pt-BR')}% de {brl(r.limite)}</span>
                </div>

                <div className="mt-5 flex flex-wrap gap-2">
                  {r.alerta === 'OK' ? (
                    <span className="inline-flex items-center gap-1.5 rounded-full bg-white/15 px-3 py-1.5 text-xs font-semibold">
                      <CircleCheck className="size-4" /> Dentro do orçamento
                    </span>
                  ) : (
                    <span className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-bold ${r.alerta === 'ESTOURADO' ? 'bg-red-500 text-white' : 'bg-amber-300 text-amber-950'}`}>
                      <TriangleAlert className="size-4" />
                      {r.alerta === 'ESTOURADO' ? 'Orçamento estourado' : 'Atenção: acima de 80%'}
                    </span>
                  )}
                  {r.disponivel_por_dia !== null && r.saldo > 0 && (
                    <span className="inline-flex items-center gap-1.5 rounded-full bg-white/15 px-3 py-1.5 text-xs font-semibold">
                      <CalendarDays className="size-4" /> {brl(r.disponivel_por_dia)}/dia nos próximos {r.dias_restantes} dias
                    </span>
                  )}
                  <span className="inline-flex items-center gap-1.5 rounded-full bg-white/15 px-3 py-1.5 text-xs font-semibold">
                    <Receipt className="size-4" /> {qtd} lançamentos
                  </span>
                </div>
              </>
            )}
          </div>
        </section>

        {/* Quem gastou */}
        <section className="card animate-fade-up [animation-delay:60ms]">
          <h2 className="card-title">Quem gastou</h2>
          {r.por_membro.length === 0 ? (
            <p className="mt-6 text-sm text-slate-400">Nenhum gasto ainda.</p>
          ) : (
            <ul className="mt-4 space-y-4">
              {r.por_membro.map((m) => (
                <li key={m.id ?? 'ex'} className="flex items-center gap-3">
                  <Avatar nome={m.nome} id={m.id} />
                  <div className="min-w-0 flex-1">
                    <div className="flex justify-between gap-2 text-sm">
                      <span className="truncate font-semibold">{primeiroNome(m.nome)}</span>
                      <span className="font-bold tabular-nums">{brl(m.total)}</span>
                    </div>
                    <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800">
                      <div className="h-full rounded-full bg-slate-400 dark:bg-slate-500" style={{ width: `${(m.total / r.total) * 100}%` }} />
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>

      <div className="grid gap-4 lg:grid-cols-5">
        {/* Por categoria */}
        <section className="card animate-fade-up [animation-delay:120ms] lg:col-span-2">
          <h2 className="card-title">Gastos por categoria</h2>
          {r.por_categoria.length === 0 ? (
            <Vazio icon={TrendingUp} titulo="Sem gastos neste mês" texto="As despesas registradas aparecem aqui." />
          ) : (
            <div className="mt-2 flex flex-col items-center gap-4 sm:flex-row lg:flex-col xl:flex-row">
              <div className="relative size-44 shrink-0 text-white dark:text-slate-900">
                <ResponsiveContainer>
                  <PieChart>
                    <Pie
                      data={r.por_categoria}
                      dataKey="total"
                      nameKey="categoria"
                      innerRadius="68%"
                      outerRadius="100%"
                      stroke="currentColor"
                      strokeWidth={2}
                      cornerRadius={4}
                      isAnimationActive={false}
                    >
                      {r.por_categoria.map((c) => <Cell key={c.categoria} fill={categoria(c.categoria).cor} />)}
                    </Pie>
                    <Tooltip
                      content={({ active, payload }) =>
                        active && payload?.[0] ? (
                          <Dica>
                            <p className="font-semibold">{categoria(payload[0].payload.categoria).label}</p>
                            <p className="tabular-nums">{brl(payload[0].value)} · {payload[0].payload.quantidade} lanç.</p>
                          </Dica>
                        ) : null
                      }
                    />
                  </PieChart>
                </ResponsiveContainer>
                <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
                  <span className="text-xs text-slate-500 dark:text-slate-400">Total</span>
                  <span className="text-base font-extrabold text-slate-900 tabular-nums dark:text-white">{brlCurto(r.total)}</span>
                </div>
              </div>
              <ul className="w-full space-y-2">
                {r.por_categoria.map((c) => {
                  const { label, cor } = categoria(c.categoria);
                  return (
                    <li key={c.categoria} className="flex items-center gap-2.5 text-sm">
                      <span className="size-2.5 shrink-0 rounded-full" style={{ backgroundColor: cor }} />
                      <span className="flex-1 truncate text-slate-600 dark:text-slate-300">{label}</span>
                      <span className="font-semibold tabular-nums">{brl(c.total)}</span>
                      <span className="w-10 text-right text-xs text-slate-400 tabular-nums">{Math.round((c.total / r.total) * 100)}%</span>
                    </li>
                  );
                })}
              </ul>
            </div>
          )}
        </section>

        {/* Últimos 6 meses */}
        <section className="card animate-fade-up [animation-delay:180ms] lg:col-span-3">
          <div className="flex items-center justify-between">
            <h2 className="card-title">Últimos 6 meses</h2>
            {!semLimite && (
              <span className="flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400">
                <span className="w-4 border-t-2 border-dashed border-slate-400" /> Limite {brl(r.limite)}
              </span>
            )}
          </div>
          <div className="mt-4 h-60">
            <ResponsiveContainer>
              <BarChart data={r.historico} margin={{ top: 8, right: 4, left: 0, bottom: 0 }}>
                <CartesianGrid vertical={false} stroke="#94a3b8" strokeOpacity={0.15} />
                <XAxis dataKey="mes" tickFormatter={mesCurto} tick={EIXO} axisLine={false} tickLine={false} />
                <YAxis tickFormatter={brlCurto} tick={EIXO} axisLine={false} tickLine={false} width={78} />
                <Tooltip
                  cursor={{ fill: '#94a3b8', fillOpacity: 0.08 }}
                  content={({ active, payload }) =>
                    active && payload?.[0] ? (
                      <Dica>
                        <p className="font-semibold">{nomeMes(payload[0].payload.mes)}</p>
                        <p className="tabular-nums">{brl(payload[0].value)}</p>
                        {!semLimite && (
                          <p className={payload[0].value > r.limite ? 'text-red-500' : 'text-slate-500'}>
                            {payload[0].value > r.limite ? 'Acima' : 'Dentro'} do limite
                          </p>
                        )}
                      </Dica>
                    ) : null
                  }
                />
                {!semLimite && <ReferenceLine y={r.limite} stroke="#94a3b8" strokeDasharray="5 4" strokeWidth={1.5} />}
                <Bar dataKey="total" radius={[6, 6, 0, 0]} maxBarSize={44}>
                  {r.historico.map((h) => (
                    <Cell key={h.mes} fill={h.mes === mes ? '#059669' : '#a7f3d0'} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </section>
      </div>

      <div className="grid gap-4 lg:grid-cols-5">
        {/* Últimas transações */}
        <section className="card animate-fade-up [animation-delay:240ms] lg:col-span-3">
          <div className="flex items-center justify-between">
            <h2 className="card-title">Últimas transações</h2>
            <Link to="/historico" className="inline-flex items-center gap-1 text-sm font-semibold text-brand-600 hover:underline dark:text-brand-400">
              Ver todas <ArrowRight className="size-4" />
            </Link>
          </div>
          {r.ultimas.length === 0 ? (
            <Vazio icon={Receipt} titulo="Nenhuma despesa neste mês">
              <button onClick={() => abrirDespesa()} className="btn-primary mt-4">Registrar a primeira</button>
            </Vazio>
          ) : (
            <div className="mt-2 -mx-2">
              {r.ultimas.map((d) => <DespesaItem key={d.id} despesa={d} onClick={() => abrirDespesa(d)} />)}
            </div>
          )}
        </section>

        {/* Meios de pagamento */}
        <section className="card animate-fade-up [animation-delay:300ms] lg:col-span-2">
          <h2 className="card-title">Meios de pagamento</h2>
          {r.por_meio.length === 0 ? (
            <p className="mt-6 text-sm text-slate-400">Nenhum gasto ainda.</p>
          ) : (
            <ul className="mt-4 space-y-4">
              {r.por_meio.map((m) => {
                const { label, icon: Icone } = MEIOS[m.meio_pagamento];
                const pct = (m.total / r.total) * 100;
                return (
                  <li key={m.meio_pagamento}>
                    <div className="flex items-center gap-2 text-sm">
                      <Icone className="size-4 text-slate-400" />
                      <span className="flex-1 font-medium">{label}</span>
                      <span className="font-semibold tabular-nums">{brl(m.total)}</span>
                    </div>
                    <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800">
                      <div className="h-full rounded-full bg-brand-500" style={{ width: `${pct}%` }} />
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </section>
      </div>
    </div>
  );
}
