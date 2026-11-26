export type PartnerRole = 'owner' | 'partner';

export type OrderStatus = 'pending' | 'confirmed' | 'delivered' | 'cancelled';

export type OrderSource = 'catalog' | 'manual';

export type ExpenseCategory = 'inventory' | 'packaging' | 'shipping' | 'marketing' | 'other';

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
