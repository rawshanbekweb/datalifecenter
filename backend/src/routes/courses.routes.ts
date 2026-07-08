import { Router } from 'express';
import {
  createCourseHandler,
  deleteCourseHandler,
  getCourseAdminHandler,
  getCourseHandler,
  getCourseLearnHandler,
  listCoursesAdminHandler,
  listCoursesHandler,
  updateCourseHandler,
} from '../controllers/courses.controller';
import {
  deleteMyReviewHandler,
  getMyReviewHandler,
  listReviewsHandler,
  upsertReviewHandler,
} from '../controllers/courseReviews.controller';
import { authenticate } from '../middleware/authenticate';
import { authorize } from '../middleware/authorize';
import { validateBody, validateQuery } from '../middleware/validateRequest';
import { createCourseSchema, listCoursesQuerySchema, updateCourseSchema } from '../validators/courses.validator';
import { upsertReviewSchema } from '../validators/courseReviews.validator';

const router = Router();

router.get('/admin', authenticate, authorize('ADMIN'), listCoursesAdminHandler);
router.get('/admin/:id', authenticate, authorize('ADMIN'), getCourseAdminHandler);
router.post('/', authenticate, authorize('ADMIN'), validateBody(createCourseSchema), createCourseHandler);
router.put('/:id', authenticate, authorize('ADMIN'), validateBody(updateCourseSchema), updateCourseHandler);
router.delete('/:id', authenticate, authorize('ADMIN'), deleteCourseHandler);

router.get('/', validateQuery(listCoursesQuerySchema), listCoursesHandler);
router.get('/:slug/learn', authenticate, getCourseLearnHandler);
router.get('/:slug/reviews/me', authenticate, getMyReviewHandler);
router.post('/:slug/reviews', authenticate, validateBody(upsertReviewSchema), upsertReviewHandler);
router.delete('/:slug/reviews/me', authenticate, deleteMyReviewHandler);
router.get('/:slug/reviews', listReviewsHandler);
router.get('/:slug', getCourseHandler);

export default router;
