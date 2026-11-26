import { useCallback, useEffect, useMemo, useState, type ReactNode } from 'react';
import {
  addProductToCart,
  calculateCartTotals,
  updateCartQuantity,
} from '../../features/catalog/lib/cartUtils';
import type { CartItem, PublicCatalogProduct } from '../../shared/types/domain';
import { CartContext, type CartContextValue } from './useCart';

const CART_STORAGE_KEY = 'grama.public.cart.v1';

function readInitialCart(): CartItem[] {
  try {
    const raw = window.localStorage.getItem(CART_STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? (parsed as CartItem[]) : [];
  } catch {
    return [];
  }
}

export function CartProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<CartItem[]>(readInitialCart);

  useEffect(() => {
    try {
      window.localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(items));
    } catch {
      // Ignore storage quota failures.
    }
  }, [items]);

  const addProduct = useCallback((product: PublicCatalogProduct, qty = 1) => {
    setItems((prev) => addProductToCart(prev, product, qty));
  }, []);

  const setItemQty = useCallback((productId: string, qty: number) => {
    setItems((prev) => updateCartQuantity(prev, productId, qty));
  }, []);

  const removeItem = useCallback((productId: string) => {
    setItems((prev) => prev.filter((item) => item.productId !== productId));
  }, []);

  const clearCart = useCallback(() => {
    setItems([]);
  }, []);

  const totals = useMemo(() => calculateCartTotals(items), [items]);

  const value = useMemo<CartContextValue>(
    () => ({
      items,
      itemCount: totals.itemCount,
      totalCents: totals.totalCents,
      addProduct,
      setItemQty,
      removeItem,
      clearCart,
    }),
    [items, totals.itemCount, totals.totalCents, addProduct, setItemQty, removeItem, clearCart],
  );

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}
