/**
 * Converts a decimal currency amount into integer cents to avoid IEEE-754 drift.
 */
export function toCents(amount: number): number {
  if (!Number.isFinite(amount)) {
    throw new RangeError('Amount must be a finite number.');
  }
  return Math.round(amount * 100);
}

/**
 * Converts integer cents back to a decimal currency amount.
 */
export function fromCents(cents: number): number {
  if (!Number.isSafeInteger(cents)) {
    throw new RangeError('Cents must be a safe integer.');
  }
  return cents / 100;
}

/**
 * Formats integer cents as a localized currency string.
 */
export function formatMoney(
  cents: number,
  options: { locale?: string; currency?: string } = {},
): string {
  const { locale = 'es-AR', currency = 'ARS' } = options;
  return new Intl.NumberFormat(locale, {
    style: 'currency',
    currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(fromCents(cents));
}
