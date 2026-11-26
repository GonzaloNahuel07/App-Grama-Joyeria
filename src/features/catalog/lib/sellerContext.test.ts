import { describe, expect, it } from 'vitest';
import type { PartnerProfile } from '../../../shared/types/domain';
import {
  buildShareableCatalogUrl,
  buildWhatsAppUrl,
  parseSellerSlugFromSearch,
  resolveActiveSeller,
} from './sellerContext';

const PARTNERS: PartnerProfile[] = [
  {
    id: 'p-1',
    fullName: 'Gonzalo',
    sellerSlug: 'gonzalo',
    whatsappNumber: '+54 9 11 5555-1111',
    role: 'owner',
    isActive: true,
  },
  {
    id: 'p-2',
    fullName: 'Hermana',
    sellerSlug: 'hermana',
    whatsappNumber: '+54 9 11 5555-2222',
    role: 'partner',
    isActive: true,
  },
];

describe('sellerContext', () => {
  it('parses valid seller slugs from ?v= and ?vendedor= query parameters', () => {
    expect(parseSellerSlugFromSearch('?v=Hermana')).toBe('hermana');
    expect(parseSellerSlugFromSearch('?vendedor=gonzalo')).toBe('gonzalo');
    expect(parseSellerSlugFromSearch('?v=invalid slug!')).toBeNull();
    expect(parseSellerSlugFromSearch('')).toBeNull();
  });

  it('prioritizes query string over stored slug and default slug', () => {
    const resolved = resolveActiveSeller({
      search: '?v=hermana',
      storedSlug: 'gonzalo',
      sellers: PARTNERS,
      defaultSlug: 'gonzalo',
    });
    expect(resolved?.sellerSlug).toBe('hermana');
  });

  it('falls back to stored slug and then default slug when query is absent', () => {
    expect(
      resolveActiveSeller({
        search: '',
        storedSlug: 'hermana',
        sellers: PARTNERS,
        defaultSlug: 'gonzalo',
      })?.sellerSlug,
    ).toBe('hermana');

    expect(
      resolveActiveSeller({
        search: '',
        storedSlug: 'inexistente',
        sellers: PARTNERS,
        defaultSlug: 'gonzalo',
      })?.sellerSlug,
    ).toBe('gonzalo');
  });

  it('builds shareable catalog links and sanitized WhatsApp URLs', () => {
    expect(buildShareableCatalogUrl('https://grama.app/', 'Hermana')).toBe(
      'https://grama.app/?v=hermana',
    );
    expect(buildWhatsAppUrl('+54 9 11 5555-2222', 'Hola!')).toBe(
      'https://wa.me/5491155552222?text=Hola!',
    );
  });
});
