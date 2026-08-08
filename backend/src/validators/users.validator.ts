import { z } from 'zod';

export const listUsersQuerySchema = z.object({
  role: z.enum(['STUDENT', 'MENTOR', 'TEAM', 'ADMIN']).optional(),
  search: z.string().optional(),
  // Query satrida "true"/"false" bo'lib keladi; berilmasa filtr qo'llanmaydi
  verified: z
    .enum(['true', 'false'])
    .optional()
    .transform((v) => (v === undefined ? undefined : v === 'true')),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
});

export const updateUserRoleSchema = z.object({
  role: z.enum(['STUDENT', 'MENTOR', 'TEAM', 'ADMIN'], { message: "Rol noto'g'ri" }),
});

export const setUserBlockedSchema = z.object({
  blocked: z.boolean({ message: 'blocked qiymati boolean bo\'lishi kerak' }),
});
