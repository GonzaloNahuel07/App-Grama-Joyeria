import { compressProductImage } from '../features/inventory/lib/imageCompression';
import { slugifyText } from '../features/inventory/lib/inventoryUtils';
import type {
  ActivityLog,
  AuthSession,
  Category,
  PartnerProfile,
  Product,
  ProductImage,
  StoreSettings,
} from '../shared/types/domain';
import type {
  PartnerUpdateInput,
  ProductSaveInput,
  PublicCatalogMeta,
  StoreRepository,
} from './storeRepository';

const STORAGE_KEYS = {
  partners: 'grama.local.partners.v1',
  settings: 'grama.local.settings.v1',
  sessionSlug: 'grama.local.sessionSlug.v1',
  categories: 'grama.local.categories.v1',
  products: 'grama.local.products.v1',
  activity: 'grama.local.activity.v1',
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

const DEFAULT_CATEGORIES: Category[] = [
  { id: 'cat-anillos', name: 'Anillos', slug: 'anillos', sortOrder: 1, isActive: true },
  { id: 'cat-aros', name: 'Aros', slug: 'aros', sortOrder: 2, isActive: true },
  { id: 'cat-cadenas', name: 'Cadenas', slug: 'cadenas', sortOrder: 3, isActive: true },
  { id: 'cat-pulseras', name: 'Pulseras', slug: 'pulseras', sortOrder: 4, isActive: true },
  { id: 'cat-conjuntos', name: 'Conjuntos', slug: 'conjuntos', sortOrder: 5, isActive: true },
];

const SEED_TIMESTAMP = '2026-11-26T15:00:00.000Z';

const DEFAULT_PRODUCTS: Product[] = [
  {
    id: 'prod-anillo-solitario',
    sku: 'AN-001',
    name: 'Anillo Solitario Plata 925',
    slug: 'anillo-solitario-plata-925',
    description: 'Diseño clásico con piedra engarzada, ideal para uso diario o regalo.',
    materialDetails: 'Plata 925 · Cubic central 4mm · Talles surtidos',
    categoryId: 'cat-anillos',
    costCents: 920000,
    retailPriceCents: 1850000,
    wholesalePriceCents: 1450000,
    wholesaleMinQty: 3,
    stockQty: 6,
    minStockQty: 3,
    isActive: true,
    images: [],
    createdBy: 'local-gonzalo',
    updatedBy: 'local-gonzalo',
    createdAt: SEED_TIMESTAMP,
    updatedAt: SEED_TIMESTAMP,
  },
  {
    id: 'prod-cadena-veneciana',
    sku: 'CAD-014',
    name: 'Cadena Veneciana 45cm',
    slug: 'cadena-veneciana-45cm',
    description: 'Cadena fina con brillo duradero resistente al agua.',
    materialDetails: 'Acero quirúrgico dorado · Largo 45cm · Cierre mosquetón',
    categoryId: 'cat-cadenas',
    costCents: 1180000,
    retailPriceCents: 2450000,
    wholesalePriceCents: null,
    wholesaleMinQty: null,
    stockQty: 2,
    minStockQty: 4,
    isActive: true,
    images: [],
    createdBy: 'local-hermana',
    updatedBy: 'local-hermana',
    createdAt: SEED_TIMESTAMP,
    updatedAt: SEED_TIMESTAMP,
  },
  {
    id: 'prod-aros-argolla',
    sku: 'AR-008',
    name: 'Aros Argolla Baño Oro',
    slug: 'aros-argolla-bano-oro',
    description: 'Argollas livianas de 18mm con cierre clic seguro.',
    materialDetails: 'Bronce con baño de oro 18k · Hipoalergénicos',
    categoryId: 'cat-aros',
    costCents: 590000,
    retailPriceCents: 1290000,
    wholesalePriceCents: null,
    wholesaleMinQty: null,
    stockQty: 9,
    minStockQty: 3,
    isActive: true,
    images: [],
    createdBy: 'local-gonzalo',
    updatedBy: 'local-gonzalo',
    createdAt: SEED_TIMESTAMP,
    updatedAt: SEED_TIMESTAMP,
  },
  {
    id: 'prod-pulsera-esclava',
    sku: 'PUL-003',
    name: 'Pulsera Esclava Lisa',
    slug: 'pulsera-esclava-lisa',
    description: 'Pulsera rígida minimalista fácil de combinar.',
    materialDetails: 'Plata 925 maciza · Diámetro 60mm',
    categoryId: 'cat-pulseras',
    costCents: 1550000,
    retailPriceCents: 2980000,
    wholesalePriceCents: null,
    wholesaleMinQty: null,
    stockQty: 0,
    minStockQty: 2,
    isActive: true,
    images: [],
    createdBy: 'local-hermana',
    updatedBy: 'local-hermana',
    createdAt: SEED_TIMESTAMP,
    updatedAt: SEED_TIMESTAMP,
  },
];

const DEFAULT_ACTIVITY: ActivityLog[] = [
  {
    id: 'act-seed-1',
    actorId: 'local-hermana',
    actorName: 'Hermana',
    actionType: 'product_created',
    summary: 'Cargó Cadena Veneciana 45cm (stock inicial: 2)',
    entityType: 'product',
    entityId: 'prod-cadena-veneciana',
    createdAt: SEED_TIMESTAMP,
  },
  {
    id: 'act-seed-2',
    actorId: 'local-gonzalo',
    actorName: 'Gonzalo',
    actionType: 'product_created',
    summary: 'Cargó Anillo Solitario Plata 925 (stock inicial: 6)',
    entityType: 'product',
    entityId: 'prod-anillo-solitario',
    createdAt: SEED_TIMESTAMP,
  },
];

function readJson<T>(key: string, fallback: T): T {
  try {
    const raw = window.localStorage.getItem(key);
    if (raw === null) return fallback;
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

function loadCategories(): Category[] {
  return readJson<Category[]>(STORAGE_KEYS.categories, DEFAULT_CATEGORIES);
}

function loadProducts(): Product[] {
  return readJson<Product[]>(STORAGE_KEYS.products, DEFAULT_PRODUCTS);
}

function loadActivity(): ActivityLog[] {
  return readJson<ActivityLog[]>(STORAGE_KEYS.activity, DEFAULT_ACTIVITY);
}

function recordLocalActivity(entry: Omit<ActivityLog, 'id' | 'createdAt'>): void {
  const current = loadActivity();
  const next: ActivityLog = {
    ...entry,
    id: `act-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
    createdAt: new Date().toISOString(),
  };
  writeJson(STORAGE_KEYS.activity, [next, ...current].slice(0, 50));
}

function getCurrentLocalActor(): PartnerProfile | null {
  const slug = window.localStorage.getItem(STORAGE_KEYS.sessionSlug);
  if (!slug) return null;
  return loadPartners().find((item) => item.sellerSlug === slug && item.isActive) ?? null;
}

function generateUniqueSlug(baseName: string, usedSlugs: Set<string>): string {
  const base = slugifyText(baseName);
  if (!usedSlugs.has(base)) return base;
  let counter = 2;
  while (usedSlugs.has(`${base}-${counter}`)) {
    counter += 1;
  }
  return `${base}-${counter}`;
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
    const partner = getCurrentLocalActor();
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

  async getCategories(): Promise<Category[]> {
    return loadCategories().sort((a, b) => a.sortOrder - b.sortOrder);
  },

  async createCategory(name: string): Promise<Category> {
    const cleanName = name.trim();
    if (!cleanName) throw new Error('Ingresá un nombre para la categoría.');

    const categories = loadCategories();
    const existing = categories.find((c) => c.name.toLowerCase() === cleanName.toLowerCase());
    if (existing) return existing;

    const usedSlugs = new Set(categories.map((c) => c.slug));
    const created: Category = {
      id: `cat-${Date.now()}`,
      name: cleanName,
      slug: generateUniqueSlug(cleanName, usedSlugs),
      sortOrder: categories.length + 1,
      isActive: true,
    };
    writeJson(STORAGE_KEYS.categories, [...categories, created]);
    return created;
  },

  async getAdminProducts(): Promise<Product[]> {
    return loadProducts().sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
  },

  async saveProduct(input: ProductSaveInput, existingId?: string): Promise<Product> {
    const actor = getCurrentLocalActor();
    const products = loadProducts();
    const now = new Date().toISOString();

    if (existingId) {
      const index = products.findIndex((p) => p.id === existingId);
      const current = products[index];
      if (index === -1 || !current) {
        throw new Error('No encontramos la pieza que querés editar.');
      }
      const updated: Product = {
        ...current,
        ...input,
        updatedBy: actor?.id ?? current.updatedBy,
        updatedAt: now,
      };
      const next = [...products];
      next[index] = updated;
      writeJson(STORAGE_KEYS.products, next);

      recordLocalActivity({
        actorId: actor?.id ?? null,
        actorName: actor?.fullName ?? 'Socio',
        actionType: 'product_updated',
        summary: `Actualizó ${updated.name} (stock: ${updated.stockQty})`,
        entityType: 'product',
        entityId: updated.id,
      });

      return updated;
    }

    const usedSlugs = new Set(products.map((p) => p.slug));
    const created: Product = {
      id: `prod-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      slug: generateUniqueSlug(input.name, usedSlugs),
      ...input,
      images: [],
      createdBy: actor?.id ?? null,
      updatedBy: actor?.id ?? null,
      createdAt: now,
      updatedAt: now,
    };
    writeJson(STORAGE_KEYS.products, [created, ...products]);

    recordLocalActivity({
      actorId: actor?.id ?? null,
      actorName: actor?.fullName ?? 'Socio',
      actionType: 'product_created',
      summary: `Cargó ${created.name} (stock inicial: ${created.stockQty})`,
      entityType: 'product',
      entityId: created.id,
    });

    return created;
  },

  async adjustProductStock(productId: string, delta: number, reason?: string): Promise<Product> {
    const actor = getCurrentLocalActor();
    const products = loadProducts();
    const index = products.findIndex((p) => p.id === productId);
    const current = products[index];
    if (index === -1 || !current) {
      throw new Error('No se encontró el producto.');
    }

    const nextStock = Math.max(0, current.stockQty + delta);
    const updated: Product = {
      ...current,
      stockQty: nextStock,
      updatedBy: actor?.id ?? current.updatedBy,
      updatedAt: new Date().toISOString(),
    };
    const next = [...products];
    next[index] = updated;
    writeJson(STORAGE_KEYS.products, next);

    const diffLabel = delta >= 0 ? `+${delta}` : String(delta);
    recordLocalActivity({
      actorId: actor?.id ?? null,
      actorName: actor?.fullName ?? 'Socio',
      actionType: 'stock_adjusted',
      summary: `${reason ? `${reason}: ` : ''}${updated.name} (${diffLabel} → ${nextStock} u.)`,
      entityType: 'product',
      entityId: updated.id,
    });

    return updated;
  },

  async deleteProduct(productId: string): Promise<void> {
    const actor = getCurrentLocalActor();
    const products = loadProducts();
    const target = products.find((p) => p.id === productId);
    if (!target) return;

    writeJson(
      STORAGE_KEYS.products,
      products.filter((p) => p.id !== productId),
    );
    recordLocalActivity({
      actorId: actor?.id ?? null,
      actorName: actor?.fullName ?? 'Socio',
      actionType: 'product_deleted',
      summary: `Eliminó ${target.name} del inventario`,
      entityType: 'product',
      entityId: productId,
    });
  },

  async uploadProductImage(productId: string, file: File): Promise<ProductImage> {
    const compressed = await compressProductImage(file);
    const products = loadProducts();
    const index = products.findIndex((p) => p.id === productId);
    const current = products[index];
    if (index === -1 || !current) {
      throw new Error('No se encontró el producto para asociar la imagen.');
    }

    const image: ProductImage = {
      id: `img-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      productId,
      storagePath: `local/${productId}/${Date.now()}.${compressed.extension}`,
      publicUrl: compressed.dataUrl,
      sortOrder: current.images.length,
    };

    const next = [...products];
    next[index] = {
      ...current,
      images: [...current.images, image],
      updatedAt: new Date().toISOString(),
    };
    writeJson(STORAGE_KEYS.products, next);
    return image;
  },

  async deleteProductImage(image: ProductImage): Promise<void> {
    const products = loadProducts();
    const index = products.findIndex((p) => p.id === image.productId);
    const current = products[index];
    if (index === -1 || !current) return;

    const next = [...products];
    next[index] = {
      ...current,
      images: current.images
        .filter((img) => img.id !== image.id)
        .map((img, idx) => ({ ...img, sortOrder: idx })),
      updatedAt: new Date().toISOString(),
    };
    writeJson(STORAGE_KEYS.products, next);
  },

  async getRecentActivity(limit = 12): Promise<ActivityLog[]> {
    return loadActivity().slice(0, limit);
  },
};
