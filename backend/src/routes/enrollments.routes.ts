import { Router } from 'express';
import {
  certificateHandler,
  createEnrollmentHandler,
  listEnrollmentsAdminHandler,
  mockPayHandler,
  myEnrollmentsHandler,
  submitReceiptHandler,
  updateEnrollmentAdminHandler,
} from '../controllers/enrollments.controller';
import { authenticate } from '../middleware/authenticate';
import { authorize } from '../middleware/authorize';
import { devOnly } from '../middleware/devOnly';
import { validateBody, validateQuery } from '../middleware/validateRequest';
import {
  createEnrollmentSchema,
  listEnrollmentsAdminQuerySchema,
  submitReceiptSchema,
  updateEnrollmentAdminSchema,
} from '../validators/enrollments.validator';

const router = Router();

router.use(authenticate);
router.get('/admin', authorize('ADMIN'), validateQuery(listEnrollmentsAdminQuerySchema), listEnrollmentsAdminHandler);
router.patch('/:id', authorize('ADMIN'), validateBody(updateEnrollmentAdminSchema), updateEnrollmentAdminHandler);
router.post('/', validateBody(createEnrollmentSchema), createEnrollmentHandler);
router.get('/me', myEnrollmentsHandler);
router.post('/:id/receipt', validateBody(submitReceiptSchema), submitReceiptHandler);
router.get('/:id/certificate', certificateHandler);
router.post('/:id/mock-pay', devOnly, mockPayHandler);

export default router;
