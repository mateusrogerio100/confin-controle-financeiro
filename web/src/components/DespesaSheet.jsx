import { useEffect, useState } from 'react';
import { Trash2, TriangleAlert, X } from 'lucide-react';
import { api } from '../lib/api';
import { brl, hojeISO, primeiroNome } from '../lib/format';
import { CATEGORIAS, MEIOS } from '../lib/categorias';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';

/** Formulário de nova despesa / edição (RF002, UC002). Abre como "bottom sheet" no celular. */
export default function DespesaSheet({ despesa, onClose, onSalvo }) {
  const { usuario } = useAuth();
  const toast = useToast();
  const editando = Boolean(despesa);
  const podeEditar = !editando || usuario.papel === 'ADMIN' || despesa.usuario_id === usuario.id;

  const [centavos, setCentavos] = useState(editando ? Math.round(despesa.valor * 100) : 0);
  const [cat, setCat] = useState(despesa?.categoria ?? '');
  const [meio, setMeio] = useState(despesa?.meio_pagamento ?? 'PIX');
  const [data, setData] = useState(despesa?.data ?? hojeISO());
  const [descricao, setDescricao] = useState(despesa?.descricao ?? '');
  const [orcamento, setOrcamento] = useState(null);
  const [salvando, setSalvando] = useState(false);
  const [confirmarExclusao, setConfirmarExclusao] = useState(false);
  const [erro, setErro] = useState('');

  const mes = data.slice(0, 7);

  // Busca o orçamento do mês para mostrar o impacto antes de salvar
  useEffect(() => {
    let ativo = true;
    api(`/despesas/resumo?mes=${mes}`)
      .then((r) => ativo && setOrcamento({ limite: r.limite, total: r.total }))
      .catch(() => {});
    return () => { ativo = false; };
  }, [mes]);

  useEffect(() => {
    const esc = (e) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', esc);
    document.body.style.overflow = 'hidden';
    return () => {
      window.removeEventListener('keydown', esc);
      document.body.style.overflow = '';
    };
  }, [onClose]);

  const valor = centavos / 100;
  let previa = null;
  if (orcamento && orcamento.limite > 0) {
    const jaContado = editando && despesa.data.slice(0, 7) === mes ? despesa.valor : 0;
    const novoTotal = orcamento.total - jaContado + valor;
    previa = {
      saldo: orcamento.limite - novoTotal,
      pct: Math.min(100, (novoTotal / orcamento.limite) * 100),
      pctReal: (novoTotal / orcamento.limite) * 100,
    };
  }

  async function salvar(e) {
    e.preventDefault();
    setErro('');
    if (centavos <= 0) return setErro('Informe um valor maior que zero.'); // RN002
    if (!cat) return setErro('Escolha uma categoria.');
    setSalvando(true);
    try {
      const body = { valor, categoria: cat, meio_pagamento: meio, data, descricao };
      const { saldo } = editando
        ? await api(`/despesas/${despesa.id}`, { method: 'PUT', body })
        : await api('/despesas', { method: 'POST', body });

      // Cenário alternativo do UC002: salva, mas avisa quando passa do limite (RN004)
      if (saldo.alerta === 'ESTOURADO') {
        toast({
          tipo: 'alerta',
          titulo: 'Orçamento estourado!',
          mensagem: `A família passou ${brl(-saldo.saldo)} do limite de ${brl(saldo.limite)}.`,
          duracao: 6000,
        });
      } else if (saldo.alerta === 'ATENCAO') {
        toast({
          tipo: 'alerta',
          titulo: `Atenção: ${Math.round(saldo.percentual)}% do orçamento usado`,
          mensagem: `Restam ${brl(saldo.saldo)} para o mês.`,
          duracao: 5000,
        });
      } else {
        toast({
          tipo: 'sucesso',
          titulo: editando ? 'Despesa atualizada' : 'Despesa salva',
          mensagem: saldo.limite > 0 ? `Saldo do mês: ${brl(saldo.saldo)}` : undefined,
        });
      }
      onSalvo();
    } catch (err) {
      setErro(err.message);
      setSalvando(false);
    }
  }

  async function excluir() {
    if (!confirmarExclusao) return setConfirmarExclusao(true);
    setSalvando(true);
    try {
      await api(`/despesas/${despesa.id}`, { method: 'DELETE' });
      toast({ tipo: 'sucesso', titulo: 'Despesa excluída' });
      onSalvo();
    } catch (err) {
      setErro(err.message);
      setSalvando(false);
    }
  }

  const corBarra = !previa ? '' : previa.pctReal >= 100 ? 'bg-red-500' : previa.pctReal >= 80 ? 'bg-amber-500' : 'bg-brand-500';

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center sm:items-center sm:p-4">
      <div className="absolute inset-0 animate-[fade-up_0.2s_both] bg-slate-950/50 backdrop-blur-sm" onClick={onClose} />
      <form
        onSubmit={salvar}
        className="relative flex max-h-[94dvh] w-full max-w-lg animate-sheet-up flex-col rounded-t-[2rem] bg-white shadow-2xl sm:rounded-[2rem] dark:bg-slate-900"
      >
        <div className="mx-auto mt-3 h-1.5 w-12 rounded-full bg-slate-200 sm:hidden dark:bg-slate-700" />
        <header className="flex items-center justify-between px-6 pt-4 pb-2">
          <h2 className="text-lg font-bold">
            {!podeEditar ? 'Detalhes da despesa' : editando ? 'Editar despesa' : 'Nova despesa'}
          </h2>
          <button type="button" onClick={onClose} className="btn-icon" aria-label="Fechar">
            <X className="size-5" />
          </button>
        </header>

        <fieldset disabled={!podeEditar || salvando} className="space-y-5 overflow-y-auto px-6 pb-4">
          {!podeEditar && (
            <p className="rounded-2xl bg-slate-100 px-4 py-3 text-sm text-slate-600 dark:bg-slate-800 dark:text-slate-300">
              Registrada por <strong>{primeiroNome(despesa.usuario_nome)}</strong>. Apenas quem registrou ou o
              administrador pode alterar.
            </p>
          )}

          <div className="text-center">
            <label htmlFor="valor" className="label">Valor</label>
            <input
              id="valor"
              inputMode="numeric"
              autoFocus={!editando}
              value={brl(valor)}
              onChange={(e) => setCentavos(Number(e.target.value.replace(/\D/g, '').slice(-10) || 0))}
              className="w-full bg-transparent text-center text-4xl font-extrabold tracking-tight tabular-nums outline-none sm:text-5xl"
            />
            {previa && (
              <div className="mx-auto mt-3 max-w-xs">
                <div className="h-2 overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800">
                  <div className={`h-full rounded-full transition-all duration-500 ${corBarra}`} style={{ width: `${previa.pct}%` }} />
                </div>
                <p className={`mt-2 flex items-center justify-center gap-1 text-xs font-medium ${previa.saldo < 0 ? 'text-red-500' : 'text-slate-500 dark:text-slate-400'}`}>
                  {previa.saldo < 0 && <TriangleAlert className="size-3.5" />}
                  {previa.saldo < 0
                    ? `Vai ultrapassar o limite em ${brl(-previa.saldo)}`
                    : `Depois desta despesa sobram ${brl(previa.saldo)}`}
                </p>
              </div>
            )}
          </div>

          <div>
            <span className="label">Categoria</span>
            <div className="grid grid-cols-4 gap-2">
              {Object.entries(CATEGORIAS).map(([k, { label, icon: Icone, cor }]) => {
                const ativo = cat === k;
                return (
                  <button
                    type="button"
                    key={k}
                    onClick={() => setCat(k)}
                    className={`flex cursor-pointer flex-col items-center gap-1.5 rounded-2xl border-2 px-1 py-3 text-[11px] font-semibold transition ${
                      ativo ? '' : 'border-transparent bg-slate-50 hover:bg-slate-100 dark:bg-slate-800/60 dark:hover:bg-slate-800'
                    }`}
                    style={ativo ? { borderColor: cor, backgroundColor: `${cor}14`, color: cor } : undefined}
                  >
                    <Icone className="size-5" style={{ color: cor }} />
                    <span className="leading-tight">{label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          <div>
            <span className="label">Meio de pagamento</span>
            <div className="grid grid-cols-4 gap-1 rounded-2xl bg-slate-100 p-1 dark:bg-slate-800">
              {Object.entries(MEIOS).map(([k, { label, icon: Icone }]) => (
                <button
                  type="button"
                  key={k}
                  onClick={() => setMeio(k)}
                  className={`flex cursor-pointer items-center justify-center gap-1.5 rounded-xl py-2.5 text-xs font-semibold transition ${
                    meio === k
                      ? 'bg-white text-slate-900 shadow-sm dark:bg-slate-950 dark:text-white'
                      : 'text-slate-500 hover:text-slate-800 dark:text-slate-400'
                  }`}
                >
                  <Icone className="size-4" />
                  {label}
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-[auto_1fr] gap-3">
            <div>
              <label htmlFor="data" className="label">Data</label>
              <input id="data" type="date" className="input" value={data} max={hojeISO()} onChange={(e) => setData(e.target.value)} required />
            </div>
            <div>
              <label htmlFor="desc" className="label">Descrição</label>
              <input
                id="desc"
                className="input"
                placeholder="Ex.: Padaria"
                maxLength={120}
                value={descricao}
                onChange={(e) => setDescricao(e.target.value)}
              />
            </div>
          </div>

          {erro && <p className="rounded-xl bg-red-50 px-4 py-2.5 text-sm font-medium text-red-600 dark:bg-red-500/10 dark:text-red-400">{erro}</p>}
        </fieldset>

        <footer className="pb-safe flex gap-3 border-t border-slate-100 px-6 pt-4 dark:border-slate-800">
          {editando && podeEditar && (
            <button type="button" onClick={excluir} className="btn-danger" disabled={salvando}>
              <Trash2 className="size-4" />
              {confirmarExclusao ? 'Confirmar' : ''}
            </button>
          )}
          <button type="button" onClick={onClose} className="btn-secondary flex-1">
            {podeEditar ? 'Cancelar' : 'Fechar'}
          </button>
          {podeEditar && (
            <button type="submit" className="btn-primary flex-[2]" disabled={salvando}>
              {salvando ? 'Salvando…' : 'Salvar'}
            </button>
          )}
        </footer>
        <div className="h-4" />
      </form>
    </div>
  );
}
