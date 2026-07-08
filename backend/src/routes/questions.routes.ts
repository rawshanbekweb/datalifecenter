import { Router } from 'express';
import {
  answerQuestionHandler,
  createMentorRequestHandler,
  createQuestionHandler,
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

// O'quvchi ↔ mentor: dars ostidagi savol-javob
export const questionsRouter = Router();
questionsRouter.use(authenticate);
questionsRouter.post('/', validateBody(createQuestionSchema), createQuestionHandler);
questionsRouter.get('/mentor', authorize('MENTOR', 'ADMIN'), listMentorQuestionsHandler);
questionsRouter.get('/lesson/:lessonId', listLessonQuestionsHandler);
questionsRouter.patch('/:id/answer', authorize('MENTOR', 'ADMIN'), validateBody(answerQuestionSchema), answerQuestionHandler);

// Mentor ↔ admin: rasmiy so'rovlar
export const mentorRequestsRouter = Router();
mentorRequestsRouter.use(authenticate);
mentorRequestsRouter.post('/', authorize('MENTOR'), validateBody(createMentorRequestSchema), createMentorRequestHandler);
mentorRequestsRouter.get('/mine', authorize('MENTOR'), listMyMentorRequestsHandler);
mentorRequestsRouter.get('/', authorize('ADMIN'), listAllMentorRequestsHandler);
mentorRequestsRouter.patch('/:id', authorize('ADMIN'), validateBody(updateMentorRequestSchema), updateMentorRequestHandler);
