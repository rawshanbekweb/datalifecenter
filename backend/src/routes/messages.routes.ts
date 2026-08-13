import { Router } from 'express';
import rateLimit from 'express-rate-limit';
import { tooManyRequestsHandler } from '../utils/rateLimitResponse';
import {
  getConversationHandler,
  listContactsHandler,
  listConversationsHandler,
  markConversationReadHandler,
  sendMessageHandler,
  startConversationHandler,
  unreadCountHandler,
} from '../controllers/messages.controller';
import { env } from '../config/env';
import { authenticate } from '../middleware/authenticate';
import { validateBody } from '../middleware/validateRequest';
import { sendMessageSchema, startConversationSchema } from '../validators/messages.validator';

// Rollar aro yozishma: talaba ↔ mentor, har kim ↔ administratsiya
const router = Router();
router.use(authenticate);

/**
 * Xabar yuborish uchun maxsus limit.
 *
 * Umumiy yozuv limiti (300/5min) chat uchun juda keng: bitta hisobdan
 * avtomatlashtirilgan spam boshqa foydalanuvchining bildirishnomalarini
 * ko'mib tashlashi mumkin. 30/daqiqa jonli yozishmaga xalaqit bermaydi
 * (qo'lda bundan tez yozib bo'lmaydi), lekin skriptni to'xtatadi.
 */
const messageLimiter = rateLimit({
  windowMs: 60 * 1000,
  limit: 30,
  standardHeaders: true,
  legacyHeaders: false,
  skip: () => env.NODE_ENV === 'test',
  handler: tooManyRequestsHandler("Juda ko'p xabar yuborildi. Birozdan keyin urinib ko'ring."),
});

router.get('/unread-count', unreadCountHandler);
router.get('/contacts', listContactsHandler);
router.get('/conversations', listConversationsHandler);
router.get('/conversations/:id', getConversationHandler);
router.post('/conversations', messageLimiter, validateBody(startConversationSchema), startConversationHandler);
router.post('/conversations/:id/messages', messageLimiter, validateBody(sendMessageSchema), sendMessageHandler);
router.patch('/conversations/:id/read', markConversationReadHandler);

export default router;
