import { DEFAULT_LOCALE, ENABLED_LOCALES, Locale } from './config';

// URL'ning birinchi segmentidan localeni aniqlaydi (masalan /ru/courses -> ru).
// Faqat ENABLED_LOCALES'dagi (yoqilgan) tillar tan olinadi — hali yoqilmagan
// prefiks (masalan Stage 3'dan oldin /en) o'zbekchaga tushadi.
export function detectLocale(pathname: string = window.location.pathname): { locale: Locale; basename: string } {
  const segment = pathname.split('/')[1];
  if (segment && (ENABLED_LOCALES as string[]).includes(segment)) {
    return { locale: segment as Locale, basename: `/${segment}` };
  }
  return { locale: DEFAULT_LOCALE, basename: '' };
}
