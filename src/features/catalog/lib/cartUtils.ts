import { formatMoney } from '../../../shared/lib/money';
import type { CartItem, PublicCatalogProduct } from '../../../shared/types/domain';

/**
 * Adds a quantity of a public catalog product into the cart without exceeding available stock.
 */
export function addProductToCart(
  items: CartItem[],
  product: PublicCatalogProduct,
  qtyToAdd = 1,
): CartItem[] {
  if (product.stockQty <= 0 || qtyToAdd <= 0) return items;

  const existingIndex = items.findIndex((item) => item.productId === product.id);
  if (existingIndex === -1) {
    return [
      ...items,
      {
        productId: product.id,
        name: product.name,
        retailPriceCents: product.retailPriceCents,
        maxStockQty: product.stockQty,
        imageUrl: product.images[0]?.publicUrl ?? null,
        qty: Math.min(qtyToAdd, product.stockQty),
      },
    ];
  }

  return items.map((item, idx) =>
    idx === existingIndex
      ? {
          ...item,
          retailPriceCents: product.retailPriceCents,
          maxStockQty: product.stockQty,
          imageUrl: product.images[0]?.publicUrl ?? item.imageUrl,
          qty: Math.min(item.qty + qtyToAdd, product.stockQty),
        }
      : item,
  );
}

/**
 * Updates the quantity of an item in the cart or removes it when quantity drops to 0.
 */
export function updateCartQuantity(
  items: CartItem[],
  productId: string,
  nextQty: number,
): CartItem[] {
  if (nextQty <= 0) {
    return items.filter((item) => item.productId !== productId);
  }

  return items.map((item) =>
    item.productId === productId
      ? { ...item, qty: Math.min(Math.floor(nextQty), Math.max(1, item.maxStockQty)) }
      : item,
  );
}

/**
 * Filters public storefront products by query, category, and stock availability.
 */
export function filterPublicProducts(
  products: PublicCatalogProduct[],
  filters: { query: string; categoryId: string; onlyInStock: boolean },
): PublicCatalogProduct[] {
  const query = filters.query.trim().toLowerCase();

  return products.filter((product) => {
    if (filters.categoryId !== 'all' && product.categoryId !== filters.categoryId) {
      return false;
    }
    if (filters.onlyInStock && product.stockQty <= 0) {
      return false;
    }
    if (!query) return true;

    const text = [product.name, product.materialDetails, product.description]
      .join(' ')
      .toLowerCase();
    return text.includes(query);
  });
}

/**
 * Computes item count and total amount in integer cents for the cart.
 */
export function calculateCartTotals(items: CartItem[]): { itemCount: number; totalCents: number } {
  return items.reduce(
    (acc, item) => ({
      itemCount: acc.itemCount + item.qty,
      totalCents: acc.totalCents + item.retailPriceCents * item.qty,
    }),
    { itemCount: 0, totalCents: 0 },
  );
}

/**
 * Formats a clean, actionable WhatsApp message with order code, items, and customer logistics.
 */
export function formatWhatsAppOrderMessage(options: {
  businessName: string;
  sellerName: string;
  orderCode: string;
  items: CartItem[];
  totalCents: number;
  customerName: string;
  customerPhone: string;
  deliveryMethod: string;
  deliveryAddress: string;
  paymentMethod: string;
  notes: string;
}): string {
  const itemLines = options.items
    .map((item) => `• ${item.qty}x ${item.name} (${formatMoney(item.retailPriceCents * item.qty)})`)
    .join('\n');

  const lines = [
    `Hola ${options.sellerName}! Te paso mi pedido de *${options.businessName}*`,
    `Código: *${options.orderCode}*`,
    '',
    '*Detalle:*',
    itemLines,
    '',
    `*Total:* ${formatMoney(options.totalCents)}`,
    '',
    '*Mis datos:*',
    `• Nombre: ${options.customerName.trim()}`,
    `• Teléfono: ${options.customerPhone.trim()}`,
    `• Entrega: ${options.deliveryMethod.trim()}`,
  ];

  if (options.deliveryAddress.trim()) {
    lines.push(`• Zona / Dirección: ${options.deliveryAddress.trim()}`);
  }
  lines.push(`• Pago: ${options.paymentMethod.trim()}`);
  if (options.notes.trim()) {
    lines.push(`• Notas: ${options.notes.trim()}`);
  }

  return lines.join('\n');
}
