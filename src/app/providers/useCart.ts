import { createContext, useContext } from 'react';
import type { CartItem, PublicCatalogProduct } from '../../shared/types/domain';

export interface CartContextValue {
  items: CartItem[];
  itemCount: number;
  totalCents: number;
  addProduct: (product: PublicCatalogProduct, qty?: number) => void;
  setItemQty: (productId: string, qty: number) => void;
  removeItem: (productId: string) => void;
  clearCart: () => void;
}

export const CartContext = createContext<CartContextValue | null>(null);

/**
 * Accesses the customer's persisted catalog order cart.
 */
export function useCart(): CartContextValue {
  const ctx = useContext(CartContext);
  if (!ctx) {
    throw new Error('useCart must be used inside CartProvider.');
  }
  return ctx;
}
