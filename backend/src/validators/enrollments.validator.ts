import { z } from 'zod';

export const createEnrollmentSchema = z.object({
  courseId: z.string().min(1, "courseId kerak"),
});

export const listEnrollmentsAdminQuerySchema = z.object({
  status: z.enum(['PENDING', 'ACTIVE', 'COMPLETED', 'CANCELLED']).optional(),
  paymentStatus: z.enum(['FREE', 'UNPAID', 'PARTIAL', 'PENDING', 'PAID', 'REJECTED', 'REFUNDED']).optional(),
  // Offline guruhni alohida ko'rish uchun — markazda o'qiydiganlar ro'yxati
  format: z.enum(['ONLINE', 'OFFLINE']).optional(),
  // Guruhga a'zo qo'shishda: shu kursning yozilganlari orasidan tanlanadi
  courseId: z.string().optional(),
  search: z.string().optional(),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
});

export const submitReceiptSchema = z.object({
  receiptUrl: z.string().min(1, 'receiptUrl kerak').max(500),
});

export const updateEnrollmentAdminSchema = z
  .object({
    status: z.enum(['PENDING', 'ACTIVE', 'COMPLETED', 'CANCELLED']).optional(),
    // FREE/UNPAID/PARTIAL bu yerda YO'Q: ular to'lov daftaridan hosil bo'ladi
    // (enrollmentPayments.service.ts) va qo'lda yozilsa yig'indi bilan
    // ajralib ketardi. Admin faqat chek oqimining holatlarini qo'yadi.
    paymentStatus: z.enum(['PENDING', 'PAID', 'REJECTED', 'REFUNDED']).optional(),
    rejectionReason: z.string().min(1, 'Rad etish sababi kerak').max(500).optional(),
  })
  .refine((data) => data.status !== undefined || data.paymentStatus !== undefined, {
    message: "Kamida bitta maydon (status yoki paymentStatus) yuborilishi kerak",
  })
  .refine((data) => data.paymentStatus !== 'REJECTED' || !!data.rejectionReason, {
    message: "To'lovni rad etishda sabab ko'rsatilishi shart",
    path: ['rejectionReason'],
  });
