import { z } from 'zod';
import { localizedString } from './shared/localizedString.validator';
import { imageFocusFields } from './shared/imageFocus.validator';

// Sana faqat kun aniqligida yuboriladi ("2026-08-03") yoki bo'sh qoldiriladi.
// Bo'sh satr `null` ga aylantiriladi — HTML `<input type="date">` tozalanganda
// aynan bo'sh satr yuboradi va u Date'ga aylantirilsa Invalid Date bo'lardi.
const happenedAt = z
  .union([z.string(), z.null()])
  .optional()
  .transform((v) => (v === '' || v == null ? null : new Date(v)))
  .refine((d) => d === null || !Number.isNaN(d.getTime()), { message: "Sana noto'g'ri" });

export const createMomentSchema = z.object({
  imageUrl: z.string().min(1, 'Rasm kerak'),
  ...imageFocusFields,
  title: localizedString(2, "Sarlavha kamida 2 ta belgidan iborat bo'lishi kerak"),
  caption: localizedString(0).nullish(),
  happenedAt,
  order: z.coerce.number().int().default(0),
  published: z.boolean().default(true),
});

// .partial() emas — default'li maydonlar (order, published) qisman so'rovda
// qayta yozilib ketmasligi uchun har biri alohida optional qilinadi
export const updateMomentSchema = z.object({
  imageUrl: z.string().min(1).optional(),
  ...imageFocusFields,
  title: localizedString(2, "Sarlavha kamida 2 ta belgidan iborat bo'lishi kerak").optional(),
  caption: localizedString(0).nullish(),
  happenedAt,
  order: z.coerce.number().int().optional(),
  published: z.boolean().optional(),
});
