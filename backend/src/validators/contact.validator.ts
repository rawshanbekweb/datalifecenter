import { z } from 'zod';

export const contactMessageSchema = z.object({
  name: z.string().min(2, "Ism kamida 2 ta belgidan iborat bo'lishi kerak"),
  email: z.email("Email noto'g'ri"),
  phone: z.string().optional(),
  subject: z.string().optional(),
  message: z.string().min(5, "Xabar kamida 5 ta belgidan iborat bo'lishi kerak"),
});

export const updateContactMessageStatusSchema = z.object({
  status: z.enum(['NEW', 'READ', 'REPLIED', 'ARCHIVED']),
});
