import { Check, Gem, MessageCircle, Plus, Search, ShoppingBag } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { useApp } from '../../../app/providers/useApp';
import { useCart } from '../../../app/providers/useCart';
import { storeService } from '../../../services';
import { formatMoney } from '../../../shared/lib/money';
import type { Category, PublicCatalogProduct } from '../../../shared/types/domain';
import { ProductDetailModal } from '../components/ProductDetailModal';
import { filterPublicProducts } from '../lib/cartUtils';
import { buildWhatsAppUrl } from '../lib/sellerContext';

/**
 * Mobile-first public e-commerce catalog storefront.
 */
export function CatalogHomePage() {
  const { activeSeller, publicMeta } = useApp();
  const { items, itemCount, totalCents, addProduct } = useCart();

  const [products, setProducts] = useState<PublicCatalogProduct[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  const [query, setQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [onlyInStock, setOnlyInStock] = useState(false);
  const [detailProduct, setDetailProduct] = useState<PublicCatalogProduct | null>(null);

  useEffect(() => {
    let active = true;
    storeService
      .getPublicCatalog()
      .then((catalog) => {
        if (!active) return;
        setProducts(catalog.products);
        setCategories(catalog.categories);
      })
      .catch((error) => {
        if (!active) return;
        setLoadError(
          error instanceof Error ? error.message : 'No pudimos cargar el catálogo en este momento.',
        );
      })
      .finally(() => {
        if (active) setIsLoading(false);
      });

    return () => {
      active = false;
    };
  }, []);

  const categoryMap = useMemo(
    () => new Map(categories.map((cat) => [cat.id, cat.name])),
    [categories],
  );

  const cartQtyMap = useMemo(
    () => new Map(items.map((item) => [item.productId, item.qty])),
    [items],
  );

  const filteredProducts = useMemo(
    () =>
      filterPublicProducts(products, {
        query,
        categoryId: selectedCategory,
        onlyInStock,
      }),
    [products, query, selectedCategory, onlyInStock],
  );

  const whatsappConsultUrl = activeSeller?.whatsappNumber
    ? buildWhatsAppUrl(
        activeSeller.whatsappNumber,
        `Hola ${activeSeller.fullName}! Quiero consultar por accesorios de ${publicMeta.settings.businessName}.`,
      )
    : null;

  return (
    <div className="space-y-5">
      {/* Storefront header / seller attribution */}
      <section className="rounded-2xl border border-line bg-card p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div className="space-y-1">
          <h1 className="text-lg font-bold tracking-tight sm:text-xl">
            {publicMeta.settings.businessName}
          </h1>
          <p className="text-xs sm:text-sm text-muted">
            {activeSeller ? (
              <>
                Catálogo compartido por{' '}
                <strong className="text-ink">{activeSeller.fullName}</strong>. Elegí tus piezas y
                envíanos tu pedido directo por WhatsApp.
              </>
            ) : (
              'Explorá los accesorios disponibles y armá tu pedido en segundos.'
            )}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {whatsappConsultUrl ? (
            <a
              href={whatsappConsultUrl}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1.5 rounded-xl bg-brand px-3.5 py-2 text-xs font-semibold text-brand-ink transition hover:opacity-90"
            >
              <MessageCircle className="h-4 w-4" aria-hidden="true" />
              Consultar a {activeSeller?.fullName}
            </a>
          ) : null}
          <Link
            to="/envios"
            className="inline-flex items-center gap-1.5 rounded-xl border border-line bg-surface px-3.5 py-2 text-xs font-semibold text-ink hover:bg-line/40"
          >
            Envíos y entregas
          </Link>
        </div>
      </section>

      {/* Search & Category filters */}
      <section className="space-y-3">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
          <div className="relative w-full md:max-w-sm">
            <Search
              className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted"
              aria-hidden="true"
            />
            <input
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Buscar anillo, cadena, aros, acero..."
              className="w-full rounded-xl border border-line bg-card py-2.5 pl-9 pr-3 text-xs outline-none focus:border-brand"
            />
          </div>

          <label className="inline-flex items-center gap-2 text-xs font-medium text-muted self-start md:self-center cursor-pointer">
            <input
              type="checkbox"
              checked={onlyInStock}
              onChange={(e) => setOnlyInStock(e.target.checked)}
              className="rounded border-line"
            />
            Mostrar solo disponibles
          </label>
        </div>

        <div className="flex flex-wrap gap-1.5" role="group" aria-label="Categorías">
          <button
            type="button"
            onClick={() => setSelectedCategory('all')}
            className={`rounded-full border px-3 py-1.5 text-xs font-medium transition cursor-pointer ${
              selectedCategory === 'all'
                ? 'border-brand bg-brand text-brand-ink'
                : 'border-line bg-card text-ink hover:bg-line/40'
            }`}
          >
            Todas
          </button>
          {categories.map((category) => (
            <button
              key={category.id}
              type="button"
              onClick={() => setSelectedCategory(category.id)}
              className={`rounded-full border px-3 py-1.5 text-xs font-medium transition cursor-pointer ${
                selectedCategory === category.id
                  ? 'border-brand bg-brand text-brand-ink'
                  : 'border-line bg-card text-ink hover:bg-line/40'
              }`}
            >
              {category.name}
            </button>
          ))}
        </div>
      </section>

      {/* Catalog Grid */}
      {isLoading ? (
        <p className="text-sm text-muted">Cargando accesorios...</p>
      ) : loadError ? (
        <div
          role="alert"
          className="rounded-2xl border border-danger/30 bg-danger-soft p-4 text-xs font-medium text-danger"
        >
          {loadError}
        </div>
      ) : filteredProducts.length === 0 ? (
        <div className="rounded-2xl border border-line bg-card p-6 text-center space-y-2">
          <p className="text-sm font-bold">No encontramos accesorios con ese filtro</p>
          <p className="text-xs text-muted">
            Probá buscar con otra palabra o seleccionar «Todas» las categorías.
          </p>
        </div>
      ) : (
        <section className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4">
          {filteredProducts.map((product) => {
            const cover = product.images[0];
            const categoryName = product.categoryId
              ? (categoryMap.get(product.categoryId) ?? 'Accesorios')
              : 'Accesorios';
            const inCartQty = cartQtyMap.get(product.id) ?? 0;
            const isOutOfStock = product.stockQty <= 0;
            const canAddMore = !isOutOfStock && inCartQty < product.stockQty;

            return (
              <article
                key={product.id}
                className="flex flex-col justify-between rounded-2xl border border-line bg-card p-2.5 sm:p-3 gap-2.5"
              >
                <div className="space-y-2">
                  <button
                    type="button"
                    onClick={() => setDetailProduct(product)}
                    className="block w-full overflow-hidden rounded-xl border border-line bg-surface cursor-pointer text-left"
                  >
                    {cover ? (
                      <img
                        src={cover.publicUrl}
                        alt={product.name}
                        className="aspect-square w-full object-cover transition hover:scale-105"
                      />
                    ) : (
                      <div className="aspect-square w-full flex items-center justify-center text-muted">
                        <Gem className="h-8 w-8" aria-hidden="true" />
                      </div>
                    )}
                  </button>

                  <div className="space-y-1">
                    <div className="flex items-center justify-between gap-1">
                      <span className="truncate text-xs text-muted">{categoryName}</span>
                      {isOutOfStock ? (
                        <span className="shrink-0 rounded-full bg-danger-soft px-2 py-0.5 text-xs font-semibold text-danger">
                          Sin stock
                        </span>
                      ) : product.stockQty <= product.minStockQty ? (
                        <span className="shrink-0 rounded-full bg-warn-soft px-2 py-0.5 text-xs font-semibold text-warn">
                          Últimas {product.stockQty}
                        </span>
                      ) : null}
                    </div>

                    <button
                      type="button"
                      onClick={() => setDetailProduct(product)}
                      className="block text-left text-xs sm:text-sm font-bold leading-snug text-ink hover:underline cursor-pointer"
                    >
                      {product.name}
                    </button>

                    {product.materialDetails ? (
                      <p className="line-clamp-1 text-xs text-muted">{product.materialDetails}</p>
                    ) : null}
                  </div>
                </div>

                <div className="flex items-center justify-between gap-1.5 pt-1 border-t border-line/70">
                  <span className="text-sm font-bold text-ink">
                    {formatMoney(product.retailPriceCents)}
                  </span>

                  {isOutOfStock ? (
                    <button
                      type="button"
                      onClick={() => setDetailProduct(product)}
                      className="rounded-lg border border-line bg-surface px-2.5 py-1.5 text-xs font-semibold text-muted hover:text-ink cursor-pointer"
                    >
                      Ver
                    </button>
                  ) : (
                    <button
                      type="button"
                      disabled={!canAddMore}
                      onClick={() => addProduct(product, 1)}
                      className="inline-flex items-center gap-1 rounded-lg bg-brand px-2.5 py-1.5 text-xs font-semibold text-brand-ink transition hover:opacity-90 disabled:opacity-50 cursor-pointer"
                    >
                      {inCartQty > 0 ? (
                        <>
                          <Check className="h-3.5 w-3.5" aria-hidden="true" />
                          <span>{inCartQty}</span>
                        </>
                      ) : (
                        <>
                          <Plus className="h-3.5 w-3.5" aria-hidden="true" />
                          <span>Sumar</span>
                        </>
                      )}
                    </button>
                  )}
                </div>
              </article>
            );
          })}
        </section>
      )}

      {/* Quick checkout callout when cart has items */}
      {itemCount > 0 ? (
        <div className="rounded-2xl border border-brand/20 bg-card p-3.5 flex items-center justify-between gap-3">
          <div className="text-xs">
            <strong className="text-ink">
              {itemCount} {itemCount === 1 ? 'accesorio' : 'accesorios'} en tu pedido
            </strong>{' '}
            <span className="text-muted">· Total {formatMoney(totalCents)}</span>
          </div>
          <Link
            to="/pedido"
            className="inline-flex shrink-0 items-center gap-1.5 rounded-xl bg-brand px-3.5 py-2 text-xs font-semibold text-brand-ink hover:opacity-90"
          >
            <ShoppingBag className="h-3.5 w-3.5" aria-hidden="true" />
            Finalizar pedido
          </Link>
        </div>
      ) : null}

      {detailProduct ? (
        <ProductDetailModal
          product={detailProduct}
          categoryName={
            detailProduct.categoryId
              ? (categoryMap.get(detailProduct.categoryId) ?? 'Accesorios')
              : 'Accesorios'
          }
          activeSeller={activeSeller}
          businessName={publicMeta.settings.businessName}
          inCartQty={cartQtyMap.get(detailProduct.id) ?? 0}
          onAddToCart={addProduct}
          onClose={() => setDetailProduct(null)}
        />
      ) : null}
    </div>
  );
}
