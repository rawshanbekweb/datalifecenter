import { z } from 'zod';

export const createPartnerSchema = z.object({
  name: z.string().min(2, "Nom kamida 2 ta belgidan iborat bo'lishi kerak"),
  logoUrl: z.string().min(1, 'Logotip manzili kerak'),
  websiteUrl: z.string().optional(),
  category: z.string().min(1, 'Kategoriya kerak'),
  featured: z.boolean().default(false),
  order: z.coerce.number().int().default(0),
});

// .partial() emas — default'li maydonlar (featured, order) qisman so'rovda qayta yozilib ketmasligi uchun
export const updatePartnerSchema = z.object({
  name: z.string().min(2, "Nom kamida 2 ta belgidan iborat bo'lishi kerak").optional(),
  logoUrl: z.string().min(1, 'Logotip manzili kerak').optional(),
  websiteUrl: z.string().optional(),
  category: z.string().min(1, 'Kategoriya kerak').optional(),
  featured: z.boolean().optional(),
  order: z.coerce.number().int().optional(),
});
