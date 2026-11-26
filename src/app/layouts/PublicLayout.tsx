import { Gem, Lock, ShoppingBag, Truck } from 'lucide-react';
import { Link, NavLink, Outlet } from 'react-router-dom';
import { useApp } from '../providers/useApp';
import { useCart } from '../providers/useCart';

const NAV_ITEMS = [
  { to: '/', label: 'Catálogo', icon: Gem },
  { to: '/envios', label: 'Envíos', icon: Truck },
  { to: '/pedido', label: 'Pedido', icon: ShoppingBag },
] as const;

function desktopNavClass({ isActive }: { isActive: boolean }): string {
  return `inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm font-medium transition ${
    isActive ? 'bg-brand text-brand-ink' : 'text-muted hover:bg-line/60 hover:text-ink'
  }`;
}

function mobileNavClass({ isActive }: { isActive: boolean }): string {
  return `relative flex flex-col items-center justify-center gap-1 py-2.5 text-xs font-medium transition ${
    isActive ? 'text-ink font-semibold' : 'text-muted'
  }`;
}

/**
 * Mobile-first public storefront layout with live cart counter badge on desktop and mobile nav.
 */
export function PublicLayout() {
  const { publicMeta, activeSeller } = useApp();
  const { itemCount } = useCart();

  return (
    <div className="min-h-dvh flex flex-col bg-surface text-ink">
      <header className="sticky top-0 z-20 border-b border-line bg-card/95 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-3 px-4 py-3">
          <Link to="/" className="flex items-center gap-2.5 min-w-0">
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-brand text-brand-ink">
              <Gem className="h-4 w-4" aria-hidden="true" />
            </span>
            <div className="min-w-0">
              <div className="truncate text-sm font-bold tracking-tight">
                {publicMeta.settings.businessName}
              </div>
              {activeSeller ? (
                <div className="truncate text-xs text-muted">
                  Atención: <span className="font-medium">{activeSeller.fullName}</span>
                </div>
              ) : null}
            </div>
          </Link>

          <nav className="hidden md:flex items-center gap-1" aria-label="Navegación principal">
            {NAV_ITEMS.map((item) => {
              const Icon = item.icon;
              const isCartTab = item.to === '/pedido';
              return (
                <NavLink
                  key={item.to}
                  to={item.to}
                  end={item.to === '/'}
                  className={desktopNavClass}
                >
                  <Icon className="h-4 w-4" aria-hidden="true" />
                  <span>{item.label}</span>
                  {isCartTab && itemCount > 0 ? (
                    <span className="rounded-full bg-accent px-1.5 py-0.5 text-xs font-bold leading-none text-brand-ink">
                      {itemCount}
                    </span>
                  ) : null}
                </NavLink>
              );
            })}
          </nav>

          <Link
            to="/admin"
            className="inline-flex items-center gap-1.5 rounded-lg border border-line bg-surface px-3 py-1.5 text-xs font-semibold text-ink transition hover:bg-line/50"
          >
            <Lock className="h-3.5 w-3.5" aria-hidden="true" />
            Admin
          </Link>
        </div>
      </header>

      <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-5 pb-24 md:py-7 md:pb-10">
        <Outlet />
      </main>

      <nav
        className="fixed inset-x-0 bottom-0 z-20 grid grid-cols-3 border-t border-line bg-card/95 backdrop-blur md:hidden"
        aria-label="Navegación móvil"
      >
        {NAV_ITEMS.map((item) => {
          const Icon = item.icon;
          const isCartTab = item.to === '/pedido';
          return (
            <NavLink key={item.to} to={item.to} end={item.to === '/'} className={mobileNavClass}>
              <Icon className="h-5 w-5" aria-hidden="true" />
              <span>{item.label}</span>
              {isCartTab && itemCount > 0 ? (
                <span className="absolute top-1 right-6 rounded-full bg-brand px-1.5 py-0.5 text-xs font-bold leading-none text-brand-ink">
                  {itemCount}
                </span>
              ) : null}
            </NavLink>
          );
        })}
      </nav>
    </div>
  );
}
