import { Router } from 'express';
import {
  createSessionHandler,
  deleteSessionHandler,
  listManagedSessionsHandler,
  listMySessionsHandler,
  updateSessionHandler,
} from '../controllers/sessions.controller';
import { authenticate } from '../middleware/authenticate';
import { authorize } from '../middleware/authorize';
import { validateBody } from '../middleware/validateRequest';
import { createSessionSchema, updateSessionSchema } from '../validators/sessions.validator';

const router = Router();

router.use(authenticate);
router.get('/mine', listMySessionsHandler);
router.get('/manage', authorize('MENTOR', 'ADMIN'), listManagedSessionsHandler);
router.post('/', authorize('MENTOR', 'ADMIN'), validateBody(createSessionSchema), createSessionHandler);
router.patch('/:id', authorize('MENTOR', 'ADMIN'), validateBody(updateSessionSchema), updateSessionHandler);
router.delete('/:id', authorize('MENTOR', 'ADMIN'), deleteSessionHandler);

export default router;
