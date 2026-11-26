import {
  Check,
  Copy,
  ExternalLink,
  Gem,
  LayoutDashboard,
  LogOut,
  Package,
  Receipt,
  Settings,
} from 'lucide-react';
import { useState } from 'react';
import { Link, Navigate, NavLink, Outlet, useLocation } from 'react-router-dom';
import { buildShareableCatalogUrl } from '../../features/catalog/lib/sellerContext';
import { useApp } from '../providers/useApp';

const ADMIN_NAV = [
  { to: '/admin', label: 'Dashboard', shortLabel: 'Inicio', icon: LayoutDashboard, end: true },
  { to: '/admin/stock', label: 'Stock y Catálogo', shortLabel: 'Stock', icon: Package, end: false },
  {
    to: '/admin/pedidos',
    label: 'Pedidos y Caja',
    shortLabel: 'Pedidos',
    icon: Receipt,
    end: false,
  },
  {
    to: '/admin/config',
    label: 'Socios y Tienda',
    shortLabel: 'Config',
    icon: Settings,
    end: false,
  },
] as const;

function sidebarLinkClass({ isActive }: { isActive: boolean }): string {
  return `flex items-center justify-between gap-2 rounded-xl px-3 py-2.5 text-sm font-medium transition ${
    isActive ? 'bg-brand text-brand-ink' : 'text-ink hover:bg-surface'
  }`;
}

function mobileTabClass({ isActive }: { isActive: boolean }): string {
  return `relative flex flex-col items-center justify-center gap-1 py-2.5 text-xs font-medium transition ${
    isActive ? 'text-ink font-semibold' : 'text-muted'
  }`;
}

/**
 * Authenticated partner shell: bottom navigation on mobile/tablet, dedicated sidebar on desktop.
 */
