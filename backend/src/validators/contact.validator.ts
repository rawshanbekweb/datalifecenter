import { z } from 'zod';

// Yuqori chegaralar ATAYIN qo'yilgan: forma ochiq (login talab qilmaydi),
// chegarasiz maydonlar esa bitta so'rovda o'n minglab belgi yuborib bazani
// shishirish imkonini berardi. Raqamlar haqiqiy foydalanish uchun keng.
export const contactMessageSchema = z.object({
  name: z.string().min(2, "Ism kamida 2 ta belgidan iborat bo'lishi kerak").max(100, 'Ism juda uzun'),
  email: z.email("Email noto'g'ri").max(200, 'Email juda uzun'),
  phone: z.string().max(30, 'Telefon raqami juda uzun').optional(),
  subject: z.string().max(200, 'Mavzu juda uzun').optional(),
  message: z.string().min(5, "Xabar kamida 5 ta belgidan iborat bo'lishi kerak").max(5000, 'Xabar juda uzun'),
});

export const updateContactMessageStatusSchema = z.object({
  status: z.enum(['NEW', 'READ', 'REPLIED', 'ARCHIVED']),
});

export const listContactMessagesQuerySchema = z.object({
  status: z.enum(['NEW', 'READ', 'REPLIED', 'ARCHIVED']).optional(),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
});
