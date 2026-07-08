import { z } from 'zod';

export const createMentorSchema = z.object({
  name: z.string().min(2, "Ism kamida 2 ta belgidan iborat bo'lishi kerak"),
  bio: z.string().min(5, "Bio kamida 5 ta belgidan iborat bo'lishi kerak"),
  specialty: z.string().min(2, "Soha kiritilishi shart"),
  photoUrl: z.string().optional(),
  position: z.string().optional(),
  linkedinUrl: z.string().optional(),
  githubUrl: z.string().optional(),
  telegramUrl: z.string().optional(),
  featured: z.boolean().default(false),
  order: z.coerce.number().int().default(0),
  userId: z.string().nullish().or(z.literal('').transform(() => null)),
});

// Mentor o'z profilini tahrirlaydi — featured/order/userId kabi admin maydonlariga tegmaydi
export const updateMentorMeSchema = z.object({
  name: z.string().min(2, "Ism kamida 2 ta belgidan iborat bo'lishi kerak").optional(),
  bio: z.string().min(5, "Bio kamida 5 ta belgidan iborat bo'lishi kerak").optional(),
  specialty: z.string().min(2, 'Soha kiritilishi shart').optional(),
  photoUrl: z.string().optional(),
  position: z.string().optional(),
  linkedinUrl: z.string().optional(),
  githubUrl: z.string().optional(),
  telegramUrl: z.string().optional(),
});

// .partial() emas — default'li maydonlar (featured, order) qisman so'rovda qayta yozilib ketmasligi uchun
export const updateMentorSchema = z.object({
  name: z.string().min(2, "Ism kamida 2 ta belgidan iborat bo'lishi kerak").optional(),
  bio: z.string().min(5, "Bio kamida 5 ta belgidan iborat bo'lishi kerak").optional(),
  specialty: z.string().min(2, 'Soha kiritilishi shart').optional(),
  photoUrl: z.string().optional(),
  position: z.string().optional(),
  linkedinUrl: z.string().optional(),
  githubUrl: z.string().optional(),
  telegramUrl: z.string().optional(),
  featured: z.boolean().optional(),
  order: z.coerce.number().int().optional(),
  userId: z.string().nullish().or(z.literal('').transform(() => null)),
});
