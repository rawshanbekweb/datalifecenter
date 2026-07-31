import { Router } from 'express';
import rateLimit from 'express-rate-limit';
import {
  createContactMessageHandler,
  listContactMessagesHandler,
  updateContactMessageStatusHandler,
} from '../controllers/contact.controller';
import { env } from '../config/env';
import { authenticate } from '../middleware/authenticate';
import { authorize } from '../middleware/authorize';
import { validateBody, validateQuery } from '../middleware/validateRequest';
import {
  contactMessageSchema,
  listContactMessagesQuerySchema,
  updateContactMessageStatusSchema,
} from '../validators/contact.validator';

const router = Router();

/**
 * Kontakt formasi ochiq (login talab qilmaydi) va to'g'ridan-to'g'ri DB'ga
 * yozadi — ya'ni limitsiz qoldirilsa admin xabarlar bo'limini bir necha
 * daqiqada minglab spam yozuv bilan to'ldirish mumkin edi.
 *
 * Soatiga 15 ta — bitta Wi-Fi ortidagi bir necha haqiqiy mehmon uchun
 * yetarlicha keng, avtomatlashtirilgan to'ldirish uchun esa tor.
 */
const contactLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  limit: 15,
  standardHeaders: true,
  legacyHeaders: false,
  skip: () => env.NODE_ENV === 'test',
  message: { success: false, error: { message: "Juda ko'p xabar yuborildi. Birozdan keyin qayta urinib ko'ring.", code: 'TOO_MANY_REQUESTS' } },
});

router.post('/', contactLimiter, validateBody(contactMessageSchema), createContactMessageHandler);
router.get('/', authenticate, authorize('ADMIN'), validateQuery(listContactMessagesQuerySchema), listContactMessagesHandler);
router.patch('/:id/status', authenticate, authorize('ADMIN'), validateBody(updateContactMessageStatusSchema), updateContactMessageStatusHandler);

export default router;
