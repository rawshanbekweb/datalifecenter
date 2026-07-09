import { Locale } from '../i18n/config';

// Backenddagi LocalizedString bilan bir xil shakl: {uz, ru?, kaa?, en?}
export type LocalizedString = { uz: string } & Partial<Record<Exclude<Locale, 'uz'>, string>>;

export function emptyLocalizedString(): LocalizedString {
  return { uz: '' };
}
