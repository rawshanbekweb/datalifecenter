import { z } from 'zod';

export const createCheckoutSchema = z.object({
  enrollmentId: z.string().min(1, 'enrollmentId kerak'),
  provider: z.enum(['click', 'payme'], { message: "provider 'click' yoki 'payme' bo'lishi kerak" }),
});
