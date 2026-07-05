import { z } from 'zod';

export const createEnrollmentSchema = z.object({
  courseId: z.string().min(1, "courseId kerak"),
});

export const listEnrollmentsAdminQuerySchema = z.object({
  status: z.enum(['PENDING', 'ACTIVE', 'COMPLETED', 'CANCELLED']).optional(),
  paymentStatus: z.enum(['FREE', 'UNPAID', 'PENDING', 'PAID', 'REFUNDED']).optional(),
  search: z.string().optional(),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
});

export const updateEnrollmentAdminSchema = z
  .object({
    status: z.enum(['PENDING', 'ACTIVE', 'COMPLETED', 'CANCELLED']).optional(),
    paymentStatus: z.enum(['FREE', 'UNPAID', 'PENDING', 'PAID', 'REFUNDED']).optional(),
  })
  .refine((data) => data.status !== undefined || data.paymentStatus !== undefined, {
    message: "Kamida bitta maydon (status yoki paymentStatus) yuborilishi kerak",
  });
