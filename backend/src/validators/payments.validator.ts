import { z } from 'zod';

export const createCheckoutSchema = z
  .object({
    enrollmentId: z.string().min(1).optional(),
    subscriptionId: z.string().min(1).optional(),
    provider: z.enum(['click', 'payme'], { message: "provider 'click' yoki 'payme' bo'lishi kerak" }),
  })
  .refine((v) => Boolean(v.enrollmentId) !== Boolean(v.subscriptionId), {
    message: 'enrollmentId yoki subscriptionId dan aynan bittasi berilishi kerak',
  });
