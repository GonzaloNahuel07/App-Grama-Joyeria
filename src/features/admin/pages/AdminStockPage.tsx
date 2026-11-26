import {
  AlertTriangle,
  Eye,
  EyeOff,
  Minus,
  PackagePlus,
  Pencil,
  Plus,
  Search,
  Trash2,
} from 'lucide-react';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useApp } from '../../../app/providers/useApp';
import { storeService } from '../../../services';
import { formatMoney } from '../../../shared/lib/money';
import type { Category, Product } from '../../../shared/types/domain';
import { ProductFormModal } from '../../inventory/components/ProductFormModal';
import { ProductThumbnail } from '../../inventory/components/ProductThumbnail';
import { StockHealthBadge } from '../../inventory/components/StockHealthBadge';
import {
  calculateMarginMetrics,
  filterInventoryProducts,
  getReplenishmentQueue,
  type InventoryStatusFilter,
} from '../../inventory/lib/inventoryUtils';

const STATUS_FILTERS: Array<{ value: InventoryStatusFilter; label: string }> = [
  { value: 'all', label: 'Todos' },
  { value: 'needs_restock', label: 'Stock bajo' },
  { value: 'out', label: 'Agotados' },
  { value: 'hidden', label: 'Ocultos' },
];

/**
 * Partner inventory, catalog editor, and controlled replenishment queue view.
 */
