import { useCallback, useEffect, useMemo, useState, type ReactNode } from 'react';
import { useLocation } from 'react-router-dom';
import {
  parseSellerSlugFromSearch,
  persistSellerSlug,
  readStoredSellerSlug,
  resolveActiveSeller,
} from '../../features/catalog/lib/sellerContext';
import { getReplenishmentQueue } from '../../features/inventory/lib/inventoryUtils';
import { storeService } from '../../services';
import type { PublicCatalogMeta } from '../../services/storeRepository';
import type { AuthSession, StoreSettings } from '../../shared/types/domain';
import { AppContext, type AppContextValue } from './useApp';

const EMPTY_META: PublicCatalogMeta = {
  sellers: [],
  settings: {
    businessName: 'Grama Joyería',
    instagramHandle: '@gramajoyeria',
    contactEmail: '',
    defaultSellerSlug: 'gonzalo',
    shippingMethods: [],
    wholesaleEnabled: false,
    wholesaleMinOrderCents: 0,
  },
};

export function AppProvider({ children }: { children: ReactNode }) {
  const location = useLocation();
  const [isAuthReady, setIsAuthReady] = useState(false);
  const [session, setSession] = useState<AuthSession | null>(null);
  const [publicMeta, setPublicMeta] = useState<PublicCatalogMeta>(EMPTY_META);
  const [replenishmentAlertCount, setReplenishmentAlertCount] = useState(0);

  const refreshPublicMeta = useCallback(async () => {
    const meta = await storeService.getPublicCatalogMeta();
    setPublicMeta(meta);
  }, []);

  const refreshReplenishmentCount = useCallback(async () => {
    try {
      const products = await storeService.getAdminProducts();
      setReplenishmentAlertCount(getReplenishmentQueue(products).length);
    } catch {
      setReplenishmentAlertCount(0);
    }
  }, []);

  const refreshSession = useCallback(async () => {
    const current = await storeService.getSession();
    setSession(current);
    if (current) {
      await refreshReplenishmentCount();
    } else {
      setReplenishmentAlertCount(0);
    }
  }, [refreshReplenishmentCount]);

  useEffect(() => {
    let active = true;
    Promise.all([storeService.getSession(), storeService.getPublicCatalogMeta()])
      .then(async ([currentSession, meta]) => {
        if (!active) return;
        setSession(currentSession);
        setPublicMeta(meta);
        if (currentSession) {
          const products = await storeService.getAdminProducts();
          if (active) {
            setReplenishmentAlertCount(getReplenishmentQueue(products).length);
          }
        }
      })
      .catch(() => {
        // Keep safe defaults if initial network fetch fails.
      })
      .finally(() => {
        if (active) setIsAuthReady(true);
      });

    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    const querySlug = parseSellerSlugFromSearch(location.search);
    if (querySlug) {
      persistSellerSlug(querySlug);
    }
  }, [location.search]);

  const activeSeller = useMemo(
    () =>
      resolveActiveSeller({
        search: location.search,
        storedSlug: readStoredSellerSlug(),
        sellers: publicMeta.sellers,
        defaultSlug: publicMeta.settings.defaultSellerSlug,
      }),
    [location.search, publicMeta.sellers, publicMeta.settings.defaultSellerSlug],
  );

  const signInWithPassword = useCallback(
    async (email: string, password: string) => {
      const nextSession = await storeService.signInWithPassword(email, password);
      setSession(nextSession);
      await refreshReplenishmentCount();
    },
    [refreshReplenishmentCount],
  );

  const signInLocalPartner = useCallback(
    async (sellerSlug: string) => {
      const nextSession = await storeService.signInLocalPartner(sellerSlug);
      setSession(nextSession);
      await refreshReplenishmentCount();
    },
    [refreshReplenishmentCount],
  );

  const signOut = useCallback(async () => {
    await storeService.signOut();
    setSession(null);
    setReplenishmentAlertCount(0);
  }, []);

  const updateLocalSettingsCache = useCallback((settings: StoreSettings) => {
    setPublicMeta((prev) => ({ ...prev, settings }));
  }, []);

  const value = useMemo<AppContextValue>(
    () => ({
      mode: storeService.mode,
      isAuthReady,
      session,
      publicMeta,
      activeSeller,
      replenishmentAlertCount,
      signInWithPassword,
      signInLocalPartner,
      signOut,
      refreshPublicMeta,
      refreshSession,
      refreshReplenishmentCount,
      updateLocalSettingsCache,
    }),
    [
      isAuthReady,
      session,
      publicMeta,
      activeSeller,
      replenishmentAlertCount,
      signInWithPassword,
      signInLocalPartner,
      signOut,
      refreshPublicMeta,
      refreshSession,
      refreshReplenishmentCount,
      updateLocalSettingsCache,
    ],
  );

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}
