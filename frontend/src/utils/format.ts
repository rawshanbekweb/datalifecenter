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

export function formatTime(value: string | Date, options?: Intl.DateTimeFormatOptions): string {
  return new Date(value).toLocaleTimeString(bcp47(), options ?? { hour: '2-digit', minute: '2-digit' });
}
