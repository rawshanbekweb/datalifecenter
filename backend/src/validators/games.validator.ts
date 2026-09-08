import { z } from 'zod';
import { localizedString } from './shared/localizedString.validator';

export const createGameSchema = z.object({
  title: localizedString(2, "Sarlavha kamida 2 ta belgidan iborat bo'lishi kerak"),
  description: localizedString(10, "Tavsif kamida 10 ta belgidan iborat bo'lishi kerak"),
  logoUrl: z.string().min(1, 'Logotip manzili kerak'),
  apkUrl: z.string().min(1, 'APK fayl manzili kerak'),
  version: z.string().min(1, 'Versiya kerak'),
  apkSizeBytes: z.coerce.number().int().positive().optional(),
  order: z.coerce.number().int().default(0),
  featured: z.boolean().default(false),
  published: z.boolean().default(true),
});

// .partial() emas — default'li maydonlar (order, featured, published) qisman so'rovda qayta yozilib ketmasligi uchun
export const updateGameSchema = z.object({
  title: localizedString(2, "Sarlavha kamida 2 ta belgidan iborat bo'lishi kerak").optional(),
  description: localizedString(10, "Tavsif kamida 10 ta belgidan iborat bo'lishi kerak").optional(),
  logoUrl: z.string().min(1).optional(),
  apkUrl: z.string().min(1).optional(),
  version: z.string().min(1).optional(),
  apkSizeBytes: z.coerce.number().int().positive().optional(),
  order: z.coerce.number().int().optional(),
  featured: z.boolean().optional(),
  published: z.boolean().optional(),
});
