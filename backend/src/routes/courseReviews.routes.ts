import { Router } from 'express';
import {
  deleteReviewAdminHandler,
  listReviewsAdminHandler,
  setReviewPublishedHandler,
} from '../controllers/courseReviews.controller';
import { authenticate } from '../middleware/authenticate';
import { authorize } from '../middleware/authorize';
import { validateBody, validateQuery } from '../middleware/validateRequest';
import { listReviewsAdminQuerySchema, setReviewPublishedSchema } from '../validators/courseReviews.validator';

const router = Router();

router.get('/admin', authenticate, authorize('ADMIN'), validateQuery(listReviewsAdminQuerySchema), listReviewsAdminHandler);
router.patch('/:id', authenticate, authorize('ADMIN'), validateBody(setReviewPublishedSchema), setReviewPublishedHandler);
router.delete('/:id', authenticate, authorize('ADMIN'), deleteReviewAdminHandler);

export default router;
