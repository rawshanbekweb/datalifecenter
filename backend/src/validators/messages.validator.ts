import { z } from 'zod';

// Xabar matni: bo'sh yuborilmasin, lekin uzun izohga ham joy qolsin
const messageBody = z
  .string()
  .trim()
  .min(1, 'Xabar bo‘sh bo‘lmasligi kerak')
  .max(4000, 'Xabar juda uzun (4000 belgidan oshmasin)');

export const sendMessageSchema = z.object({
  body: messageBody,
});

export const startConversationSchema = z
  .object({
    recipientId: z.string().min(1).optional(),
    // Administratsiya kanaliga yozish — aniq qabul qiluvchi ko'rsatilmaydi
    toAdmin: z.boolean().optional(),
    body: messageBody,
  })
  .refine((data) => Boolean(data.recipientId) !== Boolean(data.toAdmin), {
    message: 'Yo qabul qiluvchi, yo administratsiya tanlanishi kerak',
    path: ['recipientId'],
  });
