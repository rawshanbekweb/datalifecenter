import { z } from 'zod';
import { NORMALIZED_PHONE_RE, normalizePhone } from '../../utils/phone';

/**
 * Ixtiyoriy telefon raqami. Bo'sh satr va `null` — ikkisi ham `null` ga
 * aylanadi, qolgani `normalizePhone` bilan bitta ko'rinishga keltiriladi.
 *
 * Bazada normallashgan holda saqlanishi `auth.service`dagi "bitta raqamga
 * nechta hisob" cheklovining asosi — aks holda bo'sh joy qo'shib cheklovni
 * chetlab o'tish mumkin bo'lardi.
 *
 * `.optional()` ENG TASHQARIDA turishi shart: shundagina maydon so'rovda
 * bo'lmasa natijada ham chiqmaydi. Aks holda `PATCH /auth/me` bilan faqat ism
 * yuborilganda `phone: null` qo'shilib, mavjud raqam o'chib ketardi.
 */
export const optionalPhone = z
  .string()
  .nullable()
  .transform((v) => (v === null ? '' : normalizePhone(v)))
  .refine((v) => v === '' || NORMALIZED_PHONE_RE.test(v), "Telefon raqami noto'g'ri")
  .transform((v) => (v === '' ? null : v))
  .optional();
