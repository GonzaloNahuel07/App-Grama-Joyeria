import { AtSign, Mail, MessageCircle, Truck } from 'lucide-react';
import { useApp } from '../../../app/providers/useApp';
import { buildWhatsAppUrl } from '../lib/sellerContext';

/**
 * Public shipping methods and direct contact page powered by StoreSettings and active seller.
 */
export function ShippingContactPage() {
  const { publicMeta, activeSeller } = useApp();
  const { settings } = publicMeta;

  return (
    <div className="space-y-6">
      <div className="space-y-1">
        <h1 className="text-xl font-bold tracking-tight">Envíos, entregas y contacto</h1>
        <p className="text-sm text-muted">
          Modalidades de entrega y canales de atención directa para tus pedidos.
        </p>
      </div>

      <section className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {settings.shippingMethods.map((method) => (
          <article key={method.id} className="rounded-2xl border border-line bg-card p-4 space-y-2">
            <div className="flex items-center gap-2">
              <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-surface border border-line text-ink">
                <Truck className="h-4 w-4" aria-hidden="true" />
              </span>
              <h2 className="text-sm font-bold">{method.title}</h2>
            </div>
            <p className="text-xs leading-relaxed text-muted">{method.description}</p>
          </article>
        ))}
      </section>

      <section className="rounded-2xl border border-line bg-card p-5 space-y-3">
        <h2 className="text-sm font-bold">Canales de contacto</h2>
        <div className="grid gap-3 sm:grid-cols-3 text-xs">
          <div className="rounded-xl border border-line bg-surface p-3 space-y-1">
            <div className="flex items-center gap-1.5 font-semibold text-ink">
              <MessageCircle className="h-4 w-4" aria-hidden="true" />
              WhatsApp asignado
            </div>
            {activeSeller ? (
              <div className="space-y-1">
                <p className="text-muted">
                  Atiende <strong className="text-ink">{activeSeller.fullName}</strong> (
                  {activeSeller.whatsappNumber || 'Sin número cargado'})
                </p>
                {activeSeller.whatsappNumber ? (
                  <a
                    href={buildWhatsAppUrl(
                      activeSeller.whatsappNumber,
                      `Hola ${activeSeller.fullName}! Tengo una consulta sobre ${settings.businessName}.`,
                    )}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-block font-semibold underline"
                  >
                    Escribir por WhatsApp →
                  </a>
                ) : null}
              </div>
            ) : (
              <p className="text-muted">Sin vendedor configurado todavía.</p>
            )}
          </div>

          <div className="rounded-xl border border-line bg-surface p-3 space-y-1">
            <div className="flex items-center gap-1.5 font-semibold text-ink">
              <AtSign className="h-4 w-4" aria-hidden="true" />
              Redes sociales
            </div>
            <p className="text-muted">{settings.instagramHandle || 'Pendiente de configurar'}</p>
          </div>

          <div className="rounded-xl border border-line bg-surface p-3 space-y-1">
            <div className="flex items-center gap-1.5 font-semibold text-ink">
              <Mail className="h-4 w-4" aria-hidden="true" />
              Correo electrónico
            </div>
            <p className="text-muted">{settings.contactEmail || 'Pendiente de configurar'}</p>
          </div>
        </div>
      </section>
    </div>
  );
}
