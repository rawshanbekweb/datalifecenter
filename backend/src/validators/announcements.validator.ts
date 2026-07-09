import { z } from 'zod';
import { localizedString } from './shared/localizedString.validator';

export const createAnnouncementSchema = z.object({
  title: localizedString(3, "Sarlavha kamida 3 ta belgidan iborat bo'lishi kerak"),
  body: localizedString(5, "Matn kamida 5 ta belgidan iborat bo'lishi kerak"),
  audience: z.enum(['ALL', 'STUDENTS', 'MENTORS']).optional(),
  courseId: z.string().nullish().or(z.literal('').transform(() => null)),
});
