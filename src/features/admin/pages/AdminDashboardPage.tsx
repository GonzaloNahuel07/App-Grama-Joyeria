import {
  AlertTriangle,
  Check,
  Cloud,
  Copy,
  ExternalLink,
  HardDrive,
  Package,
  Receipt,
  Settings,
} from 'lucide-react';
import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useApp } from '../../../app/providers/useApp';
import { storeService } from '../../../services';
import { formatMoney } from '../../../shared/lib/money';
import type { ActivityLog, Product } from '../../../shared/types/domain';
import { buildShareableCatalogUrl } from '../../catalog/lib/sellerContext';
import { getReplenishmentQueue } from '../../inventory/lib/inventoryUtils';

/**
 * Admin dashboard home displaying inventory KPIs, replenishment alerts, and recent partner activity.
 */
export function AdminDashboardPage() {
  const { session, mode, publicMeta } = useApp();
  const [copied, setCopied] = useState(false);
  const [products, setProducts] = useState<Product[]>([]);
  const [activity, setActivity] = useState<ActivityLog[]>([]);

  useEffect(() => {
    let active = true;
    Promise.all([storeService.getAdminProducts(), storeService.getRecentActivity(6)])
      .then(([loadedProducts, loadedActivity]) => {
        if (!active) return;
        setProducts(loadedProducts);
        setActivity(loadedActivity);
      })
      .catch(() => {
        // Keep safe empty summary if initial load fails.
      });

    return () => {
      active = false;
    };
  }, []);

  if (!session) return null;

  const myShareUrl = buildShareableCatalogUrl(window.location.origin, session.partner.sellerSlug);
  const replenishmentQueue = getReplenishmentQueue(products);
  const activeCount = products.filter((p) => p.isActive).length;
  const totalUnits = products.reduce((sum, p) => sum + p.stockQty, 0);
  const investedCostCents = products.reduce((sum, p) => sum + p.costCents * p.stockQty, 0);

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

      {/* Low-stock replenishment alert */}
      {replenishmentQueue.length > 0 ? (
        <section className="rounded-2xl border border-warn/30 bg-warn-soft/50 p-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div className="flex items-start gap-2.5">
            <AlertTriangle className="h-5 w-5 shrink-0 text-warn mt-0.5" aria-hidden="true" />
            <div className="space-y-0.5">
              <h2 className="text-sm font-bold text-ink">
                {replenishmentQueue.length}{' '}
                {replenishmentQueue.length === 1
                  ? 'accesorio necesita reposición'
                  : 'accesorios necesitan reposición'}
              </h2>
              <p className="text-xs text-muted">
                {replenishmentQueue
                  .slice(0, 3)
                  .map((p) => `${p.name} (${p.stockQty} u.)`)
                  .join(' · ')}
              </p>
            </div>
          </div>

          <Link
            to="/admin/stock?tab=restock"
            className="inline-flex items-center justify-center self-start sm:self-center rounded-xl bg-brand px-3.5 py-2 text-xs font-semibold text-brand-ink hover:opacity-90"
          >
            Ver bandeja de reposición →
          </Link>
        </section>
      ) : null}

      {/* Inventory KPIs */}
      <section className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <div className="rounded-2xl border border-line bg-card p-4">
          <div className="text-xs text-muted">Joyas activas</div>
          <div className="text-lg font-bold mt-1">{activeCount}</div>
          <div className="text-xs text-muted mt-0.5">{products.length} cargadas en total</div>
        </div>
        <div className="rounded-2xl border border-line bg-card p-4">
          <div className="text-xs text-muted">Unidades en stock</div>
          <div className="text-lg font-bold mt-1">{totalUnits}</div>
          <div className="text-xs text-muted mt-0.5">Disponibles para vender</div>
        </div>
        <div className="rounded-2xl border border-line bg-card p-4">
          <div className="text-xs text-muted">Capital en mercadería</div>
          <div className="text-lg font-bold mt-1">{formatMoney(investedCostCents)}</div>
          <div className="text-xs text-muted mt-0.5">Valuado al costo actual</div>
        </div>
        <div className="rounded-2xl border border-line bg-card p-4">
          <div className="text-xs text-muted">Alertas de mínimo</div>
          <div
            className={`text-lg font-bold mt-1 ${
              replenishmentQueue.length > 0 ? 'text-danger' : 'text-ok'
            }`}
          >
            {replenishmentQueue.length}
          </div>
          <div className="text-xs text-muted mt-0.5">
            {replenishmentQueue.length > 0 ? 'Requieren reposición' : 'Stock cubierto'}
          </div>
        </div>
      </section>

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

      {/* Partner activity feed + module shortcuts */}
      <div className="grid gap-4 lg:grid-cols-5">
        <section className="lg:col-span-3 rounded-2xl border border-line bg-card p-5 space-y-3">
          <div className="flex items-center justify-between gap-2">
            <h2 className="text-sm font-bold">Actividad reciente entre socios</h2>
            <Link to="/admin/stock" className="text-xs font-semibold underline text-muted">
              Ir a stock
            </Link>
          </div>

          {activity.length === 0 ? (
            <p className="text-xs text-muted">Todavía no hay movimientos registrados.</p>
          ) : (
            <ul className="divide-y divide-line text-xs">
              {activity.map((entry) => (
                <li key={entry.id} className="py-2.5 flex items-start justify-between gap-3">
                  <div>
                    <strong className="text-ink">{entry.actorName}</strong>{' '}
                    <span className="text-muted">· {entry.summary}</span>
                  </div>
                  <span className="shrink-0 text-muted">
                    {new Date(entry.createdAt).toLocaleDateString('es-AR', {
                      day: '2-digit',
                      month: '2-digit',
                    })}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </section>

        <section className="lg:col-span-2 grid gap-3">
          <Link
            to="/admin/stock"
            className="rounded-2xl border border-line bg-card p-4 space-y-1.5 transition hover:border-brand"
          >
            <div className="flex items-center justify-between">
              <span className="rounded-full bg-ok-soft px-2.5 py-0.5 text-xs font-semibold text-ok">
                Activo · Bloque 2
              </span>
              <Package className="h-4 w-4 text-muted" aria-hidden="true" />
            </div>
            <h3 className="text-sm font-bold">Inventario y Reposición</h3>
            <p className="text-xs text-muted">Cargá joyas, subí fotos y controlá faltantes.</p>
          </Link>

          <Link
            to="/admin/config"
            className="rounded-2xl border border-line bg-card p-4 space-y-1.5 transition hover:border-brand"
          >
            <div className="flex items-center justify-between">
              <span className="rounded-full bg-ok-soft px-2.5 py-0.5 text-xs font-semibold text-ok">
                Activo · Bloque 1
              </span>
              <Settings className="h-4 w-4 text-muted" aria-hidden="true" />
            </div>
            <h3 className="text-sm font-bold">Socios, WhatsApp y Envíos</h3>
            <p className="text-xs text-muted">Editá los links y datos de entrega.</p>
          </Link>

          <Link
            to="/admin/pedidos"
            className="rounded-2xl border border-line bg-card p-4 space-y-1.5 transition hover:border-brand"
          >
            <div className="flex items-center justify-between">
              <span className="rounded-full bg-accent-soft px-2.5 py-0.5 text-xs font-semibold text-accent">
                Próximo · Bloque 4 y 5
              </span>
              <Receipt className="h-4 w-4 text-muted" aria-hidden="true" />
            </div>
            <h3 className="text-sm font-bold">Pedidos, Gastos y Gráficos</h3>
            <p className="text-xs text-muted">Confirmar ventas, registrar gastos y balances.</p>
          </Link>
        </section>
      </div>
    </div>
  );
}
