import type {
  ActivityLog,
  AuthSession,
  Category,
  PartnerProfile,
  Product,
  ProductImage,
  StoreSettings,
} from '../shared/types/domain';

export interface PartnerUpdateInput {
  fullName: string;
  sellerSlug: string;
  whatsappNumber: string;
  isActive: boolean;
}

export interface ProductSaveInput {
  sku: string | null;
  name: string;
  description: string;
  materialDetails: string;
  categoryId: string | null;
  costCents: number;
  retailPriceCents: number;
  wholesalePriceCents: number | null;
  wholesaleMinQty: number | null;
  stockQty: number;
  minStockQty: number;
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

  // Block 2 — Inventory, Categories, Product Images & Activity Logs
  getCategories(): Promise<Category[]>;
  createCategory(name: string): Promise<Category>;
  getAdminProducts(): Promise<Product[]>;
  saveProduct(input: ProductSaveInput, existingId?: string): Promise<Product>;
  adjustProductStock(productId: string, delta: number, reason?: string): Promise<Product>;
  deleteProduct(productId: string): Promise<void>;
  uploadProductImage(productId: string, file: File): Promise<ProductImage>;
  deleteProductImage(image: ProductImage): Promise<void>;
  getRecentActivity(limit?: number): Promise<ActivityLog[]>;
}
