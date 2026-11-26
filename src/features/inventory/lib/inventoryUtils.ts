import type { Product, StockHealth } from '../../../shared/types/domain';

export type InventoryStatusFilter = 'all' | 'needs_restock' | 'out' | 'hidden';

/**
 * Classifies current stock against its configured replenishment threshold.
 */
export function getStockHealth(stockQty: number, minStockQty: number): StockHealth {
  if (stockQty <= 0) return 'out';
  if (stockQty <= minStockQty) return 'low';
  return 'ok';
}

/**
 * Computes unit profit and percentage margins from integer cents.
 */
export function calculateMarginMetrics(
  costCents: number,
  retailPriceCents: number,
): { profitCents: number; marginPercent: number; markupPercent: number } {
  const profitCents = retailPriceCents - costCents;
  const marginPercent =
    retailPriceCents > 0 ? Math.round((profitCents / retailPriceCents) * 100) : 0;
  const markupPercent = costCents > 0 ? Math.round((profitCents / costCents) * 100) : 0;

  return { profitCents, marginPercent, markupPercent };
}

/**
 * Generates an ASCII URL-safe slug from any Spanish product or category name.
 */
export function slugifyText(value: string): string {
  const normalized = value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');

  return normalized || 'item';
}

/**
 * Filters inventory items by text search, category, and stock/visibility status.
 */
export function filterInventoryProducts(
  products: Product[],
  filters: {
    query: string;
    categoryId: string;
    status: InventoryStatusFilter;
  },
): Product[] {
  const query = filters.query.trim().toLowerCase();

  return products.filter((product) => {
    if (filters.categoryId !== 'all' && product.categoryId !== filters.categoryId) {
      return false;
    }

    const health = getStockHealth(product.stockQty, product.minStockQty);
    if (filters.status === 'needs_restock' && health === 'ok') return false;
    if (filters.status === 'out' && health !== 'out') return false;
    if (filters.status === 'hidden' && product.isActive) return false;

    if (!query) return true;

    const haystack = [product.name, product.sku ?? '', product.materialDetails, product.description]
      .join(' ')
      .toLowerCase();
    return haystack.includes(query);
  });
}

/**
 * Returns active products at or below minimum stock sorted by replenishment urgency.
 */
export function getReplenishmentQueue(products: Product[]): Product[] {
  return products
    .filter(
      (product) =>
        product.isActive && getStockHealth(product.stockQty, product.minStockQty) !== 'ok',
    )
    .sort((a, b) => {
      if (a.stockQty === 0 && b.stockQty > 0) return -1;
      if (b.stockQty === 0 && a.stockQty > 0) return 1;
      const deficitA = a.minStockQty - a.stockQty;
      const deficitB = b.minStockQty - b.stockQty;
      return deficitB - deficitA;
    });
}
