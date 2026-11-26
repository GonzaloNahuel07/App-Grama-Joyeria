import { ImagePlus, Plus, Trash2, X } from 'lucide-react';
import { useEffect, useState, type ChangeEvent, type FormEvent } from 'react';
import { storeService } from '../../../services';
import { fromCents, formatMoney, toCents } from '../../../shared/lib/money';
import type { Category, Product, ProductImage } from '../../../shared/types/domain';
import { calculateMarginMetrics } from '../lib/inventoryUtils';
import { productFormSchema } from '../lib/productSchema';

interface PendingPhoto {
  id: string;
  file: File;
  previewUrl: string;
}

interface ProductFormModalProps {
  product: Product | null;
  categories: Category[];
  onCategoryCreated: (category: Category) => void;
  onClose: () => void;
  onSaved: (savedName: string, isEdit: boolean) => void;
}

/**
 * Mobile-first create/edit jewelry modal with image compression and live margin preview.
 */
export function ProductFormModal({
  product,
  categories,
  onCategoryCreated,
  onClose,
  onSaved,
}: ProductFormModalProps) {
  const isEdit = Boolean(product);

  const [name, setName] = useState(product?.name ?? '');
  const [sku, setSku] = useState(product?.sku ?? '');
  const [categoryId, setCategoryId] = useState<string>(
    product?.categoryId ?? categories[0]?.id ?? '',
  );
  const [description, setDescription] = useState(product?.description ?? '');
  const [materialDetails, setMaterialDetails] = useState(product?.materialDetails ?? '');
  const [costInput, setCostInput] = useState(product ? String(fromCents(product.costCents)) : '');
  const [retailInput, setRetailInput] = useState(
    product ? String(fromCents(product.retailPriceCents)) : '',
  );
  const [wholesalePriceInput, setWholesalePriceInput] = useState(
    product?.wholesalePriceCents !== null && product?.wholesalePriceCents !== undefined
      ? String(fromCents(product.wholesalePriceCents))
      : '',
  );
  const [wholesaleMinQtyInput, setWholesaleMinQtyInput] = useState(
    product?.wholesaleMinQty !== null && product?.wholesaleMinQty !== undefined
      ? String(product.wholesaleMinQty)
      : '',
  );
  const [stockInput, setStockInput] = useState(product ? String(product.stockQty) : '1');
  const [minStockInput, setMinStockInput] = useState(product ? String(product.minStockQty) : '2');
  const [isActive, setIsActive] = useState(product?.isActive ?? true);

  const [existingImages, setExistingImages] = useState<ProductImage[]>(product?.images ?? []);
  const [removedImages, setRemovedImages] = useState<ProductImage[]>([]);
  const [pendingPhotos, setPendingPhotos] = useState<PendingPhoto[]>([]);

  const [showNewCategory, setShowNewCategory] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState('');
  const [isCreatingCategory, setIsCreatingCategory] = useState(false);

  const [showWholesale, setShowWholesale] = useState(
    Boolean(product?.wholesalePriceCents || product?.wholesaleMinQty),
  );
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    return () => {
      pendingPhotos.forEach((item) => URL.revokeObjectURL(item.previewUrl));
    };
  }, [pendingPhotos]);

  const parsedCost = Number(costInput || '0');
  const parsedRetail = Number(retailInput || '0');
  const liveMargin =
    Number.isFinite(parsedCost) &&
    Number.isFinite(parsedRetail) &&
    parsedCost >= 0 &&
    parsedRetail >= 0
      ? calculateMarginMetrics(toCents(parsedCost), toCents(parsedRetail))
      : null;

  function handleSelectPhotos(event: ChangeEvent<HTMLInputElement>) {
    const files = Array.from(event.target.files ?? []);
    if (files.length === 0) return;

    const added = files.map((file) => ({
      id: `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      file,
      previewUrl: URL.createObjectURL(file),
    }));
    setPendingPhotos((prev) => [...prev, ...added]);
    event.target.value = '';
  }

  function handleRemoveExistingImage(image: ProductImage) {
    setExistingImages((prev) => prev.filter((item) => item.id !== image.id));
    setRemovedImages((prev) => [...prev, image]);
  }

  function handleRemovePendingPhoto(id: string) {
    setPendingPhotos((prev) => {
      const target = prev.find((item) => item.id === id);
      if (target) URL.revokeObjectURL(target.previewUrl);
      return prev.filter((item) => item.id !== id);
    });
  }

  async function handleCreateCategory() {
    if (!newCategoryName.trim()) return;
    setErrorMessage(null);
    setIsCreatingCategory(true);
    try {
      const created = await storeService.createCategory(newCategoryName);
      onCategoryCreated(created);
      setCategoryId(created.id);
      setNewCategoryName('');
      setShowNewCategory(false);
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : 'No pudimos crear la categoría.');
    } finally {
      setIsCreatingCategory(false);
    }
  }

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setErrorMessage(null);

    const parsed = productFormSchema.safeParse({
      name,
      sku,
      categoryId: categoryId || null,
      description,
      materialDetails,
      costAmount: Number(costInput === '' ? 0 : costInput),
      retailPriceAmount: Number(retailInput === '' ? -1 : retailInput),
      wholesalePriceAmount: wholesalePriceInput.trim() === '' ? null : Number(wholesalePriceInput),
      wholesaleMinQty: wholesaleMinQtyInput.trim() === '' ? null : Number(wholesaleMinQtyInput),
      stockQty: Number(stockInput === '' ? -1 : stockInput),
      minStockQty: Number(minStockInput === '' ? -1 : minStockInput),
      isActive,
    });

    if (!parsed.success) {
      setErrorMessage(parsed.error.issues[0]?.message ?? 'Revisá los campos del formulario.');
      return;
    }

    const v = parsed.data;
    setIsSubmitting(true);
    try {
      const saved = await storeService.saveProduct(
        {
          sku: v.sku || null,
          name: v.name,
          description: v.description,
          materialDetails: v.materialDetails,
          categoryId: v.categoryId,
          costCents: toCents(v.costAmount),
          retailPriceCents: toCents(v.retailPriceAmount),
          wholesalePriceCents:
            v.wholesalePriceAmount !== null ? toCents(v.wholesalePriceAmount) : null,
          wholesaleMinQty: v.wholesaleMinQty,
          stockQty: v.stockQty,
          minStockQty: v.minStockQty,
          isActive: v.isActive,
        },
        product?.id,
      );

      for (const image of removedImages) {
        await storeService.deleteProductImage(image);
      }

      for (const pending of pendingPhotos) {
        await storeService.uploadProductImage(saved.id, pending.file);
      }

      onSaved(saved.name, isEdit);
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : 'No pudimos guardar el accesorio.');
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div
      className="fixed inset-0 z-40 flex items-end sm:items-center justify-center bg-ink/40 p-0 sm:p-4 backdrop-blur-xs"
      role="dialog"
      aria-modal="true"
      aria-labelledby="product-modal-title"
    >
      <div className="w-full max-w-2xl max-h-[92dvh] overflow-y-auto rounded-t-2xl sm:rounded-2xl border border-line bg-card p-5 sm:p-6 space-y-5 shadow-xl">
        <div className="flex items-center justify-between gap-3 border-b border-line pb-3">
          <div>
            <h2 id="product-modal-title" className="text-base font-bold">
              {isEdit ? 'Editar accesorio' : 'Cargar nueva joya'}
            </h2>
            <p className="text-xs text-muted">
              Las fotos se optimizan automáticamente antes de guardarse.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg border border-line p-1.5 text-muted hover:text-ink cursor-pointer"
            aria-label="Cerrar formulario"
          >
            <X className="h-4 w-4" aria-hidden="true" />
          </button>
        </div>

        {errorMessage ? (
          <div
            role="alert"
            className="rounded-xl border border-danger/30 bg-danger-soft px-3.5 py-2.5 text-xs font-medium text-danger"
          >
            {errorMessage}
          </div>
        ) : null}

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Photos section */}
          <div className="space-y-2">
            <label className="block text-xs font-semibold">Fotos del producto</label>
            <div className="flex flex-wrap items-center gap-2.5">
              {existingImages.map((image) => (
                <div key={image.id} className="relative">
                  <img
                    src={image.publicUrl}
                    alt={name || 'Foto de producto'}
                    className="h-20 w-20 rounded-xl border border-line object-cover"
                  />
                  <button
                    type="button"
                    onClick={() => handleRemoveExistingImage(image)}
                    className="absolute -right-1.5 -top-1.5 rounded-full bg-danger p-1 text-brand-ink shadow cursor-pointer"
                    aria-label="Quitar foto"
                  >
                    <Trash2 className="h-3 w-3" aria-hidden="true" />
                  </button>
                </div>
              ))}

              {pendingPhotos.map((photo) => (
                <div key={photo.id} className="relative">
                  <img
                    src={photo.previewUrl}
                    alt="Vista previa"
                    className="h-20 w-20 rounded-xl border border-brand object-cover"
                  />
                  <button
                    type="button"
                    onClick={() => handleRemovePendingPhoto(photo.id)}
                    className="absolute -right-1.5 -top-1.5 rounded-full bg-danger p-1 text-brand-ink shadow cursor-pointer"
                    aria-label="Quitar foto nueva"
                  >
                    <X className="h-3 w-3" aria-hidden="true" />
                  </button>
                </div>
              ))}

              <label className="flex h-20 w-24 cursor-pointer flex-col items-center justify-center gap-1 rounded-xl border border-dashed border-line bg-surface px-2 text-center text-xs font-medium text-muted hover:border-brand hover:text-ink">
                <ImagePlus className="h-5 w-5" aria-hidden="true" />
                <span>Subir fotos</span>
                <input
                  type="file"
                  accept="image/*"
                  multiple
                  onChange={handleSelectPhotos}
                  className="sr-only"
                />
              </label>
            </div>
          </div>

          {/* Core info */}
          <div className="grid gap-3 sm:grid-cols-3">
            <div className="space-y-1 sm:col-span-2">
              <label htmlFor="prod-name" className="block text-xs font-semibold">
                Nombre del accesorio *
              </label>
              <input
                id="prod-name"
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Ej. Anillo Regulable Acero Blanco"
                className="w-full rounded-xl border border-line bg-surface px-3 py-2 text-sm outline-none focus:border-brand"
              />
            </div>

            <div className="space-y-1">
              <label htmlFor="prod-sku" className="block text-xs font-semibold">
                Código / SKU (opcional)
              </label>
              <input
                id="prod-sku"
                type="text"
                value={sku}
                onChange={(e) => setSku(e.target.value)}
                placeholder="AN-001"
                className="w-full rounded-xl border border-line bg-surface px-3 py-2 text-sm outline-none focus:border-brand"
              />
            </div>
          </div>

          {/* Category */}
          <div className="space-y-2">
            <div className="flex items-center justify-between gap-2">
              <label htmlFor="prod-category" className="block text-xs font-semibold">
                Categoría
              </label>
              <button
                type="button"
                onClick={() => setShowNewCategory((prev) => !prev)}
                className="inline-flex items-center gap-1 text-xs font-semibold text-ink underline cursor-pointer"
              >
                <Plus className="h-3 w-3" aria-hidden="true" />
                {showNewCategory ? 'Cancelar nueva' : 'Crear categoría'}
              </button>
            </div>

            {showNewCategory ? (
              <div className="flex gap-2">
                <input
                  type="text"
                  value={newCategoryName}
                  onChange={(e) => setNewCategoryName(e.target.value)}
                  placeholder="Nombre (ej. Tobilleras)"
                  className="flex-1 rounded-xl border border-line bg-surface px-3 py-2 text-xs outline-none focus:border-brand"
                />
                <button
                  type="button"
                  disabled={isCreatingCategory}
                  onClick={() => void handleCreateCategory()}
                  className="rounded-xl bg-brand px-3 py-2 text-xs font-semibold text-brand-ink cursor-pointer"
                >
                  {isCreatingCategory ? 'Creando...' : 'Agregar'}
                </button>
              </div>
            ) : (
              <select
                id="prod-category"
                value={categoryId}
                onChange={(e) => setCategoryId(e.target.value)}
                className="w-full rounded-xl border border-line bg-surface px-3 py-2 text-sm outline-none focus:border-brand"
              >
                <option value="">Sin categoría</option>
                {categories.map((cat) => (
                  <option key={cat.id} value={cat.id}>
                    {cat.name}
                  </option>
                ))}
              </select>
            )}
          </div>

          {/* Pricing & stock */}
          <div className="grid gap-3 grid-cols-2 sm:grid-cols-4">
            <div className="space-y-1">
              <label htmlFor="prod-cost" className="block text-xs font-semibold">
                Costo ($)
              </label>
              <input
                id="prod-cost"
                type="number"
                min="0"
                step="0.01"
                value={costInput}
                onChange={(e) => setCostInput(e.target.value)}
                placeholder="0"
                className="w-full rounded-xl border border-line bg-surface px-3 py-2 text-sm outline-none focus:border-brand"
              />
            </div>

            <div className="space-y-1">
              <label htmlFor="prod-retail" className="block text-xs font-semibold">
                Precio venta ($) *
              </label>
              <input
                id="prod-retail"
                type="number"
                min="0"
                step="0.01"
                required
                value={retailInput}
                onChange={(e) => setRetailInput(e.target.value)}
                placeholder="0"
                className="w-full rounded-xl border border-line bg-surface px-3 py-2 text-sm outline-none focus:border-brand"
              />
            </div>

            <div className="space-y-1">
              <label htmlFor="prod-stock" className="block text-xs font-semibold">
                Stock actual *
              </label>
              <input
                id="prod-stock"
                type="number"
                min="0"
                step="1"
                required
                value={stockInput}
                onChange={(e) => setStockInput(e.target.value)}
                className="w-full rounded-xl border border-line bg-surface px-3 py-2 text-sm outline-none focus:border-brand"
              />
            </div>

            <div className="space-y-1">
              <label htmlFor="prod-min-stock" className="block text-xs font-semibold">
                Stock mínimo *
              </label>
              <input
                id="prod-min-stock"
                type="number"
                min="0"
                step="1"
                required
                value={minStockInput}
                onChange={(e) => setMinStockInput(e.target.value)}
                className="w-full rounded-xl border border-line bg-surface px-3 py-2 text-sm outline-none focus:border-brand"
              />
            </div>
          </div>

          {liveMargin && parsedRetail > 0 ? (
            <div className="rounded-xl border border-line bg-surface px-3.5 py-2 text-xs text-muted flex flex-wrap items-center justify-between gap-2">
              <span>
                Ganancia unitaria estimada:{' '}
                <strong className="text-ink">{formatMoney(liveMargin.profitCents)}</strong>
              </span>
              <span>
                Margen: <strong className="text-ink">{liveMargin.marginPercent}%</strong> · Recargo:{' '}
                <strong className="text-ink">{liveMargin.markupPercent}%</strong>
              </span>
            </div>
          ) : null}

          {/* Accessory specifications */}
          <div className="space-y-1">
            <label htmlFor="prod-material" className="block text-xs font-semibold">
              Material, medidas y cuidados
            </label>
            <input
              id="prod-material"
              type="text"
              value={materialDetails}
              onChange={(e) => setMaterialDetails(e.target.value)}
              placeholder="Ej. Acero quirúrgico · Largo 45cm · Evitar contacto con perfume"
              className="w-full rounded-xl border border-line bg-surface px-3 py-2 text-sm outline-none focus:border-brand"
            />
          </div>

          <div className="space-y-1">
            <label htmlFor="prod-desc" className="block text-xs font-semibold">
              Descripción para el catálogo
            </label>
            <textarea
              id="prod-desc"
              rows={2}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Contale al cliente por qué destaca esta pieza..."
              className="w-full rounded-xl border border-line bg-surface px-3 py-2 text-sm outline-none focus:border-brand"
            />
          </div>

          {/* Visibility & future wholesale pricing */}
          <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
            <label className="inline-flex items-center gap-2 text-xs font-semibold cursor-pointer">
              <input
                type="checkbox"
                checked={isActive}
                onChange={(e) => setIsActive(e.target.checked)}
                className="rounded border-line"
              />
              Visible en el catálogo público
            </label>

            <button
              type="button"
              onClick={() => setShowWholesale((prev) => !prev)}
              className="text-xs font-semibold text-muted underline hover:text-ink cursor-pointer"
            >
              {showWholesale ? 'Ocultar campos mayoristas' : '+ Precio mayorista (futuro)'}
            </button>
          </div>

          {showWholesale ? (
            <div className="grid gap-3 sm:grid-cols-2 rounded-xl border border-line bg-surface p-3">
              <div className="space-y-1">
                <label htmlFor="prod-wholesale-price" className="block text-xs font-semibold">
                  Precio mayorista ($)
                </label>
                <input
                  id="prod-wholesale-price"
                  type="number"
                  min="0"
                  step="0.01"
                  value={wholesalePriceInput}
                  onChange={(e) => setWholesalePriceInput(e.target.value)}
                  placeholder="Opcional"
                  className="w-full rounded-lg border border-line bg-card px-3 py-1.5 text-xs outline-none focus:border-brand"
                />
              </div>
              <div className="space-y-1">
                <label htmlFor="prod-wholesale-qty" className="block text-xs font-semibold">
                  Cantidad mínima mayorista
                </label>
                <input
                  id="prod-wholesale-qty"
                  type="number"
                  min="1"
                  step="1"
                  value={wholesaleMinQtyInput}
                  onChange={(e) => setWholesaleMinQtyInput(e.target.value)}
                  placeholder="Ej. 5"
                  className="w-full rounded-lg border border-line bg-card px-3 py-1.5 text-xs outline-none focus:border-brand"
                />
              </div>
            </div>
          ) : null}

          <div className="flex items-center justify-end gap-2 border-t border-line pt-4">
            <button
              type="button"
              onClick={onClose}
              className="rounded-xl border border-line bg-surface px-4 py-2 text-xs font-semibold text-ink hover:bg-line/40 cursor-pointer"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="rounded-xl bg-brand px-5 py-2 text-xs font-semibold text-brand-ink hover:opacity-90 disabled:opacity-60 cursor-pointer"
            >
              {isSubmitting ? 'Guardando...' : isEdit ? 'Guardar cambios' : 'Guardar joya'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
