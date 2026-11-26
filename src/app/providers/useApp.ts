import { createContext, useContext } from 'react';
import type { PublicCatalogMeta } from '../../services/storeRepository';
import type { AuthSession, PartnerProfile, StoreSettings } from '../../shared/types/domain';

export interface AppContextValue {
  mode: 'supabase' | 'local';
  isAuthReady: boolean;
  session: AuthSession | null;
  publicMeta: PublicCatalogMeta;
  activeSeller: PartnerProfile | null;
  replenishmentAlertCount: number;
  signInWithPassword: (email: string, password: string) => Promise<void>;
  signInLocalPartner: (sellerSlug: string) => Promise<void>;
  signOut: () => Promise<void>;
  refreshPublicMeta: () => Promise<void>;
  refreshSession: () => Promise<void>;
  refreshReplenishmentCount: () => Promise<void>;
  updateLocalSettingsCache: (settings: StoreSettings) => void;
}

export const AppContext = createContext<AppContextValue | null>(null);

/**
 * Accesses global authentication, active seller attribution, alerts, and store settings state.
 */
export function useApp(): AppContextValue {
  const ctx = useContext(AppContext);
  if (!ctx) {
    throw new Error('useApp must be used inside AppProvider.');
  }
  return ctx;
}
