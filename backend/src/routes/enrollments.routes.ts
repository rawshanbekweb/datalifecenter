import { Router } from 'express';
import { createEnrollmentHandler, mockPayHandler, myEnrollmentsHandler } from '../controllers/enrollments.controller';
import { authenticate } from '../middleware/authenticate';
import { devOnly } from '../middleware/devOnly';
import { validateBody } from '../middleware/validateRequest';
import { createEnrollmentSchema } from '../validators/enrollments.validator';

const router = Router();

router.use(authenticate);
router.post('/', validateBody(createEnrollmentSchema), createEnrollmentHandler);
router.get('/me', myEnrollmentsHandler);
router.post('/:id/mock-pay', devOnly, mockPayHandler);

export default router;
