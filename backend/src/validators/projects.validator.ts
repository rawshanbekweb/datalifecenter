import { z } from 'zod';

export const createProjectSchema = z.object({
  title: z.string().min(2, "Sarlavha kamida 2 ta belgidan iborat bo'lishi kerak"),
  category: z.string().min(1, 'Kategoriya kerak'),
  description: z.string().min(10, "Tavsif kamida 10 ta belgidan iborat bo'lishi kerak").max(500),
  techStack: z.array(z.string().min(1)).min(1, "Kamida bitta texnologiya kerak").max(8),
  screenshotUrl: z.string().min(1, 'Skrinshot manzili kerak'),
  liveUrl: z.string().optional(),
  repoUrl: z.string().optional(),
  order: z.coerce.number().int().default(0),
  featured: z.boolean().default(false),
  published: z.boolean().default(true),
});

// .partial() emas — default'li maydonlar (order, featured, published) qisman so'rovda qayta yozilib ketmasligi uchun
export const updateProjectSchema = z.object({
  title: z.string().min(2).optional(),
  category: z.string().min(1).optional(),
  description: z.string().min(10).max(500).optional(),
  techStack: z.array(z.string().min(1)).min(1).max(8).optional(),
  screenshotUrl: z.string().min(1).optional(),
  liveUrl: z.string().optional(),
  repoUrl: z.string().optional(),
  order: z.coerce.number().int().optional(),
  featured: z.boolean().optional(),
  published: z.boolean().optional(),
});
