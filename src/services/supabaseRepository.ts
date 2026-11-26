import { compressProductImage } from '../features/inventory/lib/imageCompression';
import { slugifyText } from '../features/inventory/lib/inventoryUtils';
import type {
  ActivityLog,
  AuthSession,
  Category,
  CreatedCatalogOrder,
  PartnerProfile,
  PartnerRole,
  Product,
  ProductImage,
  PublicCatalogProduct,
  ShippingMethodInfo,
  StoreSettings,
} from '../shared/types/domain';
import { supabase } from './supabaseClient';
import type {
  CatalogOrderSubmitInput,
  PartnerUpdateInput,
  ProductSaveInput,
  PublicCatalogData,
  PublicCatalogMeta,
  StoreRepository,
} from './storeRepository';

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

interface CategoryRow {
  id: string;
  name: string;
  slug: string;
  sort_order: number;
  is_active: boolean;
}

interface ProductImageRow {
  id: string;
  product_id: string;
  storage_path: string;
  public_url: string;
  sort_order: number;
}

interface ProductRow {
  id: string;
  sku: string | null;
  name: string;
  slug: string;
  description: string;
  material_details: string;
  category_id: string | null;
  cost_cents: number;
  retail_price_cents: number;
  wholesale_price_cents: number | null;
  wholesale_min_qty: number | null;
  stock_qty: number;
  min_stock_qty: number;
  is_active: boolean;
  created_by: string | null;
  updated_by: string | null;
  created_at: string;
  updated_at: string;
  product_images?: ProductImageRow[];
}

interface PublicProductRow {
  id: string;
  name: string;
  slug: string;
  description: string;
  material_details: string;
  category_id: string | null;
  retail_price_cents: number;
  stock_qty: number;
  min_stock_qty: number;
}

interface ActivityLogRow {
  id: string;
  actor_id: string | null;
  actor_name: string;
  action_type: string;
  summary: string;
  entity_type: string;
  entity_id: string | null;
  created_at: string;
}

interface CreateOrderRpcResult {
  order_id: string;
  order_code: string;
  total_cents: number;
  seller_slug: string;
  seller_name: string;
  whatsapp_number: string;
}

const PRODUCT_IMAGES_BUCKET = 'product-images';

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

function mapCategoryRow(row: CategoryRow): Category {
  return {
    id: row.id,
    name: row.name,
    slug: row.slug,
    sortOrder: row.sort_order,
    isActive: row.is_active,
  };
}

function mapImageRow(row: ProductImageRow): ProductImage {
  return {
    id: row.id,
    productId: row.product_id,
    storagePath: row.storage_path,
    publicUrl: row.public_url,
    sortOrder: row.sort_order,
  };
}