export function AdminStockPage() {
  const { refreshReplenishmentCount } = useApp();
  const [searchParams, setSearchParams] = useSearchParams();
  const activeTab = searchParams.get('tab') === 'restock' ? 'restock' : 'inventory';

  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [query, setQuery] = useState('');
  const [categoryId, setCategoryId] = useState('all');
  const [statusFilter, setStatusFilter] = useState<InventoryStatusFilter>('all');

  const [editingProduct, setEditingProduct] = useState<Product | null | undefined>(undefined);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [restockQuantities, setRestockQuantities] = useState<Record<string, string>>({});
  const [busyProductId, setBusyProductId] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<{ type: 'ok' | 'err'; text: string } | null>(null);

  const loadInventory = useCallback(async () => {
    const [loadedProducts, loadedCategories] = await Promise.all([
      storeService.getAdminProducts(),
      storeService.getCategories(),
    ]);
    setProducts(loadedProducts);
    setCategories(loadedCategories);
    await refreshReplenishmentCount();
  }, [refreshReplenishmentCount]);

  useEffect(() => {
    let active = true;
    Promise.all([storeService.getAdminProducts(), storeService.getCategories()])
      .then(async ([loadedProducts, loadedCategories]) => {
        if (!active) return;
        setProducts(loadedProducts);
        setCategories(loadedCategories);
        await refreshReplenishmentCount();
      })
      .catch((error) => {
        if (!active) return;
        setFeedback({
          type: 'err',
          text: error instanceof Error ? error.message : 'No pudimos cargar el inventario.',
        });
      })
      .finally(() => {
        if (active) setIsLoading(false);
      });

    return () => {
      active = false;
    };
  }, [refreshReplenishmentCount]);

  const categoryMap = useMemo(
    () => new Map(categories.map((cat) => [cat.id, cat.name])),
    [categories],
  );

  const filteredProducts = useMemo(
    () => filterInventoryProducts(products, { query, categoryId, status: statusFilter }),
    [products, query, categoryId, statusFilter],
  );

  const replenishmentQueue = useMemo(() => getReplenishmentQueue(products), [products]);

  function setTab(tab: 'inventory' | 'restock') {
    if (tab === 'restock') {
      setSearchParams({ tab: 'restock' });
    } else {
      setSearchParams({});
    }
  }

  async function handleStockDelta(productId: string, delta: number, reason?: string) {
    setFeedback(null);
    setBusyProductId(productId);
    try {
      await storeService.adjustProductStock(productId, delta, reason);
      await loadInventory();
      if (reason) {
        setFeedback({ type: 'ok', text: 'Stock repuesto y registrado en la actividad.' });
      }
    } catch (error) {
      setFeedback({
        type: 'err',
        text: error instanceof Error ? error.message : 'No pudimos actualizar el stock.',
      });
    } finally {
      setBusyProductId(null);
    }
  }

  async function handleToggleVisibility(product: Product) {
    setFeedback(null);
    setBusyProductId(product.id);
    try {
      await storeService.saveProduct(
        {
          sku: product.sku,
          name: product.name,
          description: product.description,
          materialDetails: product.materialDetails,
          categoryId: product.categoryId,
          costCents: product.costCents,
          retailPriceCents: product.retailPriceCents,
          wholesalePriceCents: product.wholesalePriceCents,
          wholesaleMinQty: product.wholesaleMinQty,
          stockQty: product.stockQty,
          minStockQty: product.minStockQty,
          isActive: !product.isActive,
        },
        product.id,
      );
      await loadInventory();
    } catch (error) {
      setFeedback({
        type: 'err',
        text: error instanceof Error ? error.message : 'No pudimos cambiar la visibilidad.',
      });
    } finally {
      setBusyProductId(null);
    }
  }

  async function handleDeleteProduct(productId: string) {
    setFeedback(null);
    setBusyProductId(productId);
    try {
      await storeService.deleteProduct(productId);
      setConfirmDeleteId(null);
      await loadInventory();
      setFeedback({ type: 'ok', text: 'Accesorio eliminado del inventario.' });
    } catch (error) {
      setFeedback({
        type: 'err',
        text: error instanceof Error ? error.message : 'No pudimos eliminar el accesorio.',
      });
    } finally {
      setBusyProductId(null);
    }
  }

  function handleRestockSubmit(product: Product) {
    const suggested = Math.max(1, product.minStockQty - product.stockQty + 2);
    const raw = restockQuantities[product.id];
    const qty = raw !== undefined ? Number(raw) : suggested;
    if (!Number.isInteger(qty) || qty <= 0) {
      setFeedback({ type: 'err', text: 'Ingresá una cantidad válida mayor a 0 para reponer.' });
      return;
    }
    void handleStockDelta(product.id, qty, 'Reposición');
  }

  if (isLoading) {
    return <p className="text-sm text-muted">Cargando inventario y alertas...</p>;
  }

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold tracking-tight">Stock, Catálogo y Reposición</h1>
          <p className="text-sm text-muted">
            Administrá precios, fotos, mínimos de stock y visibilidad del catálogo.
          </p>
        </div>

        <button
          type="button"
          onClick={() => setEditingProduct(null)}
          className="inline-flex items-center justify-center gap-1.5 self-start rounded-xl bg-brand px-4 py-2.5 text-xs font-semibold text-brand-ink hover:opacity-90 cursor-pointer"
        >
          <Plus className="h-4 w-4" aria-hidden="true" />
          Nueva joya
        </button>
      </div>

      {feedback ? (
        <div
          role="status"
          className={`rounded-xl border px-4 py-2.5 text-xs font-semibold ${
            feedback.type === 'ok'
              ? 'border-ok/30 bg-ok-soft text-ok'
              : 'border-danger/30 bg-danger-soft text-danger'
          }`}
        >
          {feedback.text}
        </div>
      ) : null}

      {/* Sub-tabs: Full Inventory vs Replenishment Queue */}
      <div className="flex flex-wrap gap-2 border-b border-line pb-3">
        <button
          type="button"
          onClick={() => setTab('inventory')}
          className={`rounded-xl border px-3.5 py-2 text-xs font-semibold transition cursor-pointer ${
            activeTab === 'inventory'
              ? 'border-brand bg-brand text-brand-ink'
              : 'border-line bg-card text-ink hover:bg-line/40'
          }`}
        >
          Inventario completo ({products.length})
        </button>
        <button
          type="button"
          onClick={() => setTab('restock')}
          className={`inline-flex items-center gap-2 rounded-xl border px-3.5 py-2 text-xs font-semibold transition cursor-pointer ${
            activeTab === 'restock'
              ? 'border-brand bg-brand text-brand-ink'
              : 'border-line bg-card text-ink hover:bg-line/40'
          }`}
        >
          <AlertTriangle className="h-3.5 w-3.5" aria-hidden="true" />
          Bandeja de reposición
          {replenishmentQueue.length > 0 ? (
            <span className="rounded-full bg-danger px-2 py-0.5 text-xs font-bold text-brand-ink">
              {replenishmentQueue.length}
            </span>
          ) : null}
        </button>
      </div>

      {activeTab === 'restock' ? (
        <section className="space-y-4">
          {replenishmentQueue.length === 0 ? (
            <div className="rounded-2xl border border-line bg-card p-6 text-center space-y-1">
              <p className="text-sm font-bold">¡Todo el stock está cubierto!</p>
              <p className="text-xs text-muted">
                No hay joyas activas en o por debajo de su stock mínimo.
              </p>
            </div>
          ) : (
            <div className="grid gap-3">
              {replenishmentQueue.map((product) => {
                const suggested = Math.max(1, product.minStockQty - product.stockQty + 2);
                const qtyValue = restockQuantities[product.id] ?? String(suggested);
                const missing = Math.max(0, product.minStockQty - product.stockQty);
                const isBusy = busyProductId === product.id;

                return (
                  <article
                    key={product.id}
                    className="rounded-2xl border border-line bg-card p-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4"
                  >
                    <div className="flex items-start gap-3">
                      <ProductThumbnail images={product.images} alt={product.name} />
                      <div className="space-y-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <h2 className="text-sm font-bold">{product.name}</h2>
                          <StockHealthBadge
                            stockQty={product.stockQty}
                            minStockQty={product.minStockQty}
                          />
                        </div>
                        <p className="text-xs text-muted">
                          Costo unitario: {formatMoney(product.costCents)} · Faltan al menos{' '}
                          <strong className="text-ink">{Math.max(1, missing)} u.</strong> para
                          superar el mínimo ({product.minStockQty} u.)
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 self-end sm:self-center">
                      <label className="text-xs font-medium text-muted">
                        Ingresan:
                        <input
                          type="number"
                          min="1"
                          step="1"
                          value={qtyValue}
                          onChange={(e) =>
                            setRestockQuantities((prev) => ({
                              ...prev,
                              [product.id]: e.target.value,
                            }))
                          }
                          className="ml-1.5 w-16 rounded-lg border border-line bg-surface px-2 py-1.5 text-xs font-semibold text-ink"
                        />
                      </label>
                      <button
                        type="button"
                        disabled={isBusy}
                        onClick={() => handleRestockSubmit(product)}
                        className="inline-flex items-center gap-1.5 rounded-xl bg-brand px-3.5 py-2 text-xs font-semibold text-brand-ink hover:opacity-90 disabled:opacity-60 cursor-pointer"
                      >
                        <PackagePlus className="h-3.5 w-3.5" aria-hidden="true" />
                        Reponer
                      </button>
                    </div>
                  </article>
                );
              })}
            </div>
          )}
        </section>
      ) : (
        <section className="space-y-4">
          {/* Search and filters */}
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-3">
            <div className="flex flex-col sm:flex-row gap-2 flex-1">
              <div className="relative flex-1 sm:max-w-xs">
                <Search
                  className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted"
                  aria-hidden="true"
                />
                <input
                  type="search"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Buscar por nombre, SKU o material..."
                  className="w-full rounded-xl border border-line bg-card py-2 pl-9 pr-3 text-xs outline-none focus:border-brand"
                />
              </div>

              <select
                aria-label="Filtrar por categoría"
                value={categoryId}
                onChange={(e) => setCategoryId(e.target.value)}
                className="rounded-xl border border-line bg-card px-3 py-2 text-xs outline-none focus:border-brand"
              >
                <option value="all">Todas las categorías</option>
                {categories.map((cat) => (
                  <option key={cat.id} value={cat.id}>
                    {cat.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex flex-wrap gap-1.5">
              {STATUS_FILTERS.map((filter) => (
                <button
                  key={filter.value}
                  type="button"
                  onClick={() => setStatusFilter(filter.value)}
                  className={`rounded-full border px-3 py-1 text-xs font-medium transition cursor-pointer ${
                    statusFilter === filter.value
                      ? 'border-brand bg-brand text-brand-ink'
                      : 'border-line bg-card text-ink hover:bg-line/40'
                  }`}
                >
                  {filter.label}
                </button>
              ))}
            </div>
          </div>

          {filteredProducts.length === 0 ? (
            <div className="rounded-2xl border border-line bg-card p-6 text-center space-y-2">
              <p className="text-sm font-bold">No hay accesorios que coincidan</p>
              <p className="text-xs text-muted">
                Probá limpiar los filtros o cargá tu primera pieza desde el botón «Nueva joya».
              </p>
            </div>
          ) : (
            <>
              {/* Mobile cards */}
              <div className="grid gap-3 md:hidden">
                {filteredProducts.map((product) => {
                  const margin = calculateMarginMetrics(
                    product.costCents,
                    product.retailPriceCents,
                  );
                  const categoryName = product.categoryId
                    ? (categoryMap.get(product.categoryId) ?? 'Sin categoría')
                    : 'Sin categoría';
                  const isBusy = busyProductId === product.id;

                  return (
                    <article
                      key={product.id}
                      className="rounded-2xl border border-line bg-card p-4 space-y-3"
                    >
                      <div className="flex items-start gap-3">
                        <ProductThumbnail images={product.images} alt={product.name} />
                        <div className="min-w-0 flex-1 space-y-1">
                          <div className="flex items-center justify-between gap-2">
                            <span className="text-xs text-muted">{categoryName}</span>
                            <StockHealthBadge
                              stockQty={product.stockQty}
                              minStockQty={product.minStockQty}
                            />
                          </div>
                          <h3 className="text-sm font-bold leading-snug">{product.name}</h3>
                          <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted">
                            <span>
                              Venta:{' '}
                              <strong className="text-ink">
                                {formatMoney(product.retailPriceCents)}
                              </strong>
                            </span>
                            <span>Costo: {formatMoney(product.costCents)}</span>
                            <span>Margen: {margin.marginPercent}%</span>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center justify-between gap-2 border-t border-line pt-3">
                        <div className="flex items-center gap-1.5">
                          <button
                            type="button"
                            disabled={isBusy || product.stockQty === 0}
                            onClick={() => void handleStockDelta(product.id, -1, 'Ajuste rápido')}
                            className="rounded-lg border border-line bg-surface p-1.5 text-ink disabled:opacity-40 cursor-pointer"
                            aria-label="Restar 1 unidad"
                          >
                            <Minus className="h-3.5 w-3.5" aria-hidden="true" />
                          </button>
                          <span className="min-w-[2.2rem] text-center text-xs font-bold">
                            {product.stockQty} u.
                          </span>
                          <button
                            type="button"
                            disabled={isBusy}
                            onClick={() => void handleStockDelta(product.id, 1, 'Ajuste rápido')}
                            className="rounded-lg border border-line bg-surface p-1.5 text-ink disabled:opacity-40 cursor-pointer"
                            aria-label="Sumar 1 unidad"
                          >
                            <Plus className="h-3.5 w-3.5" aria-hidden="true" />
                          </button>
                        </div>

                        <div className="flex items-center gap-1.5">
                          <button
                            type="button"
                            disabled={isBusy}
                            onClick={() => void handleToggleVisibility(product)}
                            className="rounded-lg border border-line bg-surface p-1.5 text-muted hover:text-ink cursor-pointer"
                            title={
                              product.isActive ? 'Ocultar del catálogo' : 'Mostrar en catálogo'
                            }
                          >
                            {product.isActive ? (
                              <Eye className="h-4 w-4" aria-hidden="true" />
                            ) : (
                              <EyeOff className="h-4 w-4" aria-hidden="true" />
                            )}
                          </button>
                          <button
                            type="button"
                            onClick={() => setEditingProduct(product)}
                            className="inline-flex items-center gap-1 rounded-lg border border-line bg-surface px-2.5 py-1.5 text-xs font-semibold cursor-pointer"
                          >
                            <Pencil className="h-3.5 w-3.5" aria-hidden="true" />
                            Editar
                          </button>
                        </div>
                      </div>
                    </article>
                  );
                })}
              </div>

              {/* Desktop table */}
              <div className="hidden md:block overflow-x-auto rounded-2xl border border-line bg-card">
                <table className="w-full text-left text-xs">
                  <thead className="border-b border-line bg-surface/60 text-muted">
                    <tr>
                      <th className="px-4 py-3 font-semibold">Accesorio</th>
                      <th className="px-4 py-3 font-semibold">Categoría</th>
                      <th className="px-4 py-3 font-semibold">Costo / Venta</th>
                      <th className="px-4 py-3 font-semibold">Stock / Mínimo</th>
                      <th className="px-4 py-3 font-semibold">Catálogo</th>
                      <th className="px-4 py-3 font-semibold text-right">Acciones</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-line">
                    {filteredProducts.map((product) => {
                      const margin = calculateMarginMetrics(
                        product.costCents,
                        product.retailPriceCents,
                      );
                      const categoryName = product.categoryId
                        ? (categoryMap.get(product.categoryId) ?? 'Sin categoría')
                        : 'Sin categoría';
                      const isBusy = busyProductId === product.id;

                      return (
                        <tr key={product.id} className="hover:bg-surface/40">
                          <td className="px-4 py-3">
                            <div className="flex items-center gap-3">
                              <ProductThumbnail
                                images={product.images}
                                alt={product.name}
                                sizeClass="h-11 w-11"
                              />
                              <div>
                                <div className="font-bold text-sm text-ink">{product.name}</div>
                                <div className="text-muted">
                                  {product.sku ? `${product.sku} · ` : ''}
                                  {product.materialDetails || 'Sin detalle técnico'}
                                </div>
                              </div>
                            </div>
                          </td>
                          <td className="px-4 py-3 text-muted">{categoryName}</td>
                          <td className="px-4 py-3">
                            <div className="font-bold text-ink">
                              {formatMoney(product.retailPriceCents)}
                            </div>
                            <div className="text-muted">
                              Costo {formatMoney(product.costCents)} · {margin.marginPercent}%
                            </div>
                          </td>
                          <td className="px-4 py-3">
                            <div className="flex items-center gap-2">
                              <StockHealthBadge
                                stockQty={product.stockQty}
                                minStockQty={product.minStockQty}
                              />
                            </div>
                          </td>
                          <td className="px-4 py-3">
                            <button
                              type="button"
                              disabled={isBusy}
                              onClick={() => void handleToggleVisibility(product)}
                              className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 font-semibold cursor-pointer ${
                                product.isActive
                                  ? 'bg-ok-soft text-ok'
                                  : 'bg-surface border border-line text-muted'
                              }`}
                            >
                              {product.isActive ? (
                                <>
                                  <Eye className="h-3 w-3" aria-hidden="true" />
                                  Visible
                                </>
                              ) : (
                                <>
                                  <EyeOff className="h-3 w-3" aria-hidden="true" />
                                  Oculto
                                </>
                              )}
                            </button>
                          </td>
                          <td className="px-4 py-3">
                            <div className="flex items-center justify-end gap-1.5">
                              <button
                                type="button"
                                disabled={isBusy || product.stockQty === 0}
                                onClick={() =>
                                  void handleStockDelta(product.id, -1, 'Ajuste rápido')
                                }
                                className="rounded-lg border border-line bg-surface p-1.5 hover:bg-line/50 disabled:opacity-40 cursor-pointer"
                                aria-label="Restar 1 unidad"
                              >
                                <Minus className="h-3.5 w-3.5" aria-hidden="true" />
                              </button>
                              <button
                                type="button"
                                disabled={isBusy}
                                onClick={() =>
                                  void handleStockDelta(product.id, 1, 'Ajuste rápido')
                                }
                                className="rounded-lg border border-line bg-surface p-1.5 hover:bg-line/50 disabled:opacity-40 cursor-pointer"
                                aria-label="Sumar 1 unidad"
                              >
                                <Plus className="h-3.5 w-3.5" aria-hidden="true" />
                              </button>
                              <button
                                type="button"
                                onClick={() => setEditingProduct(product)}
                                className="inline-flex items-center gap-1 rounded-lg border border-line bg-surface px-2.5 py-1.5 font-semibold hover:bg-line/50 cursor-pointer"
                              >
                                <Pencil className="h-3.5 w-3.5" aria-hidden="true" />
                                Editar
                              </button>
                              {confirmDeleteId === product.id ? (
                                <button
                                  type="button"
                                  disabled={isBusy}
                                  onClick={() => void handleDeleteProduct(product.id)}
                                  className="rounded-lg bg-danger px-2.5 py-1.5 font-semibold text-brand-ink cursor-pointer"
                                >
                                  Confirmar
                                </button>
                              ) : (
                                <button
                                  type="button"
                                  onClick={() => setConfirmDeleteId(product.id)}
                                  className="rounded-lg border border-line bg-surface p-1.5 text-muted hover:text-danger cursor-pointer"
                                  aria-label="Eliminar accesorio"
                                >
                                  <Trash2 className="h-3.5 w-3.5" aria-hidden="true" />
                                </button>
                              )}
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </>
          )}
        </section>
      )}

      {editingProduct !== undefined ? (
        <ProductFormModal
          product={editingProduct}
          categories={categories}
          onCategoryCreated={(cat) => setCategories((prev) => [...prev, cat])}
          onClose={() => setEditingProduct(undefined)}
          onSaved={(savedName, wasEdit) => {
            setEditingProduct(undefined);
            void loadInventory();
            setFeedback({
              type: 'ok',
              text: wasEdit
                ? `"${savedName}" actualizado correctamente.`
                : `"${savedName}" cargado en el inventario.`,
            });
          }}
        />
      ) : null}
    </div>
  );
}
