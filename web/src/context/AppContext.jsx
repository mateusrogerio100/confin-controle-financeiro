import { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react';
import { io } from 'socket.io-client';
import { tokenStore } from '../lib/api';
import { brl, primeiroNome } from '../lib/format';
import { categoria } from '../lib/categorias';
import { useAuth } from './AuthContext';
import { useToast } from './ToastContext';
import DespesaSheet from '../components/DespesaSheet';

const AppContext = createContext(null);

/**
 * - "versao": incrementa a cada mudança na família; as telas recarregam os dados quando ela muda.
 * - Socket.io: recebe as mudanças feitas pelos outros membros em tempo real.
 * - Formulário de despesa global (botão "+" disponível em qualquer tela).
 */
export function AppProvider({ children }) {
  const { usuario, recarregar } = useAuth();
  const toast = useToast();
  const [versao, setVersao] = useState(0);
  const [aoVivo, setAoVivo] = useState(false);
  const [sheet, setSheet] = useState(null); // null | { despesa?: object }
  const usuarioRef = useRef(usuario);
  usuarioRef.current = usuario;

  const atualizar = useCallback(() => setVersao((v) => v + 1), []);

  useEffect(() => {
    if (!usuario?.familia_id) return;
    const socket = io(import.meta.env.VITE_API_URL || '/', { auth: { token: tokenStore.get() } });

    socket.on('connect', () => setAoVivo(true));
    socket.on('disconnect', () => setAoVivo(false));

    socket.on('familia:mudou', async (evento) => {
      atualizar();
      const eu = usuarioRef.current;
      if (evento.autor_id === eu?.id) return;

      if (evento.tipo === 'familia:atualizada') {
        const atualizado = await recarregar();
        if (atualizado && !atualizado.familia_id) {
          toast({ tipo: 'alerta', titulo: 'Você foi removido da família.' });
        }
        return;
      }

      const d = evento.despesa;
      const quem = primeiroNome(d?.usuario_nome || 'Alguém');
      if (evento.tipo === 'despesa:criada') {
        toast({
          tipo: 'info',
          titulo: `${quem} registrou ${brl(d.valor)}`,
          mensagem: `${categoria(d.categoria).label}${d.descricao ? ` · ${d.descricao}` : ''}`,
        });
        if (evento.saldo?.alerta === 'ESTOURADO') {
          toast({ tipo: 'alerta', titulo: 'Orçamento do mês estourado!', mensagem: `Saldo: ${brl(evento.saldo.saldo)}` });
        }
      } else if (evento.tipo === 'despesa:excluida') {
        toast({ tipo: 'info', titulo: `Uma despesa de ${brl(d.valor)} foi excluída.` });
      }
    });

    return () => {
      socket.disconnect();
      setAoVivo(false);
    };
  }, [usuario?.id, usuario?.familia_id, atualizar, recarregar, toast]);

  const abrirDespesa = useCallback((despesa = null) => setSheet({ despesa }), []);

  return (
    <AppContext.Provider value={{ versao, atualizar, aoVivo, abrirDespesa }}>
      {children}
      {sheet && (
        <DespesaSheet
          despesa={sheet.despesa}
          onClose={() => setSheet(null)}
          onSalvo={() => {
            setSheet(null);
            atualizar();
          }}
        />
      )}
    </AppContext.Provider>
  );
}

export const useApp = () => useContext(AppContext);
