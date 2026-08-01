import { Router } from 'express';
import rateLimit from 'express-rate-limit';
import {
  createCourseRequestHandler,
  listCourseRequestsAdminHandler,
  listMyCourseRequestsHandler,
  updateCourseRequestHandler,
} from '../controllers/courseRequests.controller';
import { env } from '../config/env';
import { authenticate } from '../middleware/authenticate';
import { authorize } from '../middleware/authorize';
import { optionalAuth } from '../middleware/optionalAuth';
import { validateBody, validateQuery } from '../middleware/validateRequest';
import {
  createCourseRequestSchema,
  listCourseRequestsQuerySchema,
  updateCourseRequestSchema,
} from '../validators/courseRequests.validator';

const router = Router();

/**
 * So'rov formasi ochiq (login talab qilmaydi) — kontakt formasi bilan bir xil
 * xavf: limitsiz qoldirilsa admin ro'yxatini spam bilan to'ldirish mumkin.
 * Soatiga 10 ta: bir odam bir necha kursga qiziqishi normal, avtomatik
 * to'ldirish uchun esa tor.
 */
const requestLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  limit: 10,
  standardHeaders: true,
  legacyHeaders: false,
  skip: () => env.NODE_ENV === 'test',
  message: { success: false, error: { message: "Juda ko'p so'rov yuborildi. Birozdan keyin qayta urinib ko'ring.", code: 'TOO_MANY_REQUESTS' } },
});

router.post('/', requestLimiter, optionalAuth, validateBody(createCourseRequestSchema), createCourseRequestHandler);
router.get('/mine', authenticate, listMyCourseRequestsHandler);
router.get('/', authenticate, authorize('ADMIN'), validateQuery(listCourseRequestsQuerySchema), listCourseRequestsAdminHandler);
router.patch('/:id', authenticate, authorize('ADMIN'), validateBody(updateCourseRequestSchema), updateCourseRequestHandler);

export default router;
