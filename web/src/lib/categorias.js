import {
  Banknote,
  Car,
  CreditCard,
  Gamepad2,
  GraduationCap,
  HeartPulse,
  House,
  Package,
  ShoppingCart,
  UtensilsCrossed,
  Wallet,
  Zap,
} from 'lucide-react';

// Paleta categórica validada para daltonismo (ordem fixa; a cor segue a categoria, nunca o ranking).
// Vermelho/âmbar ficam reservados para os alertas de orçamento. "Outros" usa cinza neutro.
export const CATEGORIAS = {
  MORADIA: { label: 'Contas da casa', icon: House, cor: '#2a78d6' },
  MERCADO: { label: 'Mercado', icon: ShoppingCart, cor: '#eb6834' },
  ALIMENTACAO: { label: 'Alimentação', icon: UtensilsCrossed, cor: '#1baf7a' },
  TRANSPORTE: { label: 'Transporte', icon: Car, cor: '#eda100' },
  LAZER: { label: 'Lazer', icon: Gamepad2, cor: '#e87ba4' },
  SAUDE: { label: 'Saúde', icon: HeartPulse, cor: '#008300' },
  EDUCACAO: { label: 'Educação', icon: GraduationCap, cor: '#6250d6' },
  OUTROS: { label: 'Outros', icon: Package, cor: '#8a8984' },
};

export const MEIOS = {
  CREDITO: { label: 'Crédito', icon: CreditCard },
  DEBITO: { label: 'Débito', icon: Wallet },
  PIX: { label: 'PIX', icon: Zap },
  DINHEIRO: { label: 'Dinheiro', icon: Banknote },
};

export const categoria = (k) => CATEGORIAS[k] ?? CATEGORIAS.OUTROS;
