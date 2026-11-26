import { Gem, MessageCircle, Minus, Plus, ShoppingBag, X } from 'lucide-react';
import { useState } from 'react';
import { formatMoney } from '../../../shared/lib/money';
import type { PartnerProfile, PublicCatalogProduct } from '../../../shared/types/domain';
import { buildWhatsAppUrl } from '../lib/sellerContext';

interface ProductDetailModalProps {
  product: PublicCatalogProduct;
  categoryName: string;
  activeSeller: PartnerProfile | null;
  businessName: string;
  inCartQty: number;
  onAddToCart: (product: PublicCatalogProduct, qty: number) => void;
  onClose: () => void;
}

/**
 * Interactive accessory detail sheet with multi-photo gallery and stock-safe quantity selector.
 */
export function ProductDetailModal({
  product,
  categoryName,
  activeSeller,
  businessName,
  inCartQty,
  onAddToCart,
  onClose,
}: ProductDetailModalProps) {
  const [selectedIndex, setSelectedIndex] = useState(0);
  const remainingAvailable = Math.max(0, product.stockQty - inCartQty);
  const [qty, setQty] = useState(1);

  const activePhoto = product.images[selectedIndex] ?? product.images[0];
  const isOutOfStock = product.stockQty <= 0;

  const consultUrl = activeSeller?.whatsappNumber
    ? buildWhatsAppUrl(
        activeSeller.whatsappNumber,
        `Hola ${activeSeller.fullName}! Quiero consultar disponibilidad de "${product.name}" en ${businessName}.`,
      )
    : null;

  return (
    <div
      className="fixed inset-0 z-40 flex items-end sm:items-center justify-center bg-ink/40 p-0 sm:p-4 backdrop-blur-xs"
      role="dialog"
      aria-modal="true"
      aria-labelledby="detail-modal-title"
    >
      <div className="w-full max-w-2xl max-h-[92dvh] overflow-y-auto rounded-t-2xl sm:rounded-2xl border border-line bg-card p-5 sm:p-6 space-y-5 shadow-xl">
        <div className="flex items-start justify-between gap-3">
          <div>
            <span className="inline-block rounded-full bg-surface border border-line px-2.5 py-0.5 text-xs font-medium text-muted">
              {categoryName}
            </span>
            <h2 id="detail-modal-title" className="text-lg font-bold tracking-tight mt-1">
              {product.name}
            </h2>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="rounded-lg border border-line p-1.5 text-muted hover:text-ink cursor-pointer"
            aria-label="Cerrar detalle"
          >
            <X className="h-4 w-4" aria-hidden="true" />
          </button>
        </div>

        <div className="grid gap-5 sm:grid-cols-2">
          {/* Gallery */}
          <div className="space-y-2.5">
            {activePhoto ? (
              <img
                src={activePhoto.publicUrl}
                alt={product.name}
                className="aspect-square w-full rounded-2xl border border-line object-cover bg-surface"
              />
            ) : (
              <div className="aspect-square w-full rounded-2xl border border-line bg-surface flex flex-col items-center justify-center gap-2 text-muted">
                <Gem className="h-10 w-10" aria-hidden="true" />
                <span className="text-xs">Sin foto cargada</span>
              </div>
            )}

            {product.images.length > 1 ? (
              <div className="flex flex-wrap gap-2">
                {product.images.map((image, idx) => (
                  <button
                    key={image.id}
                    type="button"
                    onClick={() => setSelectedIndex(idx)}
                    className={`rounded-xl border overflow-hidden cursor-pointer ${
                      idx === selectedIndex ? 'border-brand ring-2 ring-brand/20' : 'border-line'
                    }`}
                  >
                    <img
                      src={image.publicUrl}
                      alt={`${product.name} ${idx + 1}`}
                      className="h-14 w-14 object-cover"
                    />
                  </button>
                ))}
              </div>
            ) : null}
          </div>

          {/* Info & CTA */}
          <div className="flex flex-col justify-between gap-4">
            <div className="space-y-3">
              <div className="flex items-center justify-between gap-2">
                <span className="text-2xl font-bold text-ink">
                  {formatMoney(product.retailPriceCents)}
                </span>
                {isOutOfStock ? (
                  <span className="rounded-full bg-danger-soft px-2.5 py-0.5 text-xs font-semibold text-danger">
                    Sin stock
                  </span>
                ) : product.stockQty <= product.minStockQty ? (
                  <span className="rounded-full bg-warn-soft px-2.5 py-0.5 text-xs font-semibold text-warn">
                    Últimas {product.stockQty} u.
                  </span>
                ) : (
                  <span className="rounded-full bg-ok-soft px-2.5 py-0.5 text-xs font-semibold text-ok">
                    Disponible ({product.stockQty} u.)
                  </span>
                )}
              </div>

              {product.description ? (
                <p className="text-sm leading-relaxed text-ink">{product.description}</p>
              ) : null}

              {product.materialDetails ? (
                <div className="rounded-xl border border-line bg-surface p-3 space-y-1">
                  <div className="text-xs font-bold text-ink">Detalles del accesorio</div>
                  <p className="text-xs leading-relaxed text-muted">{product.materialDetails}</p>
                </div>
              ) : null}
            </div>

            {isOutOfStock ? (
              <div className="space-y-2 border-t border-line pt-4">
                <p className="text-xs text-muted">
                  Esta pieza está momentáneamente sin stock. Podés consultar cuándo ingresa de
                  nuevo.
                </p>
                {consultUrl ? (
                  <a
                    href={consultUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="flex w-full items-center justify-center gap-2 rounded-xl bg-brand px-4 py-2.5 text-xs font-semibold text-brand-ink hover:opacity-90"
                  >
                    <MessageCircle className="h-4 w-4" aria-hidden="true" />
                    Consultar reposición a {activeSeller?.fullName}
                  </a>
                ) : null}
              </div>
            ) : remainingAvailable === 0 ? (
              <div className="rounded-xl border border-line bg-surface p-3 text-xs text-muted">
                Ya agregaste todo el stock disponible ({inCartQty} u.) en tu pedido actual.
              </div>
            ) : (
              <div className="space-y-3 border-t border-line pt-4">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold">Cantidad</span>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setQty((q) => Math.max(1, q - 1))}
                      className="rounded-lg border border-line bg-surface p-1.5 text-ink cursor-pointer"
                      aria-label="Disminuir cantidad"
                    >
                      <Minus className="h-3.5 w-3.5" aria-hidden="true" />
                    </button>
                    <span className="min-w-[2rem] text-center text-sm font-bold">{qty}</span>
                    <button
                      type="button"
                      onClick={() => setQty((q) => Math.min(remainingAvailable, q + 1))}
                      className="rounded-lg border border-line bg-surface p-1.5 text-ink cursor-pointer"
                      aria-label="Aumentar cantidad"
                    >
                      <Plus className="h-3.5 w-3.5" aria-hidden="true" />
                    </button>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => {
                    onAddToCart(product, qty);
                    onClose();
                  }}
                  className="flex w-full items-center justify-center gap-2 rounded-xl bg-brand px-4 py-3 text-xs font-semibold text-brand-ink hover:opacity-90 cursor-pointer"
                >
                  <ShoppingBag className="h-4 w-4" aria-hidden="true" />
                  Agregar al pedido · {formatMoney(product.retailPriceCents * qty)}
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
