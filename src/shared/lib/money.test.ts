import { describe, expect, it } from 'vitest';
import { formatMoney, fromCents, toCents } from './money';

describe('money helpers', () => {
  it('converts decimal amounts to integer cents without floating-point drift', () => {
    expect(toCents(0.1 + 0.2)).toBe(30);
    expect(toCents(19.99)).toBe(1999);
  });

  it('converts integer cents back to decimal amounts', () => {
    expect(fromCents(1999)).toBe(19.99);
    expect(fromCents(0)).toBe(0);
  });

  it('rejects non-finite amounts and non-integer cents', () => {
    expect(() => toCents(Number.NaN)).toThrow(RangeError);
    expect(() => fromCents(12.5)).toThrow(RangeError);
  });

  it('formats cents using the requested currency and locale', () => {
    const formatted = formatMoney(150050, { locale: 'en-US', currency: 'USD' });
    expect(formatted).toBe('$1,500.50');
  });
});
