import {
  ArrowLeft,
  Check,
  CheckCircle2,
  Copy,
  Gem,
  MessageCircle,
  Minus,
  Plus,
  ShoppingBag,
  Trash2,
} from 'lucide-react';
import { useState, type FormEvent } from 'react';
import { Link } from 'react-router-dom';
import { useApp } from '../../../app/providers/useApp';
import { useCart } from '../../../app/providers/useCart';
import { storeService } from '../../../services';
import { formatMoney } from '../../../shared/lib/money';
import type { CreatedCatalogOrder } from '../../../shared/types/domain';
import { formatWhatsAppOrderMessage } from '../lib/cartUtils';
import { catalogOrderSchema } from '../lib/orderSchema';
import { buildWhatsAppUrl } from '../lib/sellerContext';

const PAYMENT_METHODS = [
  'Transferencia',
  'Efectivo',
  'Mercado Pago / Tarjeta',
  'A coordinar',
] as const;

interface SubmittedSummary {
  order: CreatedCatalogOrder;
  whatsappUrl: string;
  messageText: string;
}

/**
 * Customer checkout page: captures quick delivery/payment details, saves pending order, and opens seller WhatsApp.
 */
export function CheckoutPage() {
  const { publicMeta, activeSeller } = useApp();
  const { items, totalCents, setItemQty, removeItem, clearCart } = useCart();

  const defaultDelivery = publicMeta.settings.shippingMethods[0]?.title ?? 'A coordinar';
  const [selectedSellerSlug, setSelectedSellerSlug] = useState<string>(
    activeSeller?.sellerSlug ?? publicMeta.settings.defaultSellerSlug,
  );
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [deliveryMethod, setDeliveryMethod] = useState(defaultDelivery);
  const [deliveryAddress, setDeliveryAddress] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<string>(PAYMENT_METHODS[0]);
  const [notes, setNotes] = useState('');

  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState<SubmittedSummary | null>(null);
  const [copiedMessage, setCopiedMessage] = useState(false);

  const effectiveSeller =
    publicMeta.sellers.find((s) => s.sellerSlug === selectedSellerSlug) ?? activeSeller;

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setErrorMessage(null);

    if (items.length === 0) {
      setErrorMessage('Agregá al menos un accesorio desde el catálogo antes de enviar.');
      return;
    }

    const parsed = catalogOrderSchema.safeParse({
      customerName,
      customerPhone,
      deliveryMethod: deliveryMethod || defaultDelivery,
      deliveryAddress,
      paymentMethod,
      notes,
    });

    if (!parsed.success) {
      setErrorMessage(parsed.error.issues[0]?.message ?? 'Revisá los datos del pedido.');
      return;
    }

    const v = parsed.data;
    setIsSubmitting(true);
    try {
      const snapshotItems = [...items];
      const created = await storeService.submitCatalogOrder({
        sellerSlug: effectiveSeller?.sellerSlug ?? publicMeta.settings.defaultSellerSlug,
        customerName: v.customerName,
        customerPhone: v.customerPhone,
        deliveryMethod: v.deliveryMethod,
        deliveryAddress: v.deliveryAddress,
        paymentMethod: v.paymentMethod,
        notes: v.notes,
        items: snapshotItems.map((item) => ({ productId: item.productId, qty: item.qty })),
      });

      const messageText = formatWhatsAppOrderMessage({
        businessName: publicMeta.settings.businessName,
        sellerName: created.sellerName,
        orderCode: created.orderCode,
        items: snapshotItems,
        totalCents: created.totalCents,
        customerName: v.customerName,
        customerPhone: v.customerPhone,
        deliveryMethod: v.deliveryMethod,
        deliveryAddress: v.deliveryAddress,
        paymentMethod: v.paymentMethod,
        notes: v.notes,
      });

      const whatsappUrl = buildWhatsAppUrl(created.whatsappNumber, messageText);
      clearCart();
      setSubmitted({ order: created, whatsappUrl, messageText });

      if (created.whatsappNumber) {
        window.open(whatsappUrl, '_blank', 'noopener,noreferrer');
      }
    } catch (error) {
      setErrorMessage(
        error instanceof Error ? error.message : 'No pudimos registrar el pedido en este momento.',
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleCopySummary() {
    if (!submitted) return;
    try {
      await navigator.clipboard.writeText(submitted.messageText);
      setCopiedMessage(true);
      window.setTimeout(() => setCopiedMessage(false), 2000);
    } catch {
      // Ignore clipboard unavailability.
    }
  }

  if (submitted) {
    return (
      <div className="mx-auto max-w-xl space-y-5">
        <section className="rounded-2xl border border-line bg-card p-6 space-y-4">
          <div className="flex items-center gap-2.5 text-ok">
            <CheckCircle2 className="h-6 w-6 shrink-0" aria-hidden="true" />
            <div>
              <h1 className="text-lg font-bold text-ink">¡Pedido registrado!</h1>
              <p className="text-xs text-muted">
                Código: <strong className="text-ink">{submitted.order.orderCode}</strong> · Estado:
                Pendiente de confirmación
              </p>
            </div>
          </div>

          <p className="text-xs leading-relaxed text-muted">
            Enviá el detalle por WhatsApp a{' '}
            <strong className="text-ink">{submitted.order.sellerName}</strong> para coordinar el
            pago y la entrega.
          </p>

          <pre className="rounded-xl border border-line bg-surface p-3 text-xs whitespace-pre-wrap leading-relaxed text-ink">
            {submitted.messageText}
          </pre>

          <div className="flex flex-col sm:flex-row gap-2">
            {submitted.order.whatsappNumber ? (
              <a
                href={submitted.whatsappUrl}
                target="_blank"
                rel="noreferrer"
                className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-brand px-4 py-3 text-xs font-semibold text-brand-ink hover:opacity-90"
              >
                <MessageCircle className="h-4 w-4" aria-hidden="true" />
                Abrir WhatsApp de {submitted.order.sellerName}
              </a>
            ) : null}

            <button
              type="button"
              onClick={() => void handleCopySummary()}
              className="inline-flex items-center justify-center gap-1.5 rounded-xl border border-line bg-surface px-4 py-3 text-xs font-semibold text-ink hover:bg-line/40 cursor-pointer"
            >
              {copiedMessage ? <Check className="h-4 w-4 text-ok" /> : <Copy className="h-4 w-4" />}
              {copiedMessage ? 'Copiado' : 'Copiar mensaje'}
            </button>
          </div>

          <Link
            to="/"
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-muted hover:text-ink pt-2"
          >
            <ArrowLeft className="h-3.5 w-3.5" aria-hidden="true" />
            Volver al catálogo
          </Link>
        </section>
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="mx-auto max-w-lg rounded-2xl border border-line bg-card p-6 text-center space-y-3">
        <span className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-surface border border-line text-muted">
          <ShoppingBag className="h-6 w-6" aria-hidden="true" />
        </span>
        <h1 className="text-base font-bold">Tu pedido todavía está vacío</h1>
        <p className="text-xs text-muted">
          Explorá el catálogo y tocá «Sumar» en los accesorios que quieras pedir.
        </p>
        <Link
          to="/"
          className="inline-flex items-center justify-center rounded-xl bg-brand px-4 py-2.5 text-xs font-semibold text-brand-ink hover:opacity-90"
        >
          Ir al catálogo
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <h1 className="text-xl font-bold tracking-tight">Tu pedido</h1>
          <p className="text-xs text-muted">
            Completá tus datos para que podamos confirmar stock y entrega rápido por WhatsApp.
          </p>
        </div>
        <Link to="/" className="inline-flex items-center gap-1 text-xs font-semibold underline">
          <ArrowLeft className="h-3.5 w-3.5" aria-hidden="true" />
          Seguir viendo accesorios
        </Link>
      </div>

      {errorMessage ? (
        <div
          role="alert"
          className="rounded-xl border border-danger/30 bg-danger-soft px-4 py-3 text-xs font-medium text-danger"
        >
          {errorMessage}
        </div>
      ) : null}

      <div className="grid gap-5 lg:grid-cols-5 items-start">
        {/* Cart items */}
        <section className="lg:col-span-2 rounded-2xl border border-line bg-card divide-y divide-line">
          <div className="p-4 text-xs font-bold">Accesorios seleccionados</div>
          {items.map((item) => (
            <div key={item.productId} className="p-3.5 flex items-center gap-3">
              {item.imageUrl ? (
                <img
                  src={item.imageUrl}
                  alt={item.name}
                  className="h-12 w-12 shrink-0 rounded-xl border border-line object-cover"
                />
              ) : (
                <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl border border-line bg-surface text-muted">
                  <Gem className="h-5 w-5" aria-hidden="true" />
                </span>
              )}

              <div className="min-w-0 flex-1 space-y-1">
                <div className="truncate text-xs font-bold text-ink">{item.name}</div>
                <div className="text-xs text-muted">
                  {formatMoney(item.retailPriceCents)} c/u · Subtotal{' '}
                  <strong className="text-ink">
                    {formatMoney(item.retailPriceCents * item.qty)}
                  </strong>
                </div>
              </div>

              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={() => setItemQty(item.productId, item.qty - 1)}
                  className="rounded-lg border border-line bg-surface p-1 text-ink cursor-pointer"
                  aria-label="Restar unidad"
                >
                  <Minus className="h-3.5 w-3.5" aria-hidden="true" />
                </button>
                <span className="min-w-[1.5rem] text-center text-xs font-bold">{item.qty}</span>
                <button
                  type="button"
                  disabled={item.qty >= item.maxStockQty}
                  onClick={() => setItemQty(item.productId, item.qty + 1)}
                  className="rounded-lg border border-line bg-surface p-1 text-ink disabled:opacity-40 cursor-pointer"
                  aria-label="Sumar unidad"
                >
                  <Plus className="h-3.5 w-3.5" aria-hidden="true" />
                </button>
                <button
                  type="button"
                  onClick={() => removeItem(item.productId)}
                  className="rounded-lg p-1 text-muted hover:text-danger cursor-pointer"
                  aria-label="Quitar del pedido"
                >
                  <Trash2 className="h-3.5 w-3.5" aria-hidden="true" />
                </button>
              </div>
            </div>
          ))}

          <div className="p-4 flex items-center justify-between text-sm font-bold">
            <span>Total estimado</span>
            <span>{formatMoney(totalCents)}</span>
          </div>
        </section>

        {/* Customer info & seller WhatsApp form */}
        <form
          onSubmit={handleSubmit}
          className="lg:col-span-3 rounded-2xl border border-line bg-card p-5 space-y-4"
        >
          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-line pb-3">
            <div>
              <h2 className="text-sm font-bold">Tus datos para coordinar rápido</h2>
              <p className="text-xs text-muted">
                Se envía directo al WhatsApp de{' '}
                <strong className="text-ink">{effectiveSeller?.fullName ?? 'tu vendedor'}</strong>.
              </p>
            </div>

            {publicMeta.sellers.length > 1 ? (
              <select
                aria-label="Vendedor que atiende"
                value={effectiveSeller?.sellerSlug ?? ''}
                onChange={(e) => setSelectedSellerSlug(e.target.value)}
                className="rounded-lg border border-line bg-surface px-2.5 py-1.5 text-xs font-medium outline-none focus:border-brand"
              >
                {publicMeta.sellers.map((seller) => (
                  <option key={seller.id} value={seller.sellerSlug}>
                    Atiende: {seller.fullName}
                  </option>
                ))}
              </select>
            ) : null}
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <div className="space-y-1">
              <label htmlFor="cust-name" className="block text-xs font-semibold">
                Tu nombre *
              </label>
              <input
                id="cust-name"
                type="text"
                required
                value={customerName}
                onChange={(e) => setCustomerName(e.target.value)}
                placeholder="Ej. Lucía Gómez"
                className="w-full rounded-xl border border-line bg-surface px-3 py-2 text-sm outline-none focus:border-brand"
              />
            </div>

            <div className="space-y-1">
              <label htmlFor="cust-phone" className="block text-xs font-semibold">
                Tu teléfono / WhatsApp *
              </label>
              <input
                id="cust-phone"
                type="tel"
                required
                value={customerPhone}
                onChange={(e) => setCustomerPhone(e.target.value)}
                placeholder="Ej. 11 5555-4444"
                className="w-full rounded-xl border border-line bg-surface px-3 py-2 text-sm outline-none focus:border-brand"
              />
            </div>

            <div className="space-y-1">
              <label htmlFor="cust-delivery" className="block text-xs font-semibold">
                Modalidad de entrega *
              </label>
              <select
                id="cust-delivery"
                value={deliveryMethod}
                onChange={(e) => setDeliveryMethod(e.target.value)}
                className="w-full rounded-xl border border-line bg-surface px-3 py-2 text-sm outline-none focus:border-brand"
              >
                {publicMeta.settings.shippingMethods.map((method) => (
                  <option key={method.id} value={method.title}>
                    {method.title}
                  </option>
                ))}
                <option value="A coordinar">A coordinar</option>
              </select>
            </div>

            <div className="space-y-1">
              <label htmlFor="cust-payment" className="block text-xs font-semibold">
                Forma de pago estimada *
              </label>
              <select
                id="cust-payment"
                value={paymentMethod}
                onChange={(e) => setPaymentMethod(e.target.value)}
                className="w-full rounded-xl border border-line bg-surface px-3 py-2 text-sm outline-none focus:border-brand"
              >
                {PAYMENT_METHODS.map((pm) => (
                  <option key={pm} value={pm}>
                    {pm}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="space-y-1">
            <label htmlFor="cust-address" className="block text-xs font-semibold">
              Zona, dirección o sucursal (si es envío)
            </label>
            <input
              id="cust-address"
              type="text"
              value={deliveryAddress}
              onChange={(e) => setDeliveryAddress(e.target.value)}
              placeholder="Ej. Palermo / Av. Santa Fe 2400 o localidad"
              className="w-full rounded-xl border border-line bg-surface px-3 py-2 text-sm outline-none focus:border-brand"
            />
          </div>

          <div className="space-y-1">
            <label htmlFor="cust-notes" className="block text-xs font-semibold">
              Notas o aclaraciones (opcional)
            </label>
            <textarea
              id="cust-notes"
              rows={2}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Ej. Es para regalo, horario preferido, consulta de talle..."
              className="w-full rounded-xl border border-line bg-surface px-3 py-2 text-sm outline-none focus:border-brand"
            />
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className="flex w-full items-center justify-center gap-2 rounded-xl bg-brand px-4 py-3 text-sm font-semibold text-brand-ink transition hover:opacity-90 disabled:opacity-60 cursor-pointer"
          >
            <MessageCircle className="h-4 w-4" aria-hidden="true" />
            {isSubmitting
              ? 'Registrando pedido...'
              : `Enviar pedido a ${effectiveSeller?.fullName ?? 'WhatsApp'}`}
          </button>
        </form>
      </div>
    </div>
  );
}
