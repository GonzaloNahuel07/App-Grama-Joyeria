import type { PartnerProfile } from '../../../shared/types/domain';

const SELLER_STORAGE_KEY = 'grama.activeSellerSlug';
const VALID_SLUG_PATTERN = /^[a-z0-9-]+$/;

/**
 * Normalizes and validates a seller slug candidate.
 */
export function normalizeSellerSlug(value: string | null | undefined): string | null {
  if (!value) return null;
  const normalized = value.trim().toLowerCase();
  return VALID_SLUG_PATTERN.test(normalized) ? normalized : null;
}

/**
 * Extracts a validated seller slug from URL search parameters (?v= or ?vendedor=).
 */
export function parseSellerSlugFromSearch(search: string): string | null {
  const params = new URLSearchParams(search);
  return normalizeSellerSlug(params.get('v') ?? params.get('vendedor'));
}

/**
 * Reads the persisted seller slug for the current browser session.
 */
export function readStoredSellerSlug(): string | null {
  try {
    return normalizeSellerSlug(window.sessionStorage.getItem(SELLER_STORAGE_KEY));
  } catch {
    return null;
  }
}

/**
 * Persists the active seller slug so navigation across public routes keeps attribution.
 */
export function persistSellerSlug(slug: string): void {
  const valid = normalizeSellerSlug(slug);
  if (!valid) return;
  try {
    window.sessionStorage.setItem(SELLER_STORAGE_KEY, valid);
  } catch {
    // Ignore storage unavailability in restricted browser contexts.
  }
}

/**
 * Resolves which partner should receive orders from the current catalog session.
 */
export function resolveActiveSeller(options: {
  search: string;
  storedSlug: string | null;
  sellers: PartnerProfile[];
  defaultSlug: string;
}): PartnerProfile | null {
  const activeSellers = options.sellers.filter((seller) => seller.isActive);
  if (activeSellers.length === 0) return null;

  const findBySlug = (slug: string | null | undefined) => {
    const normalized = normalizeSellerSlug(slug);
    if (!normalized) return undefined;
    return activeSellers.find((seller) => seller.sellerSlug === normalized);
  };

  return (
    findBySlug(parseSellerSlugFromSearch(options.search)) ??
    findBySlug(options.storedSlug) ??
    findBySlug(options.defaultSlug) ??
    activeSellers[0] ??
    null
  );
}

/**
 * Generates a shareable catalog URL pre-attributed to a specific seller.
 */
export function buildShareableCatalogUrl(origin: string, sellerSlug: string): string {
  const cleanOrigin = origin.replace(/\/+$/, '');
  const validSlug = normalizeSellerSlug(sellerSlug) ?? 'nahuel';
  return `${cleanOrigin}/?v=${encodeURIComponent(validSlug)}`;
}

/**
 * Builds a wa.me deep link from a partner WhatsApp number and pre-filled message.
 */
export function buildWhatsAppUrl(phone: string, message: string): string {
  const digits = phone.replace(/\D/g, '');
  return `https://wa.me/${digits}?text=${encodeURIComponent(message)}`;
}
