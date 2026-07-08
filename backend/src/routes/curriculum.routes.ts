import { Router } from 'express';
import {
  createLessonHandler,
  createModuleHandler,
  deleteLessonHandler,
  deleteModuleHandler,
  updateLessonHandler,
  updateModuleHandler,
} from '../controllers/curriculum.controller';
import { authenticate } from '../middleware/authenticate';
import { authorize } from '../middleware/authorize';
import { validateBody } from '../middleware/validateRequest';
import {
  createLessonSchema,
  createModuleSchema,
  updateLessonSchema,
  updateModuleSchema,
} from '../validators/curriculum.validator';

export const modulesRouter = Router();
modulesRouter.use(authenticate, authorize('ADMIN', 'MENTOR'));
modulesRouter.post('/', validateBody(createModuleSchema), createModuleHandler);
modulesRouter.put('/:id', validateBody(updateModuleSchema), updateModuleHandler);
modulesRouter.delete('/:id', deleteModuleHandler);
modulesRouter.post('/:id/lessons', validateBody(createLessonSchema), createLessonHandler);

export const lessonsRouter = Router();
lessonsRouter.use(authenticate, authorize('ADMIN', 'MENTOR'));
lessonsRouter.put('/:id', validateBody(updateLessonSchema), updateLessonHandler);
lessonsRouter.delete('/:id', deleteLessonHandler);
