import { Router } from 'express';
import {
  createMentorHandler,
  deleteMentorHandler,
  getMentorCourseHandler,
  getMentorHandler,
  getMentorMeHandler,
  listMentorsHandler,
  mentorDashboardHandler,
  mentorStudentsHandler,
  updateMentorHandler,
  updateMentorMeHandler,
} from '../controllers/mentors.controller';
import { authenticate } from '../middleware/authenticate';
import { authorize } from '../middleware/authorize';
import { validateBody } from '../middleware/validateRequest';
import { createMentorSchema, updateMentorMeSchema, updateMentorSchema } from '../validators/mentors.validator';

const router = Router();

router.get('/', listMentorsHandler);
router.get('/me', authenticate, authorize('MENTOR', 'ADMIN'), getMentorMeHandler);
router.patch('/me', authenticate, authorize('MENTOR', 'ADMIN'), validateBody(updateMentorMeSchema), updateMentorMeHandler);
router.get('/me/dashboard', authenticate, authorize('MENTOR', 'ADMIN'), mentorDashboardHandler);
router.get('/me/students', authenticate, authorize('MENTOR', 'ADMIN'), mentorStudentsHandler);
router.get('/me/courses/:id', authenticate, authorize('MENTOR', 'ADMIN'), getMentorCourseHandler);
router.post('/', authenticate, authorize('ADMIN'), validateBody(createMentorSchema), createMentorHandler);
router.get('/:id', getMentorHandler);
router.put('/:id', authenticate, authorize('ADMIN'), validateBody(updateMentorSchema), updateMentorHandler);
router.delete('/:id', authenticate, authorize('ADMIN'), deleteMentorHandler);

export default router;
