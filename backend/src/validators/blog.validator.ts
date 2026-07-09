import { z } from 'zod';
import { localizedString } from './shared/localizedString.validator';

export const listBlogQuerySchema = z.object({
  category: z.string().optional(),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(50).default(12),
});

export const createBlogPostSchema = z.object({
  title: localizedString(2, "Sarlavha kamida 2 ta belgidan iborat bo'lishi kerak"),
  excerpt: localizedString(5, "Qisqacha mazmun kamida 5 ta belgidan iborat bo'lishi kerak"),
  content: localizedString(10, "Matn kamida 10 ta belgidan iborat bo'lishi kerak"),
  category: z.string().min(1, 'Kategoriya kerak'),
  iconKey: z.string().default('BookOpen'),
  color: z.string().default('#0ea5e9'),
  bg: z.string().default('#f0f9ff'),
  border: z.string().default('#bae6fd'),
  readMinutes: z.coerce.number().int().min(1).default(5),
  tags: z.array(z.string()).default([]),
  published: z.boolean().default(false),
  mentorId: z.string().nullable().optional(),
});

// .partial() emas — default'li maydonlar (published, tags, ranglar) qisman so'rovda qayta yozilib ketmasligi uchun
export const updateBlogPostSchema = z.object({
  title: localizedString(2, "Sarlavha kamida 2 ta belgidan iborat bo'lishi kerak").optional(),
  excerpt: localizedString(5, "Qisqacha mazmun kamida 5 ta belgidan iborat bo'lishi kerak").optional(),
  content: localizedString(10, "Matn kamida 10 ta belgidan iborat bo'lishi kerak").optional(),
  category: z.string().min(1, 'Kategoriya kerak').optional(),
  iconKey: z.string().optional(),
  color: z.string().optional(),
  bg: z.string().optional(),
  border: z.string().optional(),
  readMinutes: z.coerce.number().int().min(1).optional(),
  tags: z.array(z.string()).optional(),
  published: z.boolean().optional(),
  mentorId: z.string().nullable().optional(),
});
