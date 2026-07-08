import { z } from 'zod';

export const createTestimonialSchema = z.object({
  name: z.string().min(2, "Ism kamida 2 ta belgidan iborat bo'lishi kerak"),
  role: z.string().min(1, 'Lavozim/tavsif kerak'),
  avatarUrl: z.string().optional(),
  text: z.string().min(10, "Sharh matni kamida 10 ta belgidan iborat bo'lishi kerak").max(1000),
  rating: z.coerce.number().int().min(1).max(5).default(5),
  published: z.boolean().default(true),
  order: z.coerce.number().int().default(0),
});

// .partial() emas — default'li maydonlar (rating, published, order) qisman so'rovda qayta yozilib ketmasligi uchun
export const updateTestimonialSchema = z.object({
  name: z.string().min(2).optional(),
  role: z.string().min(1).optional(),
  avatarUrl: z.string().optional(),
  text: z.string().min(10).max(1000).optional(),
  rating: z.coerce.number().int().min(1).max(5).optional(),
  published: z.boolean().optional(),
  order: z.coerce.number().int().optional(),
});
