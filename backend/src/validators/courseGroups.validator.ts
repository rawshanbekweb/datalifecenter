import { z } from 'zod';

// "18:00" — haftalik takrorlanadigan dars vaqti (sanasiz, mahalliy vaqt).
// Sxemadagi CourseGroup.startTime izohiga qarang.
const timeOfDay = z
  .string()
  .regex(/^([01]\d|2[0-3]):[0-5]\d$/, "Vaqt SS:DD ko'rinishida bo'lishi kerak (masalan 18:00)");

// 0 = yakshanba ... 6 = shanba (JS Date.getDay bilan bir xil)
const weekdays = z
  .array(z.coerce.number().int().min(0, "Hafta kuni 0 dan 6 gacha").max(6, "Hafta kuni 0 dan 6 gacha"))
  .max(7)
  .transform((days) => [...new Set(days)].sort((a, b) => a - b));

export const createCourseGroupSchema = z.object({
  courseId: z.string().min(1, 'Kurs tanlanishi kerak'),
  name: z.string().trim().min(2, "Guruh nomi kamida 2 ta belgidan iborat bo'lishi kerak").max(80),
  format: z.enum(['ONLINE', 'OFFLINE'], { message: "Format noto'g'ri" }),
  mentorId: z.string().nullish(),
  status: z.enum(['PLANNED', 'ACTIVE', 'FINISHED']).optional(),
  startsAt: z.coerce.date({ message: "Boshlanish sanasi noto'g'ri" }),
  endsAt: z.coerce.date({ message: "Tugash sanasi noto'g'ri" }).nullish(),
  weekdays: weekdays.optional(),
  startTime: timeOfDay.nullish(),
  durationMin: z.coerce.number().int().min(15, 'Kamida 15 daqiqa').max(480, "Ko'pi bilan 8 soat").optional(),
  room: z.string().trim().max(120).nullish(),
  // Guruh sig'imi — markazdagi guruhlar 5-6 kishilik
  capacity: z.coerce.number().int().min(1, 'Kamida 1 joy').max(200).nullish(),
});

export const updateCourseGroupSchema = createCourseGroupSchema
  .omit({ courseId: true })
  .partial()
  .refine((data) => Object.keys(data).length > 0, { message: 'Hech bo\'lmasa bitta maydon yuborilishi kerak' });

export const listCourseGroupsQuerySchema = z.object({
  courseId: z.string().optional(),
  status: z.enum(['PLANNED', 'ACTIVE', 'FINISHED']).optional(),
  format: z.enum(['ONLINE', 'OFFLINE']).optional(),
});

export const setEnrollmentGroupSchema = z.object({
  enrollmentId: z.string().min(1, 'Yozilish tanlanishi kerak'),
});