export function AdminLayout() {
  const location = useLocation();
  const { isAuthReady, session, mode, signOut, publicMeta, replenishmentAlertCount } = useApp();
  const [copied, setCopied] = useState(false);

  if (!isAuthReady) {
    return (
      <div className="min-h-dvh grid place-items-center bg-surface text-sm text-muted">
        Cargando sesión de socios...
      </div>
    );
  }

  if (!session) {
    return <Navigate to="/login" state={{ from: location.pathname }} replace />;
  }

  const shareUrl = buildShareableCatalogUrl(window.location.origin, session.partner.sellerSlug);

  async function handleCopyLink() {
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      // Clipboard API may be unavailable in restricted non-HTTPS contexts.
    }
  }

  return (
    <div className="min-h-dvh flex bg-surface text-ink">
      {/* Desktop sidebar */}
      <aside className="hidden md:flex md:w-64 md:shrink-0 md:flex-col md:justify-between border-r border-line bg-card p-4">
        <div className="space-y-6">
          <div className="flex items-center gap-2.5 px-1">
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-brand text-brand-ink">
              <Gem className="h-4 w-4" aria-hidden="true" />
            </span>
            <div className="min-w-0">
              <div className="truncate text-sm font-bold">{publicMeta.settings.businessName}</div>
              <div className="truncate text-xs text-muted">Hola, {session.partner.fullName}</div>
            </div>
          </div>

          <nav className="space-y-1" aria-label="Menú de administración">
            {ADMIN_NAV.map((item) => {
              const Icon = item.icon;
              const showBadge = item.to === '/admin/stock' && replenishmentAlertCount > 0;
              return (
                <NavLink key={item.to} to={item.to} end={item.end} className={sidebarLinkClass}>
                  <span className="flex items-center gap-2.5">
                    <Icon className="h-4 w-4" aria-hidden="true" />
                    {item.label}
                  </span>
                  {showBadge ? (
                    <span className="rounded-full bg-danger px-2 py-0.5 text-xs font-bold text-brand-ink">
                      {replenishmentAlertCount}
                    </span>
                  ) : null}
                </NavLink>
              );
            })}
          </nav>
        </div>

        <div className="space-y-3">
          <div className="rounded-xl border border-line bg-surface p-3 space-y-2">
            <div className="flex items-center justify-between gap-2">
              <span className="text-xs font-semibold">Tu link para redes</span>
              <span
                className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                  mode === 'supabase' ? 'bg-ok-soft text-ok' : 'bg-warn-soft text-warn'
                }`}
              >
                {mode === 'supabase' ? 'Nube' : 'Local'}
              </span>
            </div>
            <p className="truncate text-xs text-muted" title={shareUrl}>
              {shareUrl}
            </p>
            <button
              type="button"
              onClick={handleCopyLink}
              className="flex w-full items-center justify-center gap-1.5 rounded-lg border border-line bg-card px-2.5 py-1.5 text-xs font-semibold hover:bg-line/40 cursor-pointer"
            >
              {copied ? (
                <Check className="h-3.5 w-3.5 text-ok" />
              ) : (
                <Copy className="h-3.5 w-3.5" />
              )}
              {copied ? 'Link copiado' : 'Copiar mi link'}
            </button>
          </div>

          <div className="flex flex-col gap-1.5">
            <Link
              to={`/?v=${encodeURIComponent(session.partner.sellerSlug)}`}
              className="flex items-center justify-center gap-1.5 rounded-xl border border-line px-3 py-2 text-xs font-semibold text-ink hover:bg-surface"
            >
              <ExternalLink className="h-3.5 w-3.5" aria-hidden="true" />
              Ver catálogo público
            </Link>
            <button
              type="button"
              onClick={() => void signOut()}
              className="flex items-center justify-center gap-1.5 rounded-xl px-3 py-2 text-xs font-medium text-muted hover:bg-surface hover:text-ink cursor-pointer"
            >
              <LogOut className="h-3.5 w-3.5" aria-hidden="true" />
              Cerrar sesión
            </button>
          </div>
        </div>
      </aside>

      {/* Main area */}
      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-20 flex items-center justify-between gap-2 border-b border-line bg-card/95 px-4 py-3 backdrop-blur md:hidden">
          <div className="min-w-0">
            <div className="truncate text-sm font-bold">{publicMeta.settings.businessName}</div>
            <div className="flex items-center gap-2 text-xs text-muted">
              <span className="truncate">Sesión: {session.partner.fullName}</span>
              <span
                className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                  mode === 'supabase' ? 'bg-ok-soft text-ok' : 'bg-warn-soft text-warn'
                }`}
              >
                {mode === 'supabase' ? 'Nube' : 'Local'}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={handleCopyLink}
              className="inline-flex items-center gap-1 rounded-lg border border-line bg-surface px-2.5 py-1.5 text-xs font-semibold cursor-pointer"
              title="Copiar mi link del catálogo"
            >
              {copied ? (
                <Check className="h-3.5 w-3.5 text-ok" />
              ) : (
                <Copy className="h-3.5 w-3.5" />
              )}
              <span>{copied ? 'Copiado' : 'Link'}</span>
            </button>
            <button
              type="button"
              onClick={() => void signOut()}
              className="inline-flex items-center justify-center rounded-lg border border-line bg-surface p-1.5 text-muted hover:text-ink cursor-pointer"
              aria-label="Cerrar sesión"
            >
              <LogOut className="h-4 w-4" aria-hidden="true" />
            </button>
          </div>
        </header>

        <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-5 pb-24 md:px-8 md:py-7 md:pb-10">
          <Outlet />
        </main>

        <nav
          className="fixed inset-x-0 bottom-0 z-20 grid grid-cols-4 border-t border-line bg-card/95 backdrop-blur md:hidden"
          aria-label="Menú móvil de administración"
        >
          {ADMIN_NAV.map((item) => {
            const Icon = item.icon;
            const showBadge = item.to === '/admin/stock' && replenishmentAlertCount > 0;
            return (
              <NavLink key={item.to} to={item.to} end={item.end} className={mobileTabClass}>
                <Icon className="h-5 w-5" aria-hidden="true" />
                <span>{item.shortLabel}</span>
                {showBadge ? (
                  <span className="absolute top-1 right-4 rounded-full bg-danger px-1.5 py-0.5 text-xs font-bold leading-none text-brand-ink">
                    {replenishmentAlertCount}
                  </span>
                ) : null}
              </NavLink>
            );
          })}
        </nav>
      </div>
    </div>
  );
}
