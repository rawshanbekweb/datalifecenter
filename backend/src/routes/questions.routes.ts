import { Router } from 'express';
import {
  answerQuestionHandler,
  createMentorRequestHandler,
  createQuestionHandler,
  deleteQuestionHandler,
  deleteQuestionsHandler,
  listAllMentorRequestsHandler,
  listLessonQuestionsHandler,
  listMentorQuestionsHandler,
  listMyMentorRequestsHandler,
  updateMentorRequestHandler,
} from '../controllers/questions.controller';
import { authenticate } from '../middleware/authenticate';
import { authorize } from '../middleware/authorize';
import { validateBody } from '../middleware/validateRequest';
import {
  answerQuestionSchema,
  createMentorRequestSchema,
  createQuestionSchema,
  updateMentorRequestSchema,
} from '../validators/questions.validator';
import { bulkDeleteSchema } from '../validators/shared/bulkDelete.validator';

// O'quvchi ↔ mentor: dars ostidagi savol-javob
export const questionsRouter = Router();
questionsRouter.use(authenticate);
questionsRouter.post('/', validateBody(createQuestionSchema), createQuestionHandler);
questionsRouter.get('/mentor', authorize('MENTOR', 'ADMIN'), listMentorQuestionsHandler);
questionsRouter.get('/lesson/:lessonId', listLessonQuestionsHandler);
questionsRouter.patch('/:id/answer', authorize('MENTOR', 'ADMIN'), validateBody(answerQuestionSchema), answerQuestionHandler);
// Ommaviy o'chirish faqat adminda: mentor uchun har bir ID'ning kurs
// egaligini alohida tekshirish kerak bo'lardi (sabab servisda yozilgan)
questionsRouter.post('/bulk-delete', authorize('ADMIN'), validateBody(bulkDeleteSchema), deleteQuestionsHandler);
questionsRouter.delete('/:id', authorize('MENTOR', 'ADMIN'), deleteQuestionHandler);

// Mentor ↔ admin: rasmiy so'rovlar
export const mentorRequestsRouter = Router();
mentorRequestsRouter.use(authenticate);
mentorRequestsRouter.post('/', authorize('MENTOR'), validateBody(createMentorRequestSchema), createMentorRequestHandler);
mentorRequestsRouter.get('/mine', authorize('MENTOR'), listMyMentorRequestsHandler);
mentorRequestsRouter.get('/', authorize('ADMIN'), listAllMentorRequestsHandler);
mentorRequestsRouter.patch('/:id', authorize('ADMIN'), validateBody(updateMentorRequestSchema), updateMentorRequestHandler);
