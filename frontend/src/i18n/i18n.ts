import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import { DEFAULT_LOCALE, Locale } from './config';

// Har bir til fayli alohida chunk — foydalanuvchi faqat o'z tilini (va uz
// fallback'ni) yuklaydi, to'rttala til birdaniga bundle'ga kirmaydi.
// Bu xavfsiz, chunki til almashish to'liq sahifa qayta yuklash orqali bo'ladi
// (LocaleContext.switchLocale) — sahifa umri davomida til o'zgarmaydi.
const LOCALE_LOADERS: Record<Locale, () => Promise<{ default: Record<string, unknown> }>> = {
  uz: () => import('../locales/uz/translation.json'),
  ru: () => import('../locales/ru/translation.json'),
  kaa: () => import('../locales/kaa/translation.json'),
  en: () => import('../locales/en/translation.json'),
};

// Bitta til faylini xavfsiz yuklaydi — chunk kelmasa (tarmoq/eski deploy)
// butun ilovani bloklamaslik uchun bo'sh obyekt qaytaradi
async function loadLocale(locale: Locale): Promise<Record<string, unknown>> {
  try {
    return (await LOCALE_LOADERS[locale]()).default;
  } catch {
    return {};
  }
}

// main.tsx render'dan OLDIN kutadi — aks holda matnlar kalit ko'rinishida chiqadi.
// Hech qachon reject qilmaydi: chunk yuklanmasa ham i18next bo'sh resurs bilan
// init bo'ladi (kalitlar ko'rinadi, lekin sahifa oq qolmaydi).
export async function initI18n(locale: Locale): Promise<void> {
  const [active, fallback] = await Promise.all([
    loadLocale(locale),
    // Faol tilda yetishmagan kalitlar uz'dan olinadi — uz har doim to'liq manba
    locale === DEFAULT_LOCALE ? Promise.resolve<Record<string, unknown>>({}) : loadLocale(DEFAULT_LOCALE),
  ]);

  const resources: Record<string, { translation: Record<string, unknown> }> = {
    [locale]: { translation: active },
  };
  if (locale !== DEFAULT_LOCALE) {
    resources[DEFAULT_LOCALE] = { translation: fallback };
  }

  await i18n.use(initReactI18next).init({
    resources,
    lng: locale,
    fallbackLng: DEFAULT_LOCALE,
    interpolation: { escapeValue: false },
  });
}

export default i18n;
