import { Router } from 'express';
import rateLimit from 'express-rate-limit';
import { tooManyRequestsHandler } from '../utils/rateLimitResponse';
import {
  getStatsHandler,
  registerViewHandler,
  toggleLikeHandler,
} from '../controllers/engagement.controller';
import { env } from '../config/env';
import { optionalDeviceId, requireDeviceId } from '../middleware/deviceId';

const router = Router();

/**
 * Yoqtirish/ko'rish yozuvlari uchun maxsus limit.
 *
 * Umumiy yozuv limiti (300/5min) bu yerda yetarli emas: bu endpointlar
 * ochiq, login talab qilmaydi va hisoblagichni oshiradi — ya'ni raqamni
 * sun'iy shishirishning eng oson yo'li. Shu bilan birga limit haqiqiy
 * foydalanuvchini bo'g'masligi kerak: bitta odam sahifalarni aylanib
 * o'nlab ko'rish yuborishi normal, shuning uchun daqiqasiga 60.
 *
 * Bu IP bo'yicha ishlaydi va deviceId soxtalashtirilsa ham amal qiladi —
 * aynan shu sabab u asosiy himoya hisoblanadi.
 */
const engagementLimiter = rateLimit({
  windowMs: 60 * 1000,
  limit: 60,
  standardHeaders: true,
  legacyHeaders: false,
  skip: () => env.NODE_ENV === 'test',
  handler: tooManyRequestsHandler("Juda ko'p so'rov. Birozdan keyin urinib ko'ring."),
});

// Statistika o'qish — deviceId ixtiyoriy (bo'lmasa hech narsa "yoqtirilgan" emas)
router.get('/:target', optionalDeviceId, getStatsHandler);

router.post('/:target/:id/like', engagementLimiter, requireDeviceId, toggleLikeHandler);
router.post('/:target/:id/view', engagementLimiter, requireDeviceId, registerViewHandler);

export default router;
