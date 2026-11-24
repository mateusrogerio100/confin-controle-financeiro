import { useSyncExternalStore } from 'react';

// Estado global do tema (classe "dark" no <html>), compartilhado entre componentes.
const ouvintes = new Set();
const escuroAgora = () => document.documentElement.classList.contains('dark');

function alternar() {
  const escuro = !escuroAgora();
  document.documentElement.classList.toggle('dark', escuro);
  document.querySelector('meta[name="theme-color"]')?.setAttribute('content', escuro ? '#0b1120' : '#059669');
  try { localStorage.setItem('confin:tema', escuro ? 'dark' : 'light'); } catch { /* ignore */ }
  ouvintes.forEach((f) => f());
}

function assinar(f) {
  ouvintes.add(f);
  return () => ouvintes.delete(f);
}

export function useTema() {
  const escuro = useSyncExternalStore(assinar, escuroAgora);
  return [escuro, alternar];
}
