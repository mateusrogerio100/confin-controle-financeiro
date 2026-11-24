import { useState } from 'react';
import { Eye, EyeOff, ShieldCheck, Sparkles, Users, Zap } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { Logo } from '../components/ui';

const DESTAQUES = [
  { icon: Users, titulo: 'Orçamento compartilhado', texto: 'Todos da família registram e acompanham os gastos.' },
  { icon: Zap, titulo: 'Tempo real', texto: 'Cada despesa atualiza o saldo de todos na hora.' },
  { icon: ShieldCheck, titulo: 'Seguro', texto: 'Senhas com hash bcrypt e autenticação JWT.' },
];

export default function Login() {
  const { entrar, cadastrar } = useAuth();
  const toast = useToast();
  const [modo, setModo] = useState('entrar');
  const [form, setForm] = useState({ nome: '', email: '', senha: '' });
  const [verSenha, setVerSenha] = useState(false);
  const [erro, setErro] = useState('');
  const [enviando, setEnviando] = useState(false);

  const campo = (k) => ({ value: form[k], onChange: (e) => setForm({ ...form, [k]: e.target.value }) });

  async function enviar(e) {
    e.preventDefault();
    setErro('');
    setEnviando(true);
    try {
      if (modo === 'entrar') await entrar(form.email, form.senha);
      else await cadastrar(form.nome, form.email, form.senha);
    } catch (err) {
      setErro(err.message);
      setEnviando(false);
    }
  }

  return (
    <div className="grid min-h-dvh lg:grid-cols-2">
      {/* Painel da marca */}
      <aside className="relative hidden overflow-hidden bg-gradient-to-br from-brand-500 via-brand-700 to-emerald-950 p-12 text-white lg:flex lg:flex-col">
        <div className="pointer-events-none absolute -top-40 -right-40 size-[30rem] rounded-full bg-white/10 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-40 -left-20 size-[26rem] rounded-full bg-emerald-300/10 blur-3xl" />
        <div className="relative flex items-center gap-3">
          <img src="/icon.svg" alt="" className="size-11 rounded-2xl ring-2 ring-white/30" />
          <span className="text-2xl font-extrabold tracking-tight">ConFin</span>
        </div>

        <div className="relative my-auto max-w-md">
          <h1 className="text-4xl leading-tight font-extrabold tracking-tight xl:text-5xl">
            As finanças da família, juntas e em tempo real.
          </h1>
          <p className="mt-4 text-lg text-white/75">
            Chega de planilha e de anotar gastos no WhatsApp. Cada membro registra na hora, e todos veem quanto sobra.
          </p>

          <div className="mt-10 rotate-[-2deg] rounded-3xl bg-white/10 p-5 shadow-2xl ring-1 ring-white/20 backdrop-blur-md">
            <p className="text-sm text-white/70">Saldo disponível em novembro</p>
            <p className="text-3xl font-extrabold tabular-nums">R$ 1.260,01</p>
            <div className="mt-4 h-2.5 overflow-hidden rounded-full bg-white/20">
              <div className="h-full w-[72%] rounded-full bg-white" />
            </div>
            <div className="mt-2 flex justify-between text-xs text-white/70">
              <span>R$ 3.239,99 gastos</span>
              <span>72% de R$ 4.500,00</span>
            </div>
          </div>
        </div>

        <ul className="relative grid grid-cols-3 gap-6">
          {DESTAQUES.map(({ icon: Icone, titulo, texto }) => (
            <li key={titulo}>
              <Icone className="size-6 text-brand-200" />
              <p className="mt-2 text-sm font-bold">{titulo}</p>
              <p className="mt-1 text-xs text-white/65">{texto}</p>
            </li>
          ))}
        </ul>
      </aside>

      {/* Formulário */}
      <main className="flex items-center justify-center px-5 py-10">
        <div className="w-full max-w-sm animate-fade-up">
          <div className="mb-8 flex flex-col items-center text-center lg:hidden">
            <Logo className="size-14" />
            <p className="mt-3 text-2xl font-extrabold tracking-tight">ConFin</p>
            <p className="text-sm text-slate-500 dark:text-slate-400">Controle financeiro familiar</p>
          </div>

          <h2 className="text-2xl font-extrabold tracking-tight">
            {modo === 'entrar' ? 'Bem-vindo de volta' : 'Crie sua conta'}
          </h2>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
            {modo === 'entrar' ? 'Entre para ver o orçamento da família.' : 'Leva menos de um minuto.'}
          </p>

          <div className="mt-6 grid grid-cols-2 gap-1 rounded-2xl bg-slate-100 p-1 dark:bg-slate-900">
            {[
              ['entrar', 'Entrar'],
              ['cadastrar', 'Criar conta'],
            ].map(([k, l]) => (
              <button
                key={k}
                type="button"
                onClick={() => { setModo(k); setErro(''); }}
                className={`cursor-pointer rounded-xl py-2.5 text-sm font-semibold transition ${
                  modo === k ? 'bg-white shadow-sm dark:bg-slate-800' : 'text-slate-500'
                }`}
              >
                {l}
              </button>
            ))}
          </div>

          <form onSubmit={enviar} className="mt-6 space-y-4">
            {modo === 'cadastrar' && (
              <div>
                <label htmlFor="nome" className="label">Nome</label>
                <input id="nome" className="input" autoComplete="name" required minLength={2} placeholder="Seu nome" {...campo('nome')} />
              </div>
            )}
            <div>
              <label htmlFor="email" className="label">E-mail</label>
              <input id="email" type="email" className="input" autoComplete="email" required placeholder="voce@email.com" {...campo('email')} />
            </div>
            <div>
              <div className="flex items-center justify-between">
                <label htmlFor="senha" className="label">Senha</label>
                {modo === 'entrar' && (
                  <button
                    type="button"
                    className="mb-1.5 text-xs font-semibold text-brand-600 hover:underline dark:text-brand-400"
                    onClick={() => toast({ tipo: 'info', titulo: 'Recuperação de senha', mensagem: 'Funcionalidade prevista para a próxima versão.' })}
                  >
                    Esqueci a senha
                  </button>
                )}
              </div>
              <div className="relative">
                <input
                  id="senha"
                  type={verSenha ? 'text' : 'password'}
                  className="input pr-12"
                  autoComplete={modo === 'entrar' ? 'current-password' : 'new-password'}
                  required
                  minLength={6}
                  placeholder={modo === 'entrar' ? '••••••' : 'Mínimo de 6 caracteres'}
                  {...campo('senha')}
                />
                <button
                  type="button"
                  onClick={() => setVerSenha(!verSenha)}
                  className="absolute top-1/2 right-3 -translate-y-1/2 p-1 text-slate-400 hover:text-slate-600"
                  aria-label={verSenha ? 'Ocultar senha' : 'Mostrar senha'}
                >
                  {verSenha ? <EyeOff className="size-5" /> : <Eye className="size-5" />}
                </button>
              </div>
            </div>

            {erro && <p className="rounded-xl bg-red-50 px-4 py-2.5 text-sm font-medium text-red-600 dark:bg-red-500/10 dark:text-red-400">{erro}</p>}

            <button className="btn-primary w-full py-3.5" disabled={enviando}>
              {enviando ? 'Aguarde…' : modo === 'entrar' ? 'Entrar' : 'Criar conta'}
            </button>
          </form>

          {modo === 'entrar' && (
            <button
              type="button"
              onClick={() => setForm({ ...form, email: 'ana@confin.app', senha: '123456' })}
              className="mt-4 flex w-full cursor-pointer items-center justify-center gap-2 rounded-2xl border border-dashed border-slate-300 py-3 text-sm font-medium text-slate-500 transition hover:border-brand-400 hover:text-brand-600 dark:border-slate-700"
            >
              <Sparkles className="size-4" /> Preencher conta de demonstração
            </button>
          )}
        </div>
      </main>
    </div>
  );
}
