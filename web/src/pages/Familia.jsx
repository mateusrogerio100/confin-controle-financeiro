import { useEffect, useState } from 'react';
import { Check, Copy, Crown, LogOut, Mail, Moon, Pencil, RefreshCw, Sun, UserMinus, X } from 'lucide-react';
import { api } from '../lib/api';
import { brl } from '../lib/format';
import { useTema } from '../lib/tema';
import { useAuth } from '../context/AuthContext';
import { useApp } from '../context/AppContext';
import { useToast } from '../context/ToastContext';
import { Avatar, Carregando } from '../components/ui';

export default function Familia() {
  const { usuario, sair, recarregar } = useAuth();
  const { versao, atualizar } = useApp();
  const toast = useToast();
  const [escuro, alternarTema] = useTema();
  const [dados, setDados] = useState(null);
  const [editandoLimite, setEditandoLimite] = useState(false);
  const [limite, setLimite] = useState('');
  const [email, setEmail] = useState('');
  const [copiado, setCopiado] = useState(false);
  const [removendo, setRemovendo] = useState(null);
  const admin = usuario.papel === 'ADMIN';

  useEffect(() => {
    api('/familias/minha').then(setDados).catch((e) => toast({ tipo: 'erro', titulo: e.message }));
  }, [versao, toast]);

  if (!dados) return <Carregando />;
  const { familia, membros, convites } = dados;

  const executar = async (fn, sucesso) => {
    try {
      const r = await fn();
      if (sucesso) toast({ tipo: 'sucesso', titulo: typeof sucesso === 'function' ? sucesso(r) : sucesso });
      atualizar();
      return true;
    } catch (e) {
      toast({ tipo: 'erro', titulo: e.message });
      return false;
    }
  };

  const salvarLimite = async (e) => {
    e.preventDefault();
    const ok = await executar(
      () => api('/familias/minha', { method: 'PATCH', body: { limite_mensal: limite.replace(/\./g, '').replace(',', '.') } }),
      'Limite mensal atualizado',
    );
    if (ok) setEditandoLimite(false);
  };

  const convidar = async (e) => {
    e.preventDefault();
    const ok = await executar(
      () => api('/familias/minha/convites', { method: 'POST', body: { email } }),
      (r) => r.mensagem,
    );
    if (ok) setEmail('');
  };

  const copiar = async () => {
    try {
      await navigator.clipboard.writeText(familia.codigo_convite);
      setCopiado(true);
      setTimeout(() => setCopiado(false), 2000);
    } catch {
      toast({ tipo: 'info', titulo: `Código: ${familia.codigo_convite}` });
    }
  };

  const sairDaFamilia = async () => {
    try {
      await api('/familias/minha/sair', { method: 'POST' });
      await recarregar();
    } catch (e) {
      toast({ tipo: 'erro', titulo: e.message });
    }
  };

  return (
    <div className="space-y-6">
      <div className="animate-fade-up">
        <h1 className="text-2xl font-extrabold tracking-tight sm:text-3xl">{familia.nome}</h1>
        <p className="text-sm text-slate-500 dark:text-slate-400">
          {membros.length} {membros.length === 1 ? 'membro' : 'membros'} compartilhando o orçamento
        </p>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        {/* Limite */}
        <section className="card animate-fade-up">
          <h2 className="card-title">Limite mensal do orçamento</h2>
          {editandoLimite ? (
            <form onSubmit={salvarLimite} className="mt-3 flex gap-2">
              <div className="relative flex-1">
                <span className="pointer-events-none absolute top-1/2 left-4 -translate-y-1/2 text-sm font-semibold text-slate-400">R$</span>
                <input
                  autoFocus
                  inputMode="decimal"
                  className="input pl-11 text-lg font-bold"
                  value={limite}
                  onChange={(e) => setLimite(e.target.value.replace(/[^\d.,]/g, ''))}
                />
              </div>
              <button className="btn-primary" aria-label="Salvar"><Check className="size-5" /></button>
              <button type="button" className="btn-secondary" onClick={() => setEditandoLimite(false)} aria-label="Cancelar">
                <X className="size-5" />
              </button>
            </form>
          ) : (
            <div className="mt-2 flex items-center justify-between">
              <p className="text-3xl font-extrabold tracking-tight tabular-nums">{brl(familia.limite_mensal)}</p>
              {admin && (
                <button
                  className="btn-secondary"
                  onClick={() => {
                    setLimite(String(familia.limite_mensal).replace('.', ','));
                    setEditandoLimite(true);
                  }}
                >
                  <Pencil className="size-4" /> Alterar
                </button>
              )}
            </div>
          )}
          <p className="mt-3 text-xs text-slate-500 dark:text-slate-400">
            Você recebe um alerta ao atingir 80% e ao ultrapassar 100% do limite.
            {!admin && ' Apenas o administrador pode alterar.'}
          </p>
        </section>

        {/* Convite */}
        <section className="card animate-fade-up [animation-delay:60ms]">
          <h2 className="card-title">Convidar para a família</h2>
          <div className="mt-3 flex items-center gap-3 rounded-2xl border-2 border-dashed border-brand-300 bg-brand-50 p-3 dark:border-brand-800 dark:bg-brand-500/5">
            <div className="flex-1">
              <p className="text-xs font-medium text-slate-500 dark:text-slate-400">Código de convite</p>
              <p className="font-mono text-2xl font-bold tracking-[0.3em] text-brand-700 dark:text-brand-400">{familia.codigo_convite}</p>
            </div>
            <button onClick={copiar} className="btn-icon" aria-label="Copiar código">
              {copiado ? <Check className="size-5 text-brand-600" /> : <Copy className="size-5" />}
            </button>
            {admin && (
              <button
                onClick={() => executar(() => api('/familias/minha/codigo', { method: 'POST' }), 'Novo código gerado')}
                className="btn-icon"
                aria-label="Gerar novo código"
                title="Gerar novo código"
              >
                <RefreshCw className="size-5" />
              </button>
            )}
          </div>
          {admin && (
            <form onSubmit={convidar} className="mt-3 flex gap-2">
              <div className="relative flex-1">
                <Mail className="pointer-events-none absolute top-1/2 left-4 size-4 -translate-y-1/2 text-slate-400" />
                <input
                  type="email"
                  required
                  className="input pl-11"
                  placeholder="email@exemplo.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>
              <button className="btn-primary">Adicionar</button>
            </form>
          )}
          {convites.length > 0 && (
            <ul className="mt-3 space-y-1.5">
              {convites.map((c) => (
                <li key={c.id} className="flex items-center gap-2 rounded-xl bg-slate-50 px-3 py-2 text-sm dark:bg-slate-800/60">
                  <Mail className="size-4 text-slate-400" />
                  <span className="flex-1 truncate">{c.email}</span>
                  <span className="text-xs text-amber-600 dark:text-amber-400">Aguardando cadastro</span>
                  {admin && (
                    <button
                      className="text-slate-400 hover:text-red-500"
                      onClick={() => executar(() => api(`/familias/minha/convites/${c.id}`, { method: 'DELETE' }))}
                      aria-label="Cancelar convite"
                    >
                      <X className="size-4" />
                    </button>
                  )}
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>

      {/* Membros */}
      <section className="card animate-fade-up [animation-delay:120ms]">
        <h2 className="card-title">Membros</h2>
        <ul className="mt-2 divide-y divide-slate-100 dark:divide-slate-800">
          {membros.map((m) => (
            <li key={m.id} className="flex items-center gap-3 py-3">
              <Avatar nome={m.nome} id={m.id} className="size-11 text-sm" />
              <div className="min-w-0 flex-1">
                <p className="flex items-center gap-2 truncate text-sm font-semibold">
                  {m.nome} {m.id === usuario.id && <span className="text-xs font-normal text-slate-400">(você)</span>}
                </p>
                <p className="truncate text-xs text-slate-500 dark:text-slate-400">{m.email}</p>
              </div>
              {m.papel === 'ADMIN' ? (
                <span className="inline-flex items-center gap-1 rounded-full bg-amber-100 px-2.5 py-1 text-xs font-bold text-amber-700 dark:bg-amber-500/10 dark:text-amber-400">
                  <Crown className="size-3.5" /> Admin
                </span>
              ) : (
                <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-500 dark:bg-slate-800 dark:text-slate-400">
                  Membro
                </span>
              )}
              {admin && m.id !== usuario.id && (
                removendo === m.id ? (
                  <div className="flex gap-1">
                    <button
                      className="btn-danger px-3 py-2 text-xs"
                      onClick={async () => {
                        await executar(() => api(`/familias/minha/membros/${m.id}`, { method: 'DELETE' }), `${m.nome} foi removido(a)`);
                        setRemovendo(null);
                      }}
                    >
                      Remover
                    </button>
                    <button className="btn-icon size-8" onClick={() => setRemovendo(null)} aria-label="Cancelar">
                      <X className="size-4" />
                    </button>
                  </div>
                ) : (
                  <button className="btn-icon hover:text-red-500" onClick={() => setRemovendo(m.id)} aria-label={`Remover ${m.nome}`}>
                    <UserMinus className="size-5" />
                  </button>
                )
              )}
            </li>
          ))}
        </ul>
      </section>

      {/* Perfil */}
      <section className="card animate-fade-up [animation-delay:180ms]">
        <h2 className="card-title">Seu perfil</h2>
        <div className="mt-3 flex items-center gap-3">
          <Avatar nome={usuario.nome} id={usuario.id} className="size-12 text-base" />
          <div className="min-w-0 flex-1">
            <p className="truncate font-semibold">{usuario.nome}</p>
            <p className="truncate text-sm text-slate-500 dark:text-slate-400">{usuario.email}</p>
          </div>
        </div>
        <div className="mt-4 flex flex-wrap gap-2">
          <button className="btn-secondary" onClick={alternarTema}>
            {escuro ? <Sun className="size-4" /> : <Moon className="size-4" />} Tema {escuro ? 'claro' : 'escuro'}
          </button>
          {!admin && (
            <button className="btn-secondary" onClick={sairDaFamilia}>
              <UserMinus className="size-4" /> Sair da família
            </button>
          )}
          <button className="btn-danger" onClick={sair}>
            <LogOut className="size-4" /> Sair da conta
          </button>
        </div>
      </section>
    </div>
  );
}
