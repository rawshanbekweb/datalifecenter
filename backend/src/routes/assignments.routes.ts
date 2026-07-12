import { Router } from 'express';
import {
  createAssignmentHandler,
  deleteAssignmentHandler,
  listManagedAssignmentsHandler,
  listMyAssignmentsHandler,
  reviewSubmissionHandler,
  submitAssignmentHandler,
  updateAssignmentHandler,
} from '../controllers/assignments.controller';
import { authenticate } from '../middleware/authenticate';
import { authorize } from '../middleware/authorize';
import { validateBody } from '../middleware/validateRequest';
import {
  createAssignmentSchema,
  reviewSubmissionSchema,
  submitAssignmentSchema,
  updateAssignmentSchema,
} from '../validators/assignments.validator';

// Mentor ↔ o'quvchi: topshiriq berish, bajarilganini yuborish va tekshirish
const router = Router();
router.use(authenticate);

// Talaba
router.get('/mine', listMyAssignmentsHandler);
router.post('/:id/submit', validateBody(submitAssignmentSchema), submitAssignmentHandler);

// Mentor/Admin
router.get('/manage', authorize('MENTOR', 'ADMIN'), listManagedAssignmentsHandler);
router.post('/', authorize('MENTOR', 'ADMIN'), validateBody(createAssignmentSchema), createAssignmentHandler);
router.patch('/submissions/:id/review', authorize('MENTOR', 'ADMIN'), validateBody(reviewSubmissionSchema), reviewSubmissionHandler);
router.patch('/:id', authorize('MENTOR', 'ADMIN'), validateBody(updateAssignmentSchema), updateAssignmentHandler);
router.delete('/:id', authorize('MENTOR', 'ADMIN'), deleteAssignmentHandler);

export default router;
