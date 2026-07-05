import { z } from 'zod';

export const createModuleSchema = z.object({
  courseId: z.string().min(1, 'courseId kerak'),
  title: z.string().min(1, 'Modul sarlavhasi kerak'),
  description: z.string().nullish(),
  order: z.coerce.number().int().min(0).optional(),
});

export const updateModuleSchema = z.object({
  title: z.string().min(1).optional(),
  description: z.string().nullish(),
  order: z.coerce.number().int().min(0).optional(),
});

export const createLessonSchema = z.object({
  title: z.string().min(1, 'Dars sarlavhasi kerak'),
  contentType: z.enum(['VIDEO', 'TEXT', 'QUIZ', 'ASSIGNMENT']).optional(),
  videoUrl: z.string().url("Video URL noto'g'ri").nullish().or(z.literal('').transform(() => null)),
  content: z.string().nullish(),
  durationMinutes: z.coerce.number().int().min(0).nullish(),
  isFreePreview: z.boolean().optional(),
  order: z.coerce.number().int().min(0).optional(),
});

export const updateLessonSchema = createLessonSchema.partial();
