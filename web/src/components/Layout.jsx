import { NavLink, Outlet } from 'react-router-dom';
import { History, LayoutDashboard, Moon, Plus, Sun, Users } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useApp } from '../context/AppContext';
import { useTema } from '../lib/tema';
import { Avatar, Logo } from './ui';

const NAV = [
  { to: '/', label: 'Início', icon: LayoutDashboard, end: true },
  { to: '/historico', label: 'Histórico', icon: History },
  { to: '/familia', label: 'Família', icon: Users },
];

function AoVivo() {
  const { aoVivo } = useApp();
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-bold tracking-wide uppercase ${
        aoVivo ? 'bg-brand-500/10 text-brand-600 dark:text-brand-400' : 'bg-slate-100 text-slate-400 dark:bg-slate-800'
      }`}
      title={aoVivo ? 'Sincronizado em tempo real com a família' : 'Reconectando…'}
    >
      <span className="relative flex size-2">
        {aoVivo && <span className="absolute inline-flex size-full animate-ping rounded-full bg-brand-500 opacity-75" />}
        <span className={`relative inline-flex size-2 rounded-full ${aoVivo ? 'bg-brand-500' : 'bg-slate-400'}`} />
      </span>
      {aoVivo ? 'Ao vivo' : 'Offline'}
    </span>
  );
}

export default function Layout() {
  const { usuario } = useAuth();
  const { abrirDespesa } = useApp();
  const [escuro, alternarTema] = useTema();

  return (
    <div className="min-h-dvh lg:pl-72">
      {/* Barra lateral (desktop) */}
      <aside className="fixed inset-y-0 left-0 hidden w-72 flex-col border-r border-slate-200 bg-white px-5 py-6 lg:flex dark:border-slate-800 dark:bg-slate-900/60">
        <div className="flex items-center gap-3 px-2">
          <Logo />
          <span className="text-xl font-extrabold tracking-tight">ConFin</span>
        </div>

        <button onClick={() => abrirDespesa()} className="btn-primary mt-8 w-full py-3.5">
          <Plus className="size-5" /> Nova despesa
        </button>

        <nav className="mt-6 space-y-1">
          {NAV.map(({ to, label, icon: Icone, end }) => (
            <NavLink
              key={to}
              to={to}
              end={end}
              className={({ isActive }) =>
                `flex items-center gap-3 rounded-2xl px-4 py-3 text-sm font-semibold transition ${
                  isActive
                    ? 'bg-brand-50 text-brand-700 dark:bg-brand-500/10 dark:text-brand-400'
                    : 'text-slate-500 hover:bg-slate-100 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-white'
                }`
              }
            >
              <Icone className="size-5" /> {label}
            </NavLink>
          ))}
        </nav>

        <div className="mt-auto space-y-3">
          <div className="flex items-center justify-between px-2">
            <AoVivo />
            <button onClick={alternarTema} className="btn-icon" aria-label="Alternar tema">
              {escuro ? <Sun className="size-5" /> : <Moon className="size-5" />}
            </button>
          </div>
          <NavLink to="/familia" className="flex items-center gap-3 rounded-2xl bg-slate-50 p-3 dark:bg-slate-800/60">
            <Avatar nome={usuario.nome} id={usuario.id} className="size-10 text-sm" />
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold">{usuario.nome}</p>
              <p className="truncate text-xs text-slate-500 dark:text-slate-400">
                {usuario.papel === 'ADMIN' ? 'Administrador' : 'Membro'}
              </p>
            </div>
          </NavLink>
        </div>
      </aside>

      {/* Topo (celular) */}
      <header className="sticky top-0 z-30 flex items-center justify-between border-b border-slate-200/70 bg-slate-50/80 px-4 py-3 backdrop-blur-xl lg:hidden dark:border-slate-800/70 dark:bg-ink-950/80">
        <div className="flex items-center gap-2.5">
          <Logo className="size-8" />
          <span className="text-lg font-extrabold tracking-tight">ConFin</span>
        </div>
        <div className="flex items-center gap-1">
          <AoVivo />
          <button onClick={alternarTema} className="btn-icon" aria-label="Alternar tema">
            {escuro ? <Sun className="size-5" /> : <Moon className="size-5" />}
          </button>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-4 pt-5 pb-32 sm:px-6 lg:px-10 lg:py-10">
        <Outlet />
      </main>

      {/* Menu inferior (celular) - botão central para registrar em até 2 toques */}
      <nav className="pb-safe fixed inset-x-0 bottom-0 z-40 border-t border-slate-200/70 bg-white/90 backdrop-blur-xl lg:hidden dark:border-slate-800 dark:bg-slate-900/90">
        <div className="mx-auto grid max-w-md grid-cols-4 items-end px-2 pt-2">
          {NAV.slice(0, 2).map((item) => <ItemNav key={item.to} {...item} />)}
          <div className="col-span-1 flex justify-center">
            <button
              onClick={() => abrirDespesa()}
              className="-mt-7 inline-flex size-16 cursor-pointer items-center justify-center rounded-3xl bg-gradient-to-br from-brand-400 to-brand-700 text-white shadow-xl shadow-brand-600/40 transition active:scale-95"
              aria-label="Nova despesa"
            >
              <Plus className="size-8" strokeWidth={2.5} />
            </button>
          </div>
          <ItemNav {...NAV[2]} />
        </div>
      </nav>
    </div>
  );
}

function ItemNav({ to, label, icon: Icone, end }) {
  return (
    <NavLink
      to={to}
      end={end}
      className={({ isActive }) =>
        `flex flex-col items-center gap-1 rounded-xl py-1.5 text-[11px] font-semibold transition ${
          isActive ? 'text-brand-600 dark:text-brand-400' : 'text-slate-400'
        }`
      }
    >
      <Icone className="size-6" />
      {label}
    </NavLink>
  );
}
