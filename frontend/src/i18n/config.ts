// 4 tilning to'liq ro'yxati — backend har doim shularni qabul qiladi.
export const SUPPORTED_LOCALES = ['uz', 'ru', 'kaa', 'en'] as const;
export type Locale = (typeof SUPPORTED_LOCALES)[number];
export const DEFAULT_LOCALE: Locale = 'uz';

// Foydalanuvchiga ko'rinadigan (tanlash mumkin) tillar — ketma-ket rollout shu
// massivni o'zgartirish orqali amalga oshadi (Stage 1'da 'ru' qo'shiladi va h.k.).
export const ENABLED_LOCALES: Locale[] = ['uz'];

export const LOCALE_LABELS: Record<Locale, string> = {
  uz: "O'zbekcha",
  ru: 'Русский',
  kaa: 'Qaraqalpaqsha',
  en: 'English',
};
