import { DEFAULT_LOCALE, ENABLED_LOCALES, Locale } from './config';

// URL'ning birinchi segmentidan localeni aniqlaydi (masalan /ru/courses -> ru).
// Faqat ENABLED_LOCALES'dagi (yoqilgan) tillar tan olinadi — hali yoqilmagan
// prefiks (masalan Stage 3'dan oldin /en) o'zbekchaga tushadi.
export function detectLocale(pathname: string = window.location.pathname): { locale: Locale; basename: string } {
  const segment = pathname.split('/')[1];
  if (segment && (ENABLED_LOCALES as string[]).includes(segment)) {
    // Asosiy tilning prefiksli manzili YO'Q: /kaa/courses va /courses bir xil
    // sahifa bo'lib, Google uchun ikki nusxa bo'lardi. Prefiks tashlanadi va
    // manzil prefikssiz shaklga birlashtiriladi (canonicalRedirect).
    if (segment === DEFAULT_LOCALE) {
      return { locale: DEFAULT_LOCALE, basename: '' };
    }
    return { locale: segment as Locale, basename: `/${segment}` };
  }
  return { locale: DEFAULT_LOCALE, basename: '' };
}

/**
 * Asosiy til prefiksi bilan kelgan manzilni prefikssiz shaklga almashtiradi
 * (/kaa/courses -> /courses). `history.replaceState` — brauzer tarixida ortiqcha
 * yozuv qoldirmaydi va sahifa qayta yuklanmaydi.
 *
 * Bu ilova mount bo'lishidan OLDIN chaqirilishi kerak: router shu paytda
 * yaratilgan basename bilan ishlaydi, keyin URL o'zgarsa mos kelmay qolardi.
 */
export function canonicalizeDefaultLocalePath(): void {
  const { pathname, search, hash } = window.location;
  const segment = pathname.split('/')[1];
  if (segment !== DEFAULT_LOCALE) return;
  const rest = pathname.slice(`/${DEFAULT_LOCALE}`.length) || '/';
  window.history.replaceState(null, '', `${rest}${search}${hash}`);
}
