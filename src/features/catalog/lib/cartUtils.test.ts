import { describe, expect, it } from 'vitest';
import type { PublicCatalogProduct } from '../../../shared/types/domain';
import {
  addProductToCart,
  calculateCartTotals,
  filterPublicProducts,
  formatWhatsAppOrderMessage,
  updateCartQuantity,
} from './cartUtils';

const SAMPLE_PUBLIC_PRODUCTS: PublicCatalogProduct[] = [
  {
    id: 'p-1',
    name: 'Anillo Regulable Acero Blanco',
    slug: 'anillo-regulable-acero-blanco',
    description: 'Diseño moderno regulable',
    materialDetails: 'Acero blanco · Regulable',
    categoryId: 'cat-anillos',
    retailPriceCents: 1850000,
    stockQty: 3,
    minStockQty: 2,
    images: [],
  },
  {
    id: 'p-2',
    name: 'Pulsera Esclava Minimal',
    slug: 'pulsera-esclava-minimal',
    description: 'Pulsera rígida',
    materialDetails: 'Acero quirúrgico',
    categoryId: 'cat-pulseras',
    retailPriceCents: 2200000,
    stockQty: 0,
    minStockQty: 2,
    images: [],
  },
];

describe('cartUtils', () => {
  it('adds items clamped to available stock and updates quantities', () => {
    const prod = SAMPLE_PUBLIC_PRODUCTS[0]!;
    let cart = addProductToCart([], prod, 2);
    cart = addProductToCart(cart, prod, 5);
    expect(cart[0]?.qty).toBe(3);

    expect(calculateCartTotals(cart)).toEqual({
      itemCount: 3,
      totalCents: 5550000,
    });

    cart = updateCartQuantity(cart, prod.id, 0);
    expect(cart).toHaveLength(0);
  });

  it('ignores out-of-stock products when adding to cart', () => {
    const outProd = SAMPLE_PUBLIC_PRODUCTS[1]!;
    expect(addProductToCart([], outProd, 1)).toEqual([]);
  });

  it('filters public products by search and availability', () => {
    expect(
      filterPublicProducts(SAMPLE_PUBLIC_PRODUCTS, {
        query: 'acero',
        categoryId: 'all',
        onlyInStock: true,
      }).map((p) => p.id),
    ).toEqual(['p-1']);
  });

  it('formats a structured WhatsApp order message for the assigned seller', () => {
    const cart = addProductToCart([], SAMPLE_PUBLIC_PRODUCTS[0]!, 2);
    const message = formatWhatsAppOrderMessage({
      businessName: 'Grama Joyería',
      sellerName: 'Nahuel',
      orderCode: 'PED-A1B2C3',
      items: cart,
      totalCents: 3700000,
      customerName: 'Lucía Gómez',
      customerPhone: '1155554444',
      deliveryMethod: 'Envío por cadetería / moto',
      deliveryAddress: 'Palermo',
      paymentMethod: 'Transferencia',
      notes: 'Coordinar por la tarde',
    });

    expect(message).toContain('Hola Nahuel!');
    expect(message).toContain('*PED-A1B2C3*');
    expect(message).toContain('2x Anillo Regulable Acero Blanco');
    expect(message).toContain('Zona / Dirección: Palermo');
  });
});
