export type PartnerRole = 'owner' | 'partner';

export type OrderStatus = 'pending' | 'confirmed' | 'delivered' | 'cancelled';

export type OrderSource = 'catalog' | 'manual';

export type ExpenseCategory = 'inventory' | 'packaging' | 'shipping' | 'marketing' | 'other';

export type StockHealth = 'out' | 'low' | 'ok';

export interface PartnerProfile {
  id: string;
  fullName: string;
  sellerSlug: string;
  whatsappNumber: string;
  role: PartnerRole;
  isActive: boolean;
}

export interface ShippingMethodInfo {
  id: string;
  title: string;
  description: string;
}

export interface StoreSettings {
  businessName: string;
  instagramHandle: string;
  contactEmail: string;
  defaultSellerSlug: string;
  shippingMethods: ShippingMethodInfo[];
  wholesaleEnabled: boolean;
  wholesaleMinOrderCents: number;
}

export interface AuthSession {
  mode: 'supabase' | 'local';
  partner: PartnerProfile;
  email: string;
}

export interface Category {
  id: string;
  name: string;
  slug: string;
  sortOrder: number;
  isActive: boolean;
}

export interface ProductImage {
  id: string;
  productId: string;
  storagePath: string;
  publicUrl: string;
  sortOrder: number;
}

export interface Product {
  id: string;
  sku: string | null;
  name: string;
  slug: string;
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
  images: ProductImage[];
  createdBy: string | null;
  updatedBy: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface PublicCatalogProduct {
  id: string;
  name: string;
  slug: string;
  description: string;
  materialDetails: string;
  categoryId: string | null;
  retailPriceCents: number;
  stockQty: number;
  minStockQty: number;
  images: ProductImage[];
}

export interface CartItem {
  productId: string;
  name: string;
  retailPriceCents: number;
  maxStockQty: number;
  imageUrl: string | null;
  qty: number;
}

export interface OrderItem {
  id: string;
  productId: string | null;
  productNameSnapshot: string;
  qty: number;
  unitPriceCents: number;
  unitCostCents: number;
}

export interface Order {
  id: string;
  orderCode: string;
  source: OrderSource;
  sellerSlug: string;
  assignedProfileId: string | null;
  customerName: string;
  customerPhone: string;
  deliveryMethod: string;
  deliveryAddress: string;
  paymentMethod: string;
  notes: string;
  status: OrderStatus;
  totalCents: number;
  items: OrderItem[];
  createdBy: string | null;
  confirmedBy: string | null;
  confirmedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface CreatedCatalogOrder {
  orderId: string;
  orderCode: string;
  totalCents: number;
  sellerSlug: string;
  sellerName: string;
  whatsappNumber: string;
}

export interface ActivityLog {
  id: string;
  actorId: string | null;
  actorName: string;
  actionType: string;
  summary: string;
  entityType: string;
  entityId: string | null;
  createdAt: string;
}
