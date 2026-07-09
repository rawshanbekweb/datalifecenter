import { z } from 'zod';
import { localizedString } from './shared/localizedString.validator';

export const createTestimonialSchema = z.object({
  name: z.string().min(2, "Ism kamida 2 ta belgidan iborat bo'lishi kerak"),
  role: localizedString(1, 'Lavozim/tavsif kerak'),
  avatarUrl: z.string().optional(),
  text: localizedString(10, "Sharh matni kamida 10 ta belgidan iborat bo'lishi kerak"),
  rating: z.coerce.number().int().min(1).max(5).default(5),
  published: z.boolean().default(true),
  order: z.coerce.number().int().default(0),
});

// .partial() emas — default'li maydonlar (rating, published, order) qisman so'rovda qayta yozilib ketmasligi uchun
export const updateTestimonialSchema = z.object({
  name: z.string().min(2).optional(),
  role: localizedString(1, 'Lavozim/tavsif kerak').optional(),
  avatarUrl: z.string().optional(),
  text: localizedString(10, "Sharh matni kamida 10 ta belgidan iborat bo'lishi kerak").optional(),
  rating: z.coerce.number().int().min(1).max(5).optional(),
  published: z.boolean().optional(),
  order: z.coerce.number().int().optional(),
});
