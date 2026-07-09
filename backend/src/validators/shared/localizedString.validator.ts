import { z } from 'zod';

// Ko'p tilli matn maydoni: {uz, ru?, kaa?, en?}. `uz` doim majburiy — boshqa
// tillar hali tarjima qilinmagan bo'lsa bo'sh qoldiriladi (ochiq API'da
// backend/src/utils/localizedField.ts pickLocale() orqali uz'ga qaytadi).
export function localizedString(minLength = 1, message = 'Matn majburiy') {
  return z.object({
    uz: z.string().min(minLength, message),
    ru: z.string().optional(),
    kaa: z.string().optional(),
    en: z.string().optional(),
  });
}

// Nullish (ixtiyoriy) maydonlar uchun standart minLength=0 — bu ularning
// oldingi z.string().optional()/.nullish() (minLengthsiz) xatti-harakatiga mos keladi.
export function localizedStringNullish(minLength = 0, message = 'Matn majburiy') {
  return localizedString(minLength, message).nullish();
}

export type LocalizedStringInput = z.infer<ReturnType<typeof localizedString>>;
