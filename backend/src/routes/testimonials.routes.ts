import { Router } from 'express';
import {
  createTestimonialHandler,
  deleteTestimonialHandler,
  listTestimonialsAdminHandler,
  listTestimonialsHandler,
  updateTestimonialHandler,
} from '../controllers/testimonials.controller';
import { authenticate } from '../middleware/authenticate';
import { authorize } from '../middleware/authorize';
import { validateBody } from '../middleware/validateRequest';
import { createTestimonialSchema, updateTestimonialSchema } from '../validators/testimonials.validator';

const router = Router();

router.get('/', listTestimonialsHandler);
router.get('/admin', authenticate, authorize('ADMIN'), listTestimonialsAdminHandler);
router.post('/', authenticate, authorize('ADMIN'), validateBody(createTestimonialSchema), createTestimonialHandler);
router.put('/:id', authenticate, authorize('ADMIN'), validateBody(updateTestimonialSchema), updateTestimonialHandler);
router.delete('/:id', authenticate, authorize('ADMIN'), deleteTestimonialHandler);

export default router;
