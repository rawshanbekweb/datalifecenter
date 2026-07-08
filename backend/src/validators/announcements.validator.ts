import { z } from 'zod';

export const createAnnouncementSchema = z.object({
  title: z.string().min(3, "Sarlavha kamida 3 ta belgidan iborat bo'lishi kerak").max(200),
  body: z.string().min(5, "Matn kamida 5 ta belgidan iborat bo'lishi kerak").max(5000),
  audience: z.enum(['ALL', 'STUDENTS', 'MENTORS']).optional(),
  courseId: z.string().nullish().or(z.literal('').transform(() => null)),
});
