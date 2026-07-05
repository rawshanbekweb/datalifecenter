import { z } from 'zod';

export const listUsersQuerySchema = z.object({
  role: z.enum(['STUDENT', 'MENTOR', 'ADMIN']).optional(),
  search: z.string().optional(),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
});

export const updateUserRoleSchema = z.object({
  role: z.enum(['STUDENT', 'MENTOR', 'ADMIN'], { message: "Rol noto'g'ri" }),
});
