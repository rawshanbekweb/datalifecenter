// 4 tilning to'liq ro'yxati — backend har doim shularni qabul qiladi.
export const SUPPORTED_LOCALES = ['uz', 'ru', 'kaa', 'en'] as const;
export type Locale = (typeof SUPPORTED_LOCALES)[number];
/**
 * Saytning ASOSIY tili — prefikssiz manzil (datalife.uz/courses) shu tilda
 * ochiladi, qolganlari prefiks bilan (/uz/courses, /ru/courses).
 * Interfeys tarjimasida yetishmagan kalit ham shu tildan olinadi.
 */
export const DEFAULT_LOCALE: Locale = 'kaa';

/**
 * BAZADAGI kontentning tayanch tili — DEFAULT_LOCALE bilan chalkashtirmang.
 *
 * Bu boshqa narsa: backend validatorida ko'p tilli maydonning `uz` kaliti
 * MAJBURIY, tarjima yo'q bo'lsa kontent `uz` ga qaytadi va kurs/blog slug'lari
 * `title.uz` dan yasaladi (backend/src/utils/localizedField.ts, slugify).
 * Shuning uchun admin formasida "asosiy" (majburiy) tab shu til bo'lib qoladi,
 * sayt interfeysi qaysi tilda ochilishidan qat'i nazar.
 */
export const CONTENT_BASE_LOCALE: Locale = 'uz';

// Foydalanuvchiga ko'rinadigan (tanlash mumkin) tillar — ketma-ket rollout shu
// massivni o'zgartirish orqali amalga oshadi.
export const ENABLED_LOCALES: Locale[] = ['uz', 'ru', 'kaa', 'en'];

// Har bir til o'z tilida (endonim) — til tanlagichda hech qachon tarjima
// qilinmaydi, aks holda foydalanuvchi o'z tilini topa olmaydi.
export const LOCALE_LABELS: Record<Locale, string> = {
  uz: "O'zbekcha",
  ru: 'Русский',
  kaa: 'Qaraqalpaqsha',
  en: 'English',
};

// Faqat aria-label / title uchun — kirill yoki notanish yozuvdagi variantni
// screen reader va tooltip'da tushunarli qiladi.
export const LOCALE_ENGLISH_LABELS: Record<Locale, string> = {
  uz: 'Uzbek',
  ru: 'Russian',
  kaa: 'Karakalpak',
  en: 'English',
};

// Intl (sana/son formatlash) uchun BCP-47 teglar. kaa uchun brauzerlarda
// ma'lumot yo'q — pragmatik ravishda uz-UZ ishlatiladi.
export const LOCALE_BCP47: Record<Locale, string> = {
  uz: 'uz-UZ',
  ru: 'ru-RU',
  kaa: 'uz-UZ',
  en: 'en-US',
};
