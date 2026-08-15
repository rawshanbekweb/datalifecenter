import { Router } from 'express';
import rateLimit from 'express-rate-limit';
import { tooManyRequestsHandler } from '../utils/rateLimitResponse';
import {
  createCourseRequestHandler,
  deleteCourseRequestHandler,
  deleteCourseRequestsHandler,
  enrollFromRequestHandler,
  listCourseRequestsAdminHandler,
  listMyCourseRequestsHandler,
  updateCourseRequestHandler,
} from '../controllers/courseRequests.controller';
import { bulkDeleteSchema } from '../validators/shared/bulkDelete.validator';
import { env } from '../config/env';
import { authenticate } from '../middleware/authenticate';
import { authorize } from '../middleware/authorize';
import { validateBody, validateQuery } from '../middleware/validateRequest';
import {
  createCourseRequestSchema,
  enrollFromRequestSchema,
  listCourseRequestsQuerySchema,
  updateCourseRequestSchema,
} from '../validators/courseRequests.validator';

const router = Router();

/**
 * So'rov endi FAQAT ro'yxatdan o'tgan va emaili tasdiqlangan foydalanuvchidan
 * qabul qilinadi (2026-08-14). Avval mehmon ham yubora olardi.
 *
 * NEGA O'ZGARDI: o'quvchini kursga rasman yozish uchun uning hisobi kerak —
 * guruh, statusi va yozishmasi shu hisobga bog'lanadi. Emailsiz esa unga
 * hech qanday xabar bormaydi: kurs boshlanishi, guruh va to'lov haqidagi
 * bildirishnomalar aynan shu manzilga ketadi.
 *
 * Limit saqlanib qoldi: hisobi bor odam ham ro'yxatni bir necha kursga
 * takroriy so'rov bilan to'ldirib yuborishi mumkin.
 */
const requestLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  limit: 10,
  standardHeaders: true,
  legacyHeaders: false,
  skip: () => env.NODE_ENV === 'test',
  handler: tooManyRequestsHandler("Juda ko'p so'rov yuborildi. Birozdan keyin qayta urinib ko'ring."),
});

router.post('/', requestLimiter, authenticate, validateBody(createCourseRequestSchema), createCourseRequestHandler);
router.get('/mine', authenticate, listMyCourseRequestsHandler);
router.get('/', authenticate, authorize('ADMIN'), validateQuery(listCourseRequestsQuerySchema), listCourseRequestsAdminHandler);
router.patch('/:id', authenticate, authorize('ADMIN'), validateBody(updateCourseRequestSchema), updateCourseRequestHandler);
// So'rovni tasdiqlab o'quvchini kursga qo'shish (joy tekshiruvi bilan).
// Tanada guruh berilishi mumkin — o'shanda o'quvchi darrov jadvalga tushadi.
router.post('/:id/enroll', authenticate, authorize('ADMIN'), validateBody(enrollFromRequestSchema), enrollFromRequestHandler);
// POST bilan: DELETE tanasi (body) hamma proxy va mijozda ishonchli o'tmaydi
router.post('/bulk-delete', authenticate, authorize('ADMIN'), validateBody(bulkDeleteSchema), deleteCourseRequestsHandler);
router.delete('/:id', authenticate, authorize('ADMIN'), deleteCourseRequestHandler);

export default router;
