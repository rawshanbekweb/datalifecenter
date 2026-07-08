import { z } from 'zod';

export const createQuestionSchema = z.object({
  lessonId: z.string().min(1, 'Dars tanlanishi shart'),
  body: z.string().min(3, "Savol kamida 3 ta belgidan iborat bo'lishi kerak").max(2000),
});

export const answerQuestionSchema = z.object({
  answer: z.string().min(1, "Javob bo'sh bo'lishi mumkin emas").max(5000),
});

export const createMentorRequestSchema = z.object({
  subject: z.string().min(3, "Mavzu kamida 3 ta belgidan iborat bo'lishi kerak").max(200),
  body: z.string().min(5, "So'rov matni kamida 5 ta belgidan iborat bo'lishi kerak").max(5000),
});

export const updateMentorRequestSchema = z.object({
  reply: z.string().min(1).max(5000).optional(),
  status: z.enum(['OPEN', 'ANSWERED', 'CLOSED']).optional(),
});
