import { z } from 'zod';

export const listCoursesQuerySchema = z.object({
  level: z.enum(['BEGINNER', 'INTERMEDIATE', 'ADVANCED']).optional(),
  isFree: z.enum(['true', 'false']).optional(),
  search: z.string().optional(),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(50).default(12),
});

export const createCourseSchema = z.object({
  title: z.string().min(2, "Sarlavha kamida 2 ta belgidan iborat bo'lishi kerak"),
  subtitle: z.string().optional(),
  description: z.string().min(5, "Tavsif kamida 5 ta belgidan iborat bo'lishi kerak"),
  iconKey: z.string().default('BookOpen'),
  color: z.string().default('#0ea5e9'),
  bg: z.string().default('#f0f9ff'),
  border: z.string().default('#bae6fd'),
  price: z.coerce.number().min(0).default(0),
  currency: z.string().default('UZS'),
  durationMonths: z.coerce.number().int().min(1),
  level: z.enum(['BEGINNER', 'INTERMEDIATE', 'ADVANCED']).default('BEGINNER'),
  tags: z.array(z.string()).default([]),
  published: z.boolean().default(false),
  mentorId: z.string().nullable().optional(),
});

export const updateCourseSchema = createCourseSchema.partial();
