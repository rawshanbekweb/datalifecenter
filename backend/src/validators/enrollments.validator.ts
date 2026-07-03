import { z } from 'zod';

export const createEnrollmentSchema = z.object({
  courseId: z.string().min(1, "courseId kerak"),
});
