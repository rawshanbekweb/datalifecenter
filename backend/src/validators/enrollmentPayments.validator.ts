import { z } from 'zod';

export const addPaymentSchema = z.object({
  amount: z.coerce.number().positive("To'lov summasi noldan katta bo'lishi kerak"),
  method: z.enum(['CASH', 'CARD', 'TRANSFER', 'ONLINE', 'OTHER']).optional(),
  // Pul haqiqatda kelgan sana — yozuv keyinroq kiritilishi mumkin
  paidAt: z.coerce.date({ message: "To'lov sanasi noto'g'ri" }).optional(),
  note: z.string().trim().max(300).nullish(),
});

export const listDebtorsQuerySchema = z.object({
  courseId: z.string().optional(),
  groupId: z.string().optional(),
  search: z.string().optional(),
});
