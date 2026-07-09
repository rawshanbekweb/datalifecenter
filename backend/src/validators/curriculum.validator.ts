import { z } from 'zod';
import { localizedString, localizedStringNullish } from './shared/localizedString.validator';

export const createModuleSchema = z.object({
  courseId: z.string().min(1, 'courseId kerak'),
  title: localizedString(1, 'Modul sarlavhasi kerak'),
  description: localizedStringNullish(),
  order: z.coerce.number().int().min(0).optional(),
});

export const updateModuleSchema = z.object({
  title: localizedString(1, 'Modul sarlavhasi kerak').optional(),
  description: localizedStringNullish(),
  order: z.coerce.number().int().min(0).optional(),
});

export const createLessonSchema = z.object({
  title: localizedString(1, 'Dars sarlavhasi kerak'),
  contentType: z.enum(['VIDEO', 'TEXT', 'QUIZ', 'ASSIGNMENT']).optional(),
  videoUrl: z.string().url("Video URL noto'g'ri").nullish().or(z.literal('').transform(() => null)),
  content: localizedStringNullish(),
  durationMinutes: z.coerce.number().int().min(0).nullish(),
  isFreePreview: z.boolean().optional(),
  order: z.coerce.number().int().min(0).optional(),
});

export const updateLessonSchema = createLessonSchema.partial();
