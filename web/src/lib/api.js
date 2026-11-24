const BASE = (import.meta.env.VITE_API_URL || '') + '/api';
const CHAVE = 'confin:token';

export const tokenStore = {
  get() {
    try { return localStorage.getItem(CHAVE); } catch { return null; }
  },
  set(t) {
    try { localStorage.setItem(CHAVE, t); } catch { /* modo privado */ }
  },
  clear() {
    try { localStorage.removeItem(CHAVE); } catch { /* modo privado */ }
  },
};

export class ApiError extends Error {
  constructor(status, message) {
    super(message);
    this.status = status;
  }
}

/** Chamada à API com token JWT. Lança ApiError com a mensagem do servidor. */
export async function api(rota, { method = 'GET', body } = {}) {
  const token = tokenStore.get();
  let res;
  try {
    res = await fetch(BASE + rota, {
      method,
      headers: {
        ...(body && { 'Content-Type': 'application/json' }),
        ...(token && { Authorization: `Bearer ${token}` }),
      },
      body: body ? JSON.stringify(body) : undefined,
    });
  } catch {
    throw new ApiError(0, 'Sem conexão com o servidor.');
  }

  const dados = res.status === 204 ? null : await res.json().catch(() => null);
  if (!res.ok) {
    if (res.status === 401 && token) {
      tokenStore.clear();
      window.dispatchEvent(new Event('confin:sessao-expirada'));
    }
    throw new ApiError(res.status, dados?.erro || 'Algo deu errado. Tente novamente.');
  }
  return dados;
}
