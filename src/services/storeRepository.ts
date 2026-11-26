import type { AuthSession, PartnerProfile, StoreSettings } from '../shared/types/domain';

export interface PartnerUpdateInput {
  fullName: string;
  sellerSlug: string;
  whatsappNumber: string;
  isActive: boolean;
}

export interface PublicCatalogMeta {
  sellers: PartnerProfile[];
  settings: StoreSettings;
}

export interface StoreRepository {
  readonly mode: 'supabase' | 'local';
  getPublicCatalogMeta(): Promise<PublicCatalogMeta>;
  getSession(): Promise<AuthSession | null>;
  signInWithPassword(email: string, password: string): Promise<AuthSession>;
  signInLocalPartner(sellerSlug: string): Promise<AuthSession>;
  signOut(): Promise<void>;
  getPartners(): Promise<PartnerProfile[]>;
  updatePartner(partnerId: string, patch: PartnerUpdateInput): Promise<PartnerProfile>;
  getStoreSettings(): Promise<StoreSettings>;
  updateStoreSettings(patch: StoreSettings): Promise<StoreSettings>;
}
