import { getStockHealth } from '../lib/inventoryUtils';

interface StockHealthBadgeProps {
  stockQty: number;
  minStockQty: number;
}

/**
 * Displays visual stock status against the configured minimum replenishment threshold.
 */
export function StockHealthBadge({ stockQty, minStockQty }: StockHealthBadgeProps) {
  const health = getStockHealth(stockQty, minStockQty);

  if (health === 'out') {
    return (
      <span className="inline-flex items-center rounded-full bg-danger-soft px-2.5 py-0.5 text-xs font-semibold text-danger">
        Agotado (0 / mín {minStockQty})
      </span>
    );
  }

  if (health === 'low') {
    return (
      <span className="inline-flex items-center rounded-full bg-warn-soft px-2.5 py-0.5 text-xs font-semibold text-warn">
        Reponer ({stockQty} / mín {minStockQty})
      </span>
    );
  }

  return (
    <span className="inline-flex items-center rounded-full bg-ok-soft px-2.5 py-0.5 text-xs font-semibold text-ok">
      OK ({stockQty} u.)
    </span>
  );
}