function mapProductRow(row: ProductRow): Product {
  const images = (row.product_images ?? [])
    .map(mapImageRow)
    .sort((a, b) => a.sortOrder - b.sortOrder);

  return {
    id: row.id,
    sku: row.sku,
    name: row.name,
    slug: row.slug,
    description: row.description,
    materialDetails: row.material_details,
    categoryId: row.category_id,
    costCents: row.cost_cents,
    retailPriceCents: row.retail_price_cents,
    wholesalePriceCents: row.wholesale_price_cents,
    wholesaleMinQty: row.wholesale_min_qty,
    stockQty: row.stock_qty,
    minStockQty: row.min_stock_qty,
    isActive: row.is_active,
    images,
    createdBy: row.created_by,
    updatedBy: row.updated_by,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function mapActivityRow(row: ActivityLogRow): ActivityLog {
  return {
    id: row.id,
    actorId: row.actor_id,
    actorName: row.actor_name,
    actionType: row.action_type,
    summary: row.summary,
    entityType: row.entity_type,
    entityId: row.entity_id,
    createdAt: row.created_at,
  };
}

async function logSupabaseActivity(
  session: AuthSession | null,
  actionType: string,
  summary: string,
  entityType: string,
  entityId: string | null,
): Promise<void> {
  const client = getClient();
  await client.from('activity_logs').insert({
    actor_id: session?.partner.id ?? null,
    actor_name: session?.partner.fullName ?? 'Socio',
    action_type: actionType,
    summary,
    entity_type: entityType,
    entity_id: entityId,
  });
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

  async getCategories(): Promise<Category[]> {
    const client = getClient();
    const { data, error } = await client
      .from('categories')
      .select('id, name, slug, sort_order, is_active')
      .order('sort_order', { ascending: true });
    if (error) throw error;
    return ((data ?? []) as CategoryRow[]).map(mapCategoryRow);
  },

  async createCategory(name: string): Promise<Category> {
    const cleanName = name.trim();
    if (!cleanName) throw new Error('Ingresá un nombre para la categoría.');

    const client = getClient();
    const slug = `${slugifyText(cleanName)}-${Date.now().toString(36).slice(-4)}`;
    const { data, error } = await client
      .from('categories')
      .insert({ name: cleanName, slug, sort_order: 99, is_active: true })
      .select('id, name, slug, sort_order, is_active')
      .single<CategoryRow>();
    if (error) throw error;
    return mapCategoryRow(data);
  },

  async getAdminProducts(): Promise<Product[]> {
    const client = getClient();
    const { data, error } = await client
      .from('products')
      .select('*, product_images(id, product_id, storage_path, public_url, sort_order)')
      .order('updated_at', { ascending: false });
    if (error) throw error;
    return ((data ?? []) as ProductRow[]).map(mapProductRow);
  },

  async saveProduct(input: ProductSaveInput, existingId?: string): Promise<Product> {
    const client = getClient();
    const session = await this.getSession();

    const basePayload = {
      sku: input.sku,
      name: input.name,
      description: input.description,
      material_details: input.materialDetails,
      category_id: input.categoryId,
      cost_cents: input.costCents,
      retail_price_cents: input.retailPriceCents,
      wholesale_price_cents: input.wholesalePriceCents,
      wholesale_min_qty: input.wholesaleMinQty,
      stock_qty: input.stockQty,
      min_stock_qty: input.minStockQty,
      is_active: input.isActive,
      updated_by: session?.partner.id ?? null,
    };

    if (existingId) {
      const { data, error } = await client
        .from('products')
        .update(basePayload)
        .eq('id', existingId)
        .select('*, product_images(id, product_id, storage_path, public_url, sort_order)')
        .single<ProductRow>();
      if (error) throw error;
      const mapped = mapProductRow(data);
      await logSupabaseActivity(
        session,
        'product_updated',
        `Actualizó ${mapped.name} (stock: ${mapped.stockQty})`,
        'product',
        mapped.id,
      );
      return mapped;
    }

    const slug = `${slugifyText(input.name)}-${Date.now().toString(36).slice(-4)}`;
    const { data, error } = await client
      .from('products')
      .insert({
        ...basePayload,
        slug,
        created_by: session?.partner.id ?? null,
      })
      .select('*, product_images(id, product_id, storage_path, public_url, sort_order)')
      .single<ProductRow>();
    if (error) throw error;
    const mapped = mapProductRow(data);
    await logSupabaseActivity(
      session,
      'product_created',
      `Cargó ${mapped.name} (stock inicial: ${mapped.stockQty})`,
      'product',
      mapped.id,
    );
    return mapped;
  },

  async adjustProductStock(productId: string, delta: number, reason?: string): Promise<Product> {
    const client = getClient();
    const session = await this.getSession();

    const { data: current, error: fetchError } = await client
      .from('products')
      .select('id, name, stock_qty')
      .eq('id', productId)
      .single<{ id: string; name: string; stock_qty: number }>();
    if (fetchError) throw fetchError;

    const nextStock = Math.max(0, current.stock_qty + delta);
    const { data, error } = await client
      .from('products')
      .update({
        stock_qty: nextStock,
        updated_by: session?.partner.id ?? null,
      })
      .eq('id', productId)
      .select('*, product_images(id, product_id, storage_path, public_url, sort_order)')
      .single<ProductRow>();
    if (error) throw error;

    const diffLabel = delta >= 0 ? `+${delta}` : String(delta);
    await logSupabaseActivity(
      session,
      'stock_adjusted',
      `${reason ? `${reason}: ` : ''}${current.name} (${diffLabel} → ${nextStock} u.)`,
      'product',
      productId,
    );

    return mapProductRow(data);
  },

  async deleteProduct(productId: string): Promise<void> {
    const client = getClient();
    const session = await this.getSession();

    const { data: target } = await client
      .from('products')
      .select('name, product_images(storage_path)')
      .eq('id', productId)
      .single<{ name: string; product_images?: Array<{ storage_path: string }> }>();

    const paths = (target?.product_images ?? []).map((img) => img.storage_path).filter(Boolean);
    if (paths.length > 0) {
      await client.storage.from(PRODUCT_IMAGES_BUCKET).remove(paths);
    }

    const { error } = await client.from('products').delete().eq('id', productId);
    if (error) throw error;

    if (target?.name) {
      await logSupabaseActivity(
        session,
        'product_deleted',
        `Eliminó ${target.name} del inventario`,
        'product',
        productId,
      );
    }
  },

  async uploadProductImage(productId: string, file: File): Promise<ProductImage> {
    const client = getClient();
    const compressed = await compressProductImage(file);
    const storagePath = `${productId}/${Date.now()}-${Math.random().toString(36).slice(2, 7)}.${compressed.extension}`;

    const { error: uploadError } = await client.storage
      .from(PRODUCT_IMAGES_BUCKET)
      .upload(storagePath, compressed.blob, {
        contentType: compressed.extension === 'webp' ? 'image/webp' : 'image/jpeg',
        upsert: false,
      });
    if (uploadError) throw uploadError;

    const {
      data: { publicUrl },
    } = client.storage.from(PRODUCT_IMAGES_BUCKET).getPublicUrl(storagePath);

    const { data, error } = await client
      .from('product_images')
      .insert({
        product_id: productId,
        storage_path: storagePath,
        public_url: publicUrl,
        sort_order: 0,
      })
      .select('id, product_id, storage_path, public_url, sort_order')
      .single<ProductImageRow>();
    if (error) throw error;

    return mapImageRow(data);
  },

  async deleteProductImage(image: ProductImage): Promise<void> {
    const client = getClient();
    if (image.storagePath) {
      await client.storage.from(PRODUCT_IMAGES_BUCKET).remove([image.storagePath]);
    }
    const { error } = await client.from('product_images').delete().eq('id', image.id);
    if (error) throw error;
  },

  async getRecentActivity(limit = 12): Promise<ActivityLog[]> {
    const client = getClient();
    const { data, error } = await client
      .from('activity_logs')
      .select('id, actor_id, actor_name, action_type, summary, entity_type, entity_id, created_at')
      .order('created_at', { ascending: false })
      .limit(limit);
    if (error) throw error;
    return ((data ?? []) as ActivityLogRow[]).map(mapActivityRow);
  },

  async getPublicCatalog(): Promise<PublicCatalogData> {
    const client = getClient();
    const [
      { data: categoryRows, error: catError },
      { data: productRows, error: prodError },
      { data: imageRows, error: imgError },
    ] = await Promise.all([
      client
        .from('categories')
        .select('id, name, slug, sort_order, is_active')
        .eq('is_active', true)
        .order('sort_order', { ascending: true }),
      client.from('public_catalog_products').select('*').order('created_at', { ascending: false }),
      client
        .from('product_images')
        .select('id, product_id, storage_path, public_url, sort_order')
        .order('sort_order', { ascending: true }),
    ]);

    if (catError) throw catError;
    if (prodError) throw prodError;
    if (imgError) throw imgError;

    const imagesByProduct = new Map<string, ProductImage[]>();
    for (const row of (imageRows ?? []) as ProductImageRow[]) {
      const list = imagesByProduct.get(row.product_id) ?? [];
      list.push(mapImageRow(row));
      imagesByProduct.set(row.product_id, list);
    }

    const products: PublicCatalogProduct[] = ((productRows ?? []) as PublicProductRow[]).map(
      (row) => ({
        id: row.id,
        name: row.name,
        slug: row.slug,
        description: row.description,
        materialDetails: row.material_details,
        categoryId: row.category_id,
        retailPriceCents: row.retail_price_cents,
        stockQty: row.stock_qty,
        minStockQty: row.min_stock_qty,
        images: imagesByProduct.get(row.id) ?? [],
      }),
    );

    return {
      categories: ((categoryRows ?? []) as CategoryRow[]).map(mapCategoryRow),
      products,
    };
  },

  async submitCatalogOrder(input: CatalogOrderSubmitInput): Promise<CreatedCatalogOrder> {
    const client = getClient();
    const { data, error } = await client.rpc('create_catalog_order', {
      p_seller_slug: input.sellerSlug,
      p_customer_name: input.customerName,
      p_customer_phone: input.customerPhone,
      p_delivery_method: input.deliveryMethod,
      p_delivery_address: input.deliveryAddress,
      p_payment_method: input.paymentMethod,
      p_notes: input.notes,
      p_items: input.items.map((item) => ({ product_id: item.productId, qty: item.qty })),
    });

    if (error) throw error;
    const rpcResult = data as CreateOrderRpcResult;

    return {
      orderId: rpcResult.order_id,
      orderCode: rpcResult.order_code,
      totalCents: rpcResult.total_cents,
      sellerSlug: rpcResult.seller_slug,
      sellerName: rpcResult.seller_name,
      whatsappNumber: rpcResult.whatsapp_number,
    };
  },
};
