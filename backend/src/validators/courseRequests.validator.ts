import { z } from 'zod';

// O'zbekiston raqamlari uchun keng shakl: +998 90 123 45 67, 901234567 va h.k.
const phone = z
  .string()
  .trim()
  .min(7, 'Telefon raqami noto‘g‘ri')
  .max(25, 'Telefon raqami noto‘g‘ri')
  .regex(/^[+0-9\s()-]+$/, 'Telefon raqamida faqat raqam va + ( ) - belgilari bo‘lishi mumkin');

export const createCourseRequestSchema = z.object({
  courseId: z.string().min(1, 'Kurs tanlanishi kerak'),
  // HYBRID yuborilmaydi — o'quvchi aniq bittasini tanlashi kerak
  format: z.enum(['ONLINE', 'OFFLINE'], { message: 'Format tanlanishi kerak' }),
  name: z.string().trim().min(2, 'Ism kamida 2 ta belgidan iborat bo‘lsin').max(120),
  phone,
  email: z.string().trim().email('Email noto‘g‘ri').max(200).optional().or(z.literal('')),
  note: z.string().trim().max(2000, 'Izoh juda uzun').optional().or(z.literal('')),
});

export const listCourseRequestsQuerySchema = z.object({
  status: z.enum(['NEW', 'CONTACTED', 'ENROLLED', 'REJECTED']).optional(),
  format: z.enum(['ONLINE', 'OFFLINE']).optional(),
  search: z.string().trim().max(120).optional(),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
});

export const updateCourseRequestSchema = z
  .object({
    status: z.enum(['NEW', 'CONTACTED', 'ENROLLED', 'REJECTED']).optional(),
    reply: z.string().trim().max(4000, 'Javob juda uzun').optional(),
  })
  .refine((data) => data.status !== undefined || data.reply !== undefined, {
    message: 'Hech narsa o‘zgartirilmadi',
  });
