import { z } from 'zod';

export const listSubscriptionsAdminQuerySchema = z.object({
  status: z.enum(['PENDING', 'ACTIVE', 'EXPIRED', 'CANCELLED', 'REJECTED']).optional(),
  search: z.string().optional(),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
});

export const submitSubscriptionReceiptSchema = z.object({
  receiptUrl: z.string().min(1, 'receiptUrl kerak').max(500),
});

export const updateSubscriptionAdminSchema = z
  .object({
    status: z.enum(['ACTIVE', 'REJECTED', 'CANCELLED']),
    rejectionReason: z.string().min(1, 'Rad etish sababi kerak').max(500).optional(),
  })
  .refine((data) => data.status !== 'REJECTED' || !!data.rejectionReason, {
    message: "Rad etishda sabab ko'rsatilishi shart",
    path: ['rejectionReason'],
  });
