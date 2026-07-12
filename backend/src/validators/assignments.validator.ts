import { z } from 'zod';

export const createAssignmentSchema = z.object({
  courseId: z.string().min(1, 'Kurs tanlanishi kerak'),
  title: z.string().min(3, "Sarlavha kamida 3 ta belgidan iborat bo'lishi kerak").max(200),
  description: z.string().min(5, "Topshiriq matni kamida 5 ta belgidan iborat bo'lishi kerak").max(8000),
  linkUrl: z.string().url("Havola noto'g'ri (https://... formatida bo'lishi kerak)").nullish(),
  dueAt: z.coerce.date({ message: "Muddat noto'g'ri" }).nullish(),
  // Bo'sh/berilmagan bo'lsa — kursga yozilgan hammaga (standart)
  targetStudentIds: z.array(z.string()).optional(),
});

export const updateAssignmentSchema = createAssignmentSchema.omit({ courseId: true }).partial();

export const submitAssignmentSchema = z.object({
  content: z.string().min(3, "Javob kamida 3 ta belgidan iborat bo'lishi kerak").max(8000),
  linkUrl: z.string().url("Havola noto'g'ri (https://... formatida bo'lishi kerak)").nullish(),
  // /uploads/... yoki Cloudinary URL — o'quvchi yuklagan rasm (skrinshot)
  fileUrl: z.string().max(1000).nullish(),
});

export const reviewSubmissionSchema = z.object({
  status: z.enum(['ACCEPTED', 'RETURNED'], { message: "Holat noto'g'ri" }),
  grade: z.coerce.number().int().min(0, 'Baho 0 dan kichik bo‘lmasin').max(100, 'Baho 100 dan oshmasin').nullish(),
  feedback: z.string().max(5000).nullish(),
});
