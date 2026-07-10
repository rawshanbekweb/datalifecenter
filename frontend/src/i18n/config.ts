// 4 tilning to'liq ro'yxati — backend har doim shularni qabul qiladi.
export const SUPPORTED_LOCALES = ['uz', 'ru', 'kaa', 'en'] as const;
export type Locale = (typeof SUPPORTED_LOCALES)[number];
export const DEFAULT_LOCALE: Locale = 'uz';

// Foydalanuvchiga ko'rinadigan (tanlash mumkin) tillar — ketma-ket rollout shu
// massivni o'zgartirish orqali amalga oshadi ('kaa' tarjimasi tayyor bo'lganda qo'shiladi).
export const ENABLED_LOCALES: Locale[] = ['uz', 'ru', 'en'];

export const LOCALE_LABELS: Record<Locale, string> = {
  uz: "O'zbekcha",
  ru: 'Русский',
  kaa: 'Qaraqalpaqsha',
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
