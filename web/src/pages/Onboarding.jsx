import { useState } from 'react';
import { House, KeyRound, LogOut } from 'lucide-react';
import { api } from '../lib/api';
import { primeiroNome } from '../lib/format';
import { useAuth } from '../context/AuthContext';
import { Logo } from '../components/ui';

/** Primeiro acesso: criar um grupo familiar (vira ADMIN) ou entrar com código. */
export default function Onboarding() {
  const { usuario, recarregar, sair } = useAuth();
  const [nome, setNome] = useState(`Família ${usuario.nome.trim().split(/\s+/).at(-1)}`);
  const [limite, setLimite] = useState('');
  const [codigo, setCodigo] = useState('');
  const [erro, setErro] = useState({});
  const [enviando, setEnviando] = useState(false);

  async function executar(chave, fn) {
    setErro({});
    setEnviando(true);
    try {
      await fn();
      await recarregar();
    } catch (e) {
      setErro({ [chave]: e.message });
      setEnviando(false);
    }
  }

  const criar = (e) => {
    e.preventDefault();
    executar('criar', () =>
      api('/familias', {
        method: 'POST',
        body: { nome, limite_mensal: limite ? limite.replace(/\./g, '').replace(',', '.') : 0 },
      }),
    );
  };

  const entrar = (e) => {
    e.preventDefault();
    executar('entrar', () => api('/familias/entrar', { method: 'POST', body: { codigo } }));
  };

  return (
    <div className="mx-auto flex min-h-dvh max-w-4xl flex-col px-5 py-10">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Logo />
          <span className="text-xl font-extrabold tracking-tight">ConFin</span>
        </div>
        <button onClick={sair} className="btn-secondary"><LogOut className="size-4" /> Sair</button>
      </div>

      <div className="my-auto py-10">
        <div className="text-center animate-fade-up">
          <h1 className="text-3xl font-extrabold tracking-tight sm:text-4xl">Olá, {primeiroNome(usuario.nome)}! 🎉</h1>
          <p className="mt-2 text-slate-500 dark:text-slate-400">Para começar, crie o grupo da sua família ou entre em um existente.</p>
        </div>

        <div className="mt-10 grid gap-4 md:grid-cols-2">
          <form onSubmit={criar} className="card space-y-4 p-6 animate-fade-up [animation-delay:80ms]">
            <span className="inline-flex size-12 items-center justify-center rounded-2xl bg-brand-50 text-brand-600 dark:bg-brand-500/10 dark:text-brand-400">
              <House className="size-6" />
            </span>
            <div>
              <h2 className="text-lg font-bold">Criar uma família</h2>
              <p className="text-sm text-slate-500 dark:text-slate-400">Você será o administrador do orçamento.</p>
            </div>
            <div>
              <label htmlFor="nome" className="label">Nome do grupo</label>
              <input id="nome" className="input" required minLength={2} value={nome} onChange={(e) => setNome(e.target.value)} />
            </div>
            <div>
              <label htmlFor="limite" className="label">Limite mensal (opcional)</label>
              <div className="relative">
                <span className="pointer-events-none absolute top-1/2 left-4 -translate-y-1/2 text-sm font-semibold text-slate-400">R$</span>
                <input
                  id="limite"
                  inputMode="decimal"
                  className="input pl-11"
                  placeholder="4.500,00"
                  value={limite}
                  onChange={(e) => setLimite(e.target.value.replace(/[^\d.,]/g, ''))}
                />
              </div>
            </div>
            {erro.criar && <p className="text-sm font-medium text-red-500">{erro.criar}</p>}
            <button className="btn-primary w-full" disabled={enviando}>Criar família</button>
          </form>

          <form onSubmit={entrar} className="card flex flex-col space-y-4 p-6 animate-fade-up [animation-delay:160ms]">
            <span className="inline-flex size-12 items-center justify-center rounded-2xl bg-sky-50 text-sky-600 dark:bg-sky-500/10 dark:text-sky-400">
              <KeyRound className="size-6" />
            </span>
            <div>
              <h2 className="text-lg font-bold">Tenho um código</h2>
              <p className="text-sm text-slate-500 dark:text-slate-400">Peça o código ao administrador da família.</p>
            </div>
            <div>
              <label htmlFor="codigo" className="label">Código de convite</label>
              <input
                id="codigo"
                className="input text-center font-mono text-2xl font-bold tracking-[0.4em] uppercase"
                required
                maxLength={8}
                placeholder="ABC123"
                value={codigo}
                onChange={(e) => setCodigo(e.target.value.toUpperCase())}
              />
            </div>
            {erro.entrar && <p className="text-sm font-medium text-red-500">{erro.entrar}</p>}
            <button className="btn-secondary mt-auto w-full" disabled={enviando}>Entrar na família</button>
          </form>
        </div>
      </div>
    </div>
  );
}
