import { Gem, MessageCircle, Search, Sparkles } from 'lucide-react';
import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useApp } from '../../../app/providers/useApp';
import { ModulePlaceholderCard } from '../../../shared/components/ModulePlaceholderCard';
import { buildWhatsAppUrl } from '../lib/sellerContext';

const PREVIEW_CATEGORIES = ['Todas', 'Anillos', 'Aros', 'Cadenas', 'Pulseras'] as const;

/**
 * Public catalog landing view (Block 1 structural shell ready for Block 2/3 product inventory).
 */
export function CatalogHomePage() {
  const { activeSeller, publicMeta } = useApp();
  const [selectedCategory, setSelectedCategory] = useState<string>('Todas');

  const whatsappPreviewUrl = activeSeller?.whatsappNumber
    ? buildWhatsAppUrl(
        activeSeller.whatsappNumber,
        `Hola ${activeSeller.fullName}! Quiero consultar por accesorios de ${publicMeta.settings.businessName}.`,
      )
    : null;

  return (
    <div className="space-y-5">
      {/* Seller attribution banner */}
      <section className="rounded-2xl border border-line bg-card p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div className="space-y-1">
          <div className="inline-flex items-center gap-1.5 rounded-full bg-accent-soft px-2.5 py-0.5 text-xs font-semibold text-accent">
            <Sparkles className="h-3.5 w-3.5" aria-hidden="true" />
            Catálogo Digital
          </div>
          <h1 className="text-lg font-bold tracking-tight sm:text-xl">
            {publicMeta.settings.businessName}
          </h1>
          <p className="text-xs sm:text-sm text-muted">
            {activeSeller ? (
              <>
                Estás navegando con atención directa de{' '}
                <strong className="text-ink">{activeSeller.fullName}</strong> (
                <code>?v={activeSeller.sellerSlug}</code>).
              </>
            ) : (
              'Catálogo disponible para explorar piezas y coordinar tu pedido.'
            )}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {whatsappPreviewUrl ? (
            <a
              href={whatsappPreviewUrl}
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
            Ver envíos
          </Link>
        </div>
      </section>

      {/* Mobile-first search and category filter bar */}
      <section className="space-y-3">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
          <div className="relative w-full md:max-w-sm">
            <Search
              className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted"
              aria-hidden="true"
            />
            <input
              type="search"
              disabled
              placeholder="Buscar anillo, plata 925, baño oro... (Bloque 3)"
              className="w-full rounded-xl border border-line bg-card py-2.5 pl-9 pr-3 text-xs text-muted placeholder:text-muted"
            />
          </div>

          <div className="flex flex-wrap gap-1.5" role="group" aria-label="Categorías">
            {PREVIEW_CATEGORIES.map((category) => (
              <button
                key={category}
                type="button"
                onClick={() => setSelectedCategory(category)}
                className={`rounded-full border px-3 py-1.5 text-xs font-medium transition cursor-pointer ${
                  selectedCategory === category
                    ? 'border-brand bg-brand text-brand-ink'
                    : 'border-line bg-card text-ink hover:bg-line/40'
                }`}
              >
                {category}
              </button>
            ))}
          </div>
        </div>
      </section>

      <ModulePlaceholderCard
        badge="Bloque 1 completado · Próximo: Bloque 2 y 3"
        title="Catálogo listo para recibir las primeras joyas"
        description="La estructura responsive y el enrutamiento personalizado por vendedor (?v=...) ya están activos. En el Bloque 2 cargaremos los accesorios reales desde el Panel Admin y en el Bloque 3 activaremos las fichas y carrito hacia WhatsApp."
        icon={Gem}
        items={[
          'Navegación táctil inferior en celular y barra superior en PC',
          'Atribución persistente de vendedor (?v=gonzalo / ?v=hermana)',
          'Sección de envíos y contacto ya conectada a configuración',
          'Base preparada para futura sección mayorista (Bloque 6)',
        ]}
      />
    </div>
  );
}
