import { createContext, useCallback, useContext, useState } from 'react';
import { CircleCheck, CircleX, Info, TriangleAlert, X } from 'lucide-react';

const ToastContext = createContext(null);

const ESTILOS = {
  sucesso: { icon: CircleCheck, cor: 'text-brand-500' },
  erro: { icon: CircleX, cor: 'text-red-500' },
  alerta: { icon: TriangleAlert, cor: 'text-amber-500' },
  info: { icon: Info, cor: 'text-sky-500' },
};

let proximoId = 1;

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);

  const fechar = useCallback((id) => setToasts((t) => t.filter((x) => x.id !== id)), []);

  const toast = useCallback(
    ({ tipo = 'info', titulo, mensagem, duracao = 4000 }) => {
      const id = proximoId++;
      setToasts((t) => [...t.slice(-3), { id, tipo, titulo, mensagem }]);
      setTimeout(() => fechar(id), duracao);
    },
    [fechar],
  );

  return (
    <ToastContext.Provider value={toast}>
      {children}
      <div className="pointer-events-none fixed inset-x-0 top-0 z-[100] flex flex-col items-center gap-2 p-4 sm:items-end">
        {toasts.map(({ id, tipo, titulo, mensagem }) => {
          const { icon: Icone, cor } = ESTILOS[tipo];
          return (
            <div
              key={id}
              role="status"
              className="pointer-events-auto flex w-full max-w-sm animate-sheet-up items-start gap-3 rounded-2xl border border-slate-200 bg-white/95 p-4 shadow-xl shadow-slate-900/10 backdrop-blur dark:border-slate-700 dark:bg-slate-900/95"
            >
              <Icone className={`mt-0.5 size-5 shrink-0 ${cor}`} />
              <div className="min-w-0 flex-1">
                <p className="text-sm font-semibold">{titulo}</p>
                {mensagem && <p className="mt-0.5 text-sm text-slate-500 dark:text-slate-400">{mensagem}</p>}
              </div>
              <button onClick={() => fechar(id)} className="text-slate-400 hover:text-slate-600" aria-label="Fechar">
                <X className="size-4" />
              </button>
            </div>
          );
        })}
      </div>
    </ToastContext.Provider>
  );
}

export const useToast = () => useContext(ToastContext);
