import { z } from 'zod';

export const listBlogQuerySchema = z.object({
  category: z.string().optional(),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(50).default(12),
});

export const createBlogPostSchema = z.object({
  title: z.string().min(2, "Sarlavha kamida 2 ta belgidan iborat bo'lishi kerak"),
  excerpt: z.string().min(5, "Qisqacha mazmun kamida 5 ta belgidan iborat bo'lishi kerak"),
  content: z.string().min(10, "Matn kamida 10 ta belgidan iborat bo'lishi kerak"),
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

export const updateBlogPostSchema = createBlogPostSchema.partial();
