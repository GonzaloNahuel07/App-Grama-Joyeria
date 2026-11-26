import {
  Check,
  Cloud,
  Copy,
  ExternalLink,
  HardDrive,
  Package,
  Receipt,
  Settings,
} from 'lucide-react';
import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useApp } from '../../../app/providers/useApp';
import { buildShareableCatalogUrl } from '../../catalog/lib/sellerContext';

/**
 * Admin dashboard home (Block 1 overview with partner link sharing and roadmap checkpoints).
 */
export function AdminDashboardPage() {
  const { session, mode, publicMeta } = useApp();
  const [copied, setCopied] = useState(false);

  if (!session) return null;

  const myShareUrl = buildShareableCatalogUrl(window.location.origin, session.partner.sellerSlug);

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(myShareUrl);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      // Clipboard may be blocked outside secure contexts.
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold tracking-tight">
            Panel de {publicMeta.settings.businessName}
          </h1>
          <p className="text-sm text-muted">
            Sesión iniciada como <strong className="text-ink">{session.partner.fullName}</strong>.
          </p>
        </div>

        <div
          className={`inline-flex items-center gap-2 self-start rounded-xl border px-3 py-1.5 text-xs font-semibold ${
            mode === 'supabase'
              ? 'border-ok/30 bg-ok-soft text-ok'
              : 'border-warn/30 bg-warn-soft text-warn'
          }`}
        >
          {mode === 'supabase' ? (
            <Cloud className="h-4 w-4" aria-hidden="true" />
          ) : (
            <HardDrive className="h-4 w-4" aria-hidden="true" />
          )}
          {mode === 'supabase' ? 'Base de datos Supabase conectada' : 'Modo Local (sin Supabase)'}
        </div>
      </div>

      {/* Shareable personal catalog link */}
      <section className="rounded-2xl border border-line bg-card p-5 space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div>
            <h2 className="text-sm font-bold">Tu link personalizado para redes sociales</h2>
            <p className="text-xs text-muted">
              Cuando compartas este enlace, los pedidos que armen tus clientes irán directo a tu
              WhatsApp ({session.partner.whatsappNumber || 'pendiente de cargar en Configuración'}).
            </p>
          </div>
          <Link
            to="/admin/config"
            className="text-xs font-semibold underline text-ink hover:opacity-80"
          >
            Editar WhatsApp y socios
          </Link>
        </div>

        <div className="flex flex-col sm:flex-row gap-2">
          <input
            type="text"
            readOnly
            value={myShareUrl}
            aria-label="Tu link de catálogo compartible"
            className="flex-1 rounded-xl border border-line bg-surface px-3 py-2 text-xs font-mono text-ink"
          />
          <button
            type="button"
            onClick={() => void handleCopy()}
            className="inline-flex items-center justify-center gap-1.5 rounded-xl bg-brand px-4 py-2 text-xs font-semibold text-brand-ink hover:opacity-90 cursor-pointer"
          >
            {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
            {copied ? 'Copiado' : 'Copiar link'}
          </button>
          <Link
            to={`/?v=${encodeURIComponent(session.partner.sellerSlug)}`}
            className="inline-flex items-center justify-center gap-1.5 rounded-xl border border-line bg-surface px-4 py-2 text-xs font-semibold text-ink hover:bg-line/40"
          >
            <ExternalLink className="h-4 w-4" aria-hidden="true" />
            Probar link
          </Link>
        </div>
      </section>

      {/* Block 1 status and upcoming blocks */}
      <section className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        <Link
          to="/admin/config"
          className="rounded-2xl border border-line bg-card p-4 space-y-2 transition hover:border-brand"
        >
          <div className="flex items-center justify-between">
            <span className="rounded-full bg-ok-soft px-2.5 py-0.5 text-xs font-semibold text-ok">
              Activo · Bloque 1
            </span>
            <Settings className="h-4 w-4 text-muted" aria-hidden="true" />
          </div>
          <h3 className="text-sm font-bold">Socios, WhatsApp y Envíos</h3>
          <p className="text-xs text-muted">
            Configurá los números personales de ambos, datos del negocio y modalidades de entrega.
          </p>
        </Link>

        <Link
          to="/admin/stock"
          className="rounded-2xl border border-line bg-card p-4 space-y-2 transition hover:border-brand"
        >
          <div className="flex items-center justify-between">
            <span className="rounded-full bg-accent-soft px-2.5 py-0.5 text-xs font-semibold text-accent">
              Próximo · Bloque 2
            </span>
            <Package className="h-4 w-4 text-muted" aria-hidden="true" />
          </div>
          <h3 className="text-sm font-bold">Inventario y Reposición</h3>
          <p className="text-xs text-muted">
            Alta de joyas con fotos, costos, precios y alertas automáticas por stock mínimo.
          </p>
        </Link>

        <Link
          to="/admin/pedidos"
          className="rounded-2xl border border-line bg-card p-4 space-y-2 transition hover:border-brand"
        >
          <div className="flex items-center justify-between">
            <span className="rounded-full bg-accent-soft px-2.5 py-0.5 text-xs font-semibold text-accent">
              Bloques 4 y 5
            </span>
            <Receipt className="h-4 w-4 text-muted" aria-hidden="true" />
          </div>
          <h3 className="text-sm font-bold">Ventas, Gastos y Gráficos</h3>
          <p className="text-xs text-muted">
            Confirmación de pedidos, registro de reinversiones, historial entre socios y dashboards.
          </p>
        </Link>
      </section>
    </div>
  );
}
