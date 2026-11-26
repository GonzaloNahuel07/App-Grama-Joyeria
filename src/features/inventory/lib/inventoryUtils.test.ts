import { describe, expect, it } from 'vitest';
import type { Product } from '../../../shared/types/domain';
import {
  calculateMarginMetrics,
  filterInventoryProducts,
  getReplenishmentQueue,
  getStockHealth,
  slugifyText,
} from './inventoryUtils';

const SAMPLE_PRODUCTS: Product[] = [
  {
    id: '1',
    sku: 'AN-001',
    name: 'Anillo Regulable Acero Blanco',
    slug: 'anillo-regulable-acero-blanco',
    description: 'Anillo clásico regulable',
    materialDetails: 'Acero blanco con strass',
    categoryId: 'cat-anillos',
    costCents: 900000,
    retailPriceCents: 1800000,
    wholesalePriceCents: null,
    wholesaleMinQty: null,
    stockQty: 5,
    minStockQty: 2,
    isActive: true,
    images: [],
    createdBy: null,
    updatedBy: null,
    createdAt: '2026-11-26T00:00:00Z',
    updatedAt: '2026-11-26T00:00:00Z',
  },
  {
    id: '2',
    sku: 'CAD-01',
    name: 'Cadena Eslabones Acero',
    slug: 'cadena-eslabones-acero',
    description: 'Cadena 45cm',
    materialDetails: 'Acero quirúrgico',
    categoryId: 'cat-cadenas',
    costCents: 1000000,
    retailPriceCents: 2000000,
    wholesalePriceCents: null,
    wholesaleMinQty: null,
    stockQty: 1,
    minStockQty: 3,
    isActive: true,
    images: [],
    createdBy: null,
    updatedBy: null,
    createdAt: '2026-11-26T00:00:00Z',
    updatedAt: '2026-11-26T00:00:00Z',
  },
  {
    id: '3',
    sku: 'PUL-02',
    name: 'Pulsera Esclava Minimal',
    slug: 'pulsera-esclava-minimal',
    description: 'Pulsera lisa',
    materialDetails: 'Acero inoxidable pulido',
    categoryId: 'cat-pulseras',
    costCents: 1200000,
    retailPriceCents: 2400000,
    wholesalePriceCents: null,
    wholesaleMinQty: null,
    stockQty: 0,
    minStockQty: 2,
    isActive: true,
    images: [],
    createdBy: null,
    updatedBy: null,
    createdAt: '2026-11-26T00:00:00Z',
    updatedAt: '2026-11-26T00:00:00Z',
  },
];

describe('inventoryUtils', () => {
  it('classifies stock health thresholds cleanly', () => {
    expect(getStockHealth(0, 2)).toBe('out');
    expect(getStockHealth(2, 2)).toBe('low');
    expect(getStockHealth(5, 2)).toBe('ok');
  });

  it('computes profit, margin, and markup percentages', () => {
    expect(calculateMarginMetrics(100000, 200000)).toEqual({
      profitCents: 100000,
      marginPercent: 50,
      markupPercent: 100,
    });
  });

  it('slugifies Spanish accessory names safely', () => {
    expect(slugifyText('Aros Argolla Diseño Árbol · N°2!')).toBe('aros-argolla-diseno-arbol-n-2');
  });

  it('filters inventory by search and stock state and orders replenishment queue', () => {
    expect(
      filterInventoryProducts(SAMPLE_PRODUCTS, {
        query: 'eslabones',
        categoryId: 'all',
        status: 'needs_restock',
      }).map((p) => p.id),
    ).toEqual(['2']);

    expect(getReplenishmentQueue(SAMPLE_PRODUCTS).map((p) => p.id)).toEqual(['3', '2']);
  });
});
