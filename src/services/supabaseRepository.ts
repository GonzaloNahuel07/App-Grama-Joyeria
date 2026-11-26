import type {
  AuthSession,
  PartnerProfile,
  PartnerRole,
  ShippingMethodInfo,
  StoreSettings,
} from '../shared/types/domain';
import { supabase } from './supabaseClient';
import type { PartnerUpdateInput, PublicCatalogMeta, StoreRepository } from './storeRepository';

interface ProfileRow {
  id: string;
  full_name: string;
  seller_slug: string;
  whatsapp_number: string;
  role: PartnerRole;
  is_active: boolean;
}

interface PublicSellerRow {
  full_name: string;
  seller_slug: string;
  whatsapp_number: string;
}

interface StoreSettingsRow {
  business_name: string;
  instagram_handle: string;
  contact_email: string;
  default_seller_slug: string;
  shipping_methods: ShippingMethodInfo[];
  wholesale_enabled: boolean;
  wholesale_min_order_cents: number;
}

function getClient() {
  if (!supabase) {
    throw new Error('Supabase no está configurado en el entorno actual.');
  }
  return supabase;
}

function mapProfileRow(row: ProfileRow): PartnerProfile {
  return {
    id: row.id,
    fullName: row.full_name,
    sellerSlug: row.seller_slug,
    whatsappNumber: row.whatsapp_number,
    role: row.role,
    isActive: row.is_active,
  };
}

function mapSettingsRow(row: StoreSettingsRow): StoreSettings {
  return {
    businessName: row.business_name,
    instagramHandle: row.instagram_handle,
    contactEmail: row.contact_email,
    defaultSellerSlug: row.default_seller_slug,
    shippingMethods: Array.isArray(row.shipping_methods) ? row.shipping_methods : [],
    wholesaleEnabled: row.wholesale_enabled,
    wholesaleMinOrderCents: row.wholesale_min_order_cents,
  };
}

/**
 * Supabase-backed repository for production multi-device sync across partners and customers.
 */
export const supabaseRepository: StoreRepository = {
  mode: 'supabase',

  async getPublicCatalogMeta(): Promise<PublicCatalogMeta> {
    const client = getClient();
    const [{ data: sellerRows, error: sellersError }, { data: settingsRow, error: settingsError }] =
      await Promise.all([
        client.from('public_sellers').select('full_name, seller_slug, whatsapp_number'),
        client.from('store_settings').select('*').eq('id', 1).single<StoreSettingsRow>(),
      ]);

    if (sellersError) throw sellersError;
    if (settingsError) throw settingsError;

    const sellers: PartnerProfile[] = ((sellerRows ?? []) as PublicSellerRow[]).map((row) => ({
      id: row.seller_slug,
      fullName: row.full_name,
      sellerSlug: row.seller_slug,
      whatsappNumber: row.whatsapp_number,
      role: 'partner',
      isActive: true,
    }));

    return {
      sellers,
      settings: mapSettingsRow(settingsRow),
    };
  },

  async getSession(): Promise<AuthSession | null> {
    const client = getClient();
    const {
      data: { session },
      error,
    } = await client.auth.getSession();
    if (error) throw error;
    if (!session?.user) return null;

    const { data: profile, error: profileError } = await client
      .from('profiles')
      .select('id, full_name, seller_slug, whatsapp_number, role, is_active')
      .eq('id', session.user.id)
      .single<ProfileRow>();

    if (profileError || !profile?.is_active) return null;

    return {
      mode: 'supabase',
      partner: mapProfileRow(profile),
      email: session.user.email ?? '',
    };
  },

  async signInWithPassword(email: string, password: string): Promise<AuthSession> {
    const client = getClient();
    const { data, error } = await client.auth.signInWithPassword({ email, password });
    if (error) throw error;
    if (!data.user) {
      throw new Error('No se pudo iniciar sesión con esas credenciales.');
    }

    const session = await this.getSession();
    if (!session) {
      await client.auth.signOut();
      throw new Error('Tu usuario todavía no tiene un perfil de socio activo en public.profiles.');
    }
    return session;
  },

  async signInLocalPartner(): Promise<AuthSession> {
    throw new Error('El acceso rápido local no está habilitado cuando Supabase está conectado.');
  },

  async signOut(): Promise<void> {
    const client = getClient();
    const { error } = await client.auth.signOut();
    if (error) throw error;
  },

  async getPartners(): Promise<PartnerProfile[]> {
    const client = getClient();
    const { data, error } = await client
      .from('profiles')
      .select('id, full_name, seller_slug, whatsapp_number, role, is_active')
      .order('created_at', { ascending: true });
    if (error) throw error;
    return ((data ?? []) as ProfileRow[]).map(mapProfileRow);
  },

  async updatePartner(partnerId: string, patch: PartnerUpdateInput): Promise<PartnerProfile> {
    const client = getClient();
    const { data, error } = await client
      .from('profiles')
      .update({
        full_name: patch.fullName.trim(),
        seller_slug: patch.sellerSlug.trim().toLowerCase(),
        whatsapp_number: patch.whatsappNumber.trim(),
        is_active: patch.isActive,
      })
      .eq('id', partnerId)
      .select('id, full_name, seller_slug, whatsapp_number, role, is_active')
      .single<ProfileRow>();
    if (error) throw error;
    return mapProfileRow(data);
  },

  async getStoreSettings(): Promise<StoreSettings> {
    const client = getClient();
    const { data, error } = await client
      .from('store_settings')
      .select('*')
      .eq('id', 1)
      .single<StoreSettingsRow>();
    if (error) throw error;
    return mapSettingsRow(data);
  },

  async updateStoreSettings(patch: StoreSettings): Promise<StoreSettings> {
    const client = getClient();
    const session = await this.getSession();
    const { data, error } = await client
      .from('store_settings')
      .update({
        business_name: patch.businessName.trim(),
        instagram_handle: patch.instagramHandle.trim(),
        contact_email: patch.contactEmail.trim(),
        default_seller_slug: patch.defaultSellerSlug.trim().toLowerCase(),
        shipping_methods: patch.shippingMethods,
        wholesale_enabled: patch.wholesaleEnabled,
        wholesale_min_order_cents: patch.wholesaleMinOrderCents,
        updated_by: session?.partner.id ?? null,
      })
      .eq('id', 1)
      .select('*')
      .single<StoreSettingsRow>();
    if (error) throw error;
    return mapSettingsRow(data);
  },
};
