import type { AuthSession, PartnerProfile, StoreSettings } from '../shared/types/domain';
import type { PartnerUpdateInput, PublicCatalogMeta, StoreRepository } from './storeRepository';

const STORAGE_KEYS = {
  partners: 'grama.local.partners.v1',
  settings: 'grama.local.settings.v1',
  sessionSlug: 'grama.local.sessionSlug.v1',
} as const;

const DEFAULT_PARTNERS: PartnerProfile[] = [
  {
    id: 'local-gonzalo',
    fullName: 'Gonzalo',
    sellerSlug: 'gonzalo',
    whatsappNumber: '5491100001111',
    role: 'owner',
    isActive: true,
  },
  {
    id: 'local-hermana',
    fullName: 'Hermana',
    sellerSlug: 'hermana',
    whatsappNumber: '5491100002222',
    role: 'partner',
    isActive: true,
  },
];

const DEFAULT_SETTINGS: StoreSettings = {
  businessName: 'Grama Joyería',
  instagramHandle: '@gramajoyeria',
  contactEmail: '',
  defaultSellerSlug: 'gonzalo',
  shippingMethods: [
    {
      id: 'pickup',
      title: 'Retiro en punto de entrega',
      description: 'Sin costo, coordinando día y horario tras confirmar el pedido.',
    },
    {
      id: 'courier',
      title: 'Envío por cadetería / moto',
      description: 'Entregas rápidas dentro de la zona de cobertura.',
    },
    {
      id: 'mail',
      title: 'Correo a todo el país',
      description: 'Despacho con seguimiento y packaging protector.',
    },
  ],
  wholesaleEnabled: false,
  wholesaleMinOrderCents: 0,
};

function readJson<T>(key: string, fallback: T): T {
  try {
    const raw = window.localStorage.getItem(key);
    if (!raw) return fallback;
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

function writeJson<T>(key: string, value: T): void {
  window.localStorage.setItem(key, JSON.stringify(value));
}

function loadPartners(): PartnerProfile[] {
  const stored = readJson<PartnerProfile[]>(STORAGE_KEYS.partners, DEFAULT_PARTNERS);
  return stored.length > 0 ? stored : DEFAULT_PARTNERS;
}

function loadSettings(): StoreSettings {
  return readJson<StoreSettings>(STORAGE_KEYS.settings, DEFAULT_SETTINGS);
}

/**
 * LocalStorage-backed repository used when Supabase environment variables are not configured.
 */
export const localRepository: StoreRepository = {
  mode: 'local',

  async getPublicCatalogMeta(): Promise<PublicCatalogMeta> {
    const sellers = loadPartners().filter((partner) => partner.isActive);
    return { sellers, settings: loadSettings() };
  },

  async getSession(): Promise<AuthSession | null> {
    const slug = window.localStorage.getItem(STORAGE_KEYS.sessionSlug);
    if (!slug) return null;
    const partner = loadPartners().find((item) => item.sellerSlug === slug && item.isActive);
    if (!partner) return null;
    return {
      mode: 'local',
      partner,
      email: `${partner.sellerSlug}@modo-local.grama`,
    };
  },

  async signInWithPassword(): Promise<AuthSession> {
    throw new Error('El inicio con correo requiere configurar Supabase en .env.local.');
  },

  async signInLocalPartner(sellerSlug: string): Promise<AuthSession> {
    const partner = loadPartners().find((item) => item.sellerSlug === sellerSlug && item.isActive);
    if (!partner) {
      throw new Error(`No se encontró un socio activo para "${sellerSlug}".`);
    }
    window.localStorage.setItem(STORAGE_KEYS.sessionSlug, partner.sellerSlug);
    return {
      mode: 'local',
      partner,
      email: `${partner.sellerSlug}@modo-local.grama`,
    };
  },

  async signOut(): Promise<void> {
    window.localStorage.removeItem(STORAGE_KEYS.sessionSlug);
  },

  async getPartners(): Promise<PartnerProfile[]> {
    return loadPartners();
  },

  async updatePartner(partnerId: string, patch: PartnerUpdateInput): Promise<PartnerProfile> {
    const partners = loadPartners();
    const index = partners.findIndex((item) => item.id === partnerId);
    const current = partners[index];
    if (index === -1 || !current) {
      throw new Error('No se encontró el perfil del socio a actualizar.');
    }

    const updated: PartnerProfile = {
      ...current,
      fullName: patch.fullName.trim(),
      sellerSlug: patch.sellerSlug.trim().toLowerCase(),
      whatsappNumber: patch.whatsappNumber.trim(),
      isActive: patch.isActive,
    };

    const duplicateSlug = partners.some(
      (item) => item.id !== partnerId && item.sellerSlug === updated.sellerSlug,
    );
    if (duplicateSlug) {
      throw new Error(`El identificador "${updated.sellerSlug}" ya está asignado a otro socio.`);
    }

    const nextPartners = [...partners];
    nextPartners[index] = updated;
    writeJson(STORAGE_KEYS.partners, nextPartners);

    if (window.localStorage.getItem(STORAGE_KEYS.sessionSlug) === current.sellerSlug) {
      window.localStorage.setItem(STORAGE_KEYS.sessionSlug, updated.sellerSlug);
    }

    return updated;
  },

  async getStoreSettings(): Promise<StoreSettings> {
    return loadSettings();
  },

  async updateStoreSettings(patch: StoreSettings): Promise<StoreSettings> {
    writeJson(STORAGE_KEYS.settings, patch);
    return patch;
  },
};
