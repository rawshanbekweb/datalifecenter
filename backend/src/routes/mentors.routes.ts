import { Router } from 'express';
import {
  createMentorHandler,
  deleteMentorHandler,
  getMentorHandler,
  listMentorsHandler,
  updateMentorHandler,
} from '../controllers/mentors.controller';
import { authenticate } from '../middleware/authenticate';
import { authorize } from '../middleware/authorize';
import { validateBody } from '../middleware/validateRequest';
import { createMentorSchema, updateMentorSchema } from '../validators/mentors.validator';

const router = Router();

router.get('/', listMentorsHandler);
router.post('/', authenticate, authorize('ADMIN'), validateBody(createMentorSchema), createMentorHandler);
router.get('/:id', getMentorHandler);
router.put('/:id', authenticate, authorize('ADMIN'), validateBody(updateMentorSchema), updateMentorHandler);
router.delete('/:id', authenticate, authorize('ADMIN'), deleteMentorHandler);

export default router;
