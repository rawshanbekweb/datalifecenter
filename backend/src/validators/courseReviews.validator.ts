import { z } from 'zod';

export const upsertReviewSchema = z.object({
  rating: z.coerce.number().int().min(1, 'Reyting 1 dan 5 gacha bo\'lishi kerak').max(5),
  comment: z.string().min(5, "Sharh kamida 5 ta belgidan iborat bo'lishi kerak").max(1000),
});

export const setReviewPublishedSchema = z.object({
  published: z.boolean(),
});

export const listReviewsAdminQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
});
