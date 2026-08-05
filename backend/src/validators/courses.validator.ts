import { z } from 'zod';
import { localizedString, localizedStringNullish } from './shared/localizedString.validator';

export const listCoursesQuerySchema = z.object({
  level: z.enum(['BEGINNER', 'INTERMEDIATE', 'ADVANCED']).optional(),
  isFree: z.enum(['true', 'false']).optional(),
  search: z.string().optional(),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(50).default(12),
});

/**
 * Kursning mentorlari. Yuborilmasa ro'yxat tegilmaydi; bo'sh massiv esa
 * "mentor biriktirilmagan" degani. Birinchi element asosiy mentor bo'ladi.
 */
const courseMentorIds = z.array(z.string()).optional();

export const createCourseSchema = z.object({
  title: localizedString(2, "Sarlavha kamida 2 ta belgidan iborat bo'lishi kerak"),
  subtitle: localizedStringNullish(),
  description: localizedString(5, "Tavsif kamida 5 ta belgidan iborat bo'lishi kerak"),
  iconKey: z.string().default('BookOpen'),
  color: z.string().default('#0ea5e9'),
  bg: z.string().default('#f0f9ff'),
  border: z.string().default('#bae6fd'),
  price: z.coerce.number().min(0).default(0),
  currency: z.string().default('UZS'),
  durationMonths: z.coerce.number().int().min(1),
  level: z.enum(['BEGINNER', 'INTERMEDIATE', 'ADVANCED']).default('BEGINNER'),
  // Kurs qaysi shaklda o'tiladi; HYBRID — ikkalasi ham mavjud
  format: z.enum(['ONLINE', 'OFFLINE', 'HYBRID']).default('ONLINE'),
  // Offline mashg'ulot manzili
  location: localizedStringNullish(),
  tags: z.array(z.string()).default([]),
  published: z.boolean().default(false),
  // Yangi kurs odatda darhol qabul qiladi; yopish admin panelidan bir tugma.
  // Ikkita alohida bayroq — HYBRID kursda onlayn va offline qabul mustaqil.
  onlineEnrollmentOpen: z.boolean().default(true),
  offlineEnrollmentOpen: z.boolean().default(true),
  mentorIds: courseMentorIds,
});

// DIQQAT: createCourseSchema.partial() ishlatib bo'lmaydi — zod .partial()da ham
// .default() qiymatlar qo'llanadi va qisman PUT yuborilganda qolgan maydonlar
// default'ga qaytib ketadi (published:false bo'lib kurs ro'yxatdan yo'qoladi).
export const updateCourseSchema = z.object({
  title: localizedString(2, "Sarlavha kamida 2 ta belgidan iborat bo'lishi kerak").optional(),
  subtitle: localizedStringNullish(),
  description: localizedString(5, "Tavsif kamida 5 ta belgidan iborat bo'lishi kerak").optional(),
  iconKey: z.string().optional(),
  color: z.string().optional(),
  bg: z.string().optional(),
  border: z.string().optional(),
  price: z.coerce.number().min(0).optional(),
  currency: z.string().optional(),
  durationMonths: z.coerce.number().int().min(1).optional(),
  level: z.enum(['BEGINNER', 'INTERMEDIATE', 'ADVANCED']).optional(),
  format: z.enum(['ONLINE', 'OFFLINE', 'HYBRID']).optional(),
  location: localizedStringNullish(),
  tags: z.array(z.string()).optional(),
  published: z.boolean().optional(),
  onlineEnrollmentOpen: z.boolean().optional(),
  offlineEnrollmentOpen: z.boolean().optional(),
  mentorIds: courseMentorIds,
});
