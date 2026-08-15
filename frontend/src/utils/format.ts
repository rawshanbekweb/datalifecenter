import i18n from '../i18n/i18n';
import { LOCALE_BCP47, DEFAULT_LOCALE, Locale } from '../i18n/config';

// Til to'liq sahifa qayta yuklanishi bilan almashadi (LocaleContext),
// shuning uchun i18n.language sessiya davomida o'zgarmaydi — reaktivlik shart emas.
function bcp47(): string {
  return LOCALE_BCP47[(i18n.language as Locale) ?? DEFAULT_LOCALE] ?? LOCALE_BCP47[DEFAULT_LOCALE];
}

export function formatDate(value: string | Date, options?: Intl.DateTimeFormatOptions): string {
  return new Date(value).toLocaleDateString(bcp47(), options);
}

export function formatNumber(value: number): string {
  return value.toLocaleString(bcp47());
}

/**
 * Pul summasi. Backend Decimal'ni SATR sifatida qaytaradi ("900000.0000...")
 * — aniqlik yo'qolmasligi uchun. Ko'rsatishda kasr qismi keraksiz: narxlar
 * so'mda butun bo'ladi.
 */
export function formatMoney(value: string | number | null | undefined, currency?: string): string {
  const amount = Number(value ?? 0);
  const text = formatNumber(Number.isFinite(amount) ? Math.round(amount) : 0);
  return currency ? `${text} ${currency}` : text;
}

export function formatTime(value: string | Date, options?: Intl.DateTimeFormatOptions): string {
  return new Date(value).toLocaleTimeString(bcp47(), options ?? { hour: '2-digit', minute: '2-digit' });
}

export function formatDateTime(value: string | Date, options?: Intl.DateTimeFormatOptions): string {
  return new Date(value).toLocaleString(bcp47(), options);
}
