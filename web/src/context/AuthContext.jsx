import { createContext, useCallback, useContext, useEffect, useState } from 'react';
import { api, tokenStore } from '../lib/api';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [usuario, setUsuario] = useState(null);
  const [carregando, setCarregando] = useState(true);

  const recarregar = useCallback(async () => {
    if (!tokenStore.get()) {
      setUsuario(null);
      return null;
    }
    try {
      const { usuario } = await api('/auth/me');
      setUsuario(usuario);
      return usuario;
    } catch {
      setUsuario(null);
      return null;
    }
  }, []);

  useEffect(() => {
    recarregar().finally(() => setCarregando(false));
    const expirou = () => setUsuario(null);
    window.addEventListener('confin:sessao-expirada', expirou);
    return () => window.removeEventListener('confin:sessao-expirada', expirou);
  }, [recarregar]);

  const entrar = async (email, senha) => {
    const { token, usuario } = await api('/auth/login', { method: 'POST', body: { email, senha } });
    tokenStore.set(token);
    setUsuario(usuario);
  };

  const cadastrar = async (nome, email, senha) => {
    const { token, usuario } = await api('/auth/register', { method: 'POST', body: { nome, email, senha } });
    tokenStore.set(token);
    setUsuario(usuario);
  };

  const sair = () => {
    tokenStore.clear();
    setUsuario(null);
  };

  return (
    <AuthContext.Provider value={{ usuario, carregando, entrar, cadastrar, sair, recarregar }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
