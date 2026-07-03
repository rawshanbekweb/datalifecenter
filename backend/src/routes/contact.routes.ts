import { Router } from 'express';
import {
  createContactMessageHandler,
  listContactMessagesHandler,
  updateContactMessageStatusHandler,
} from '../controllers/contact.controller';
import { authenticate } from '../middleware/authenticate';
import { authorize } from '../middleware/authorize';
import { validateBody } from '../middleware/validateRequest';
import { contactMessageSchema, updateContactMessageStatusSchema } from '../validators/contact.validator';

const router = Router();

router.post('/', validateBody(contactMessageSchema), createContactMessageHandler);
router.get('/', authenticate, authorize('ADMIN'), listContactMessagesHandler);
router.patch('/:id/status', authenticate, authorize('ADMIN'), validateBody(updateContactMessageStatusSchema), updateContactMessageStatusHandler);

export default router;
