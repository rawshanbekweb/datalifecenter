import { z } from 'zod';
import { localizedString, localizedStringNullish } from './shared/localizedString.validator';

export const createSessionSchema = z.object({
  courseId: z.string().min(1, 'Kurs tanlanishi kerak'),
  title: localizedString(3, "Sarlavha kamida 3 ta belgidan iborat bo'lishi kerak"),
  description: localizedStringNullish(),
  meetingUrl: z.string().url("Uchrashuv havolasi noto'g'ri (https://... formatida bo'lishi kerak)"),
  startsAt: z.coerce.date({ message: "Boshlanish vaqti noto'g'ri" }),
  durationMin: z.coerce.number().int().min(15, 'Kamida 15 daqiqa').max(480, "Ko'pi bilan 8 soat").default(60),
  // Bo'sh/berilmagan bo'lsa — kursga yozilgan hammaga ochiq (standart)
  targetStudentIds: z.array(z.string()).optional(),
});

export const updateSessionSchema = z.object({
  title: localizedString(3, "Sarlavha kamida 3 ta belgidan iborat bo'lishi kerak").optional(),
  description: localizedStringNullish(),
  meetingUrl: z.string().url("Uchrashuv havolasi noto'g'ri").optional(),
  startsAt: z.coerce.date({ message: "Boshlanish vaqti noto'g'ri" }).optional(),
  durationMin: z.coerce.number().int().min(15).max(480).optional(),
  status: z.enum(['SCHEDULED', 'LIVE', 'ENDED', 'CANCELLED'], { message: "Holat noto'g'ri" }).optional(),
  targetStudentIds: z.array(z.string()).optional(),
});
