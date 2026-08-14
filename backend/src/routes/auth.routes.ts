import { Router } from 'express';
import rateLimit from 'express-rate-limit';
import {
  changePasswordHandler,
  forgotPasswordHandler,
  heartbeatHandler,
  listSessionsHandler,
  loginHandler,
  logoutHandler,
  meHandler,
  registerHandler,
  resendVerificationHandler,
  resetPasswordHandler,
  revokeOtherSessionsHandler,
  revokeSessionHandler,
  updateProfileHandler,
  verifyEmailHandler,
} from '../controllers/auth.controller';
import { validateBody } from '../middleware/validateRequest';
import {
  changePasswordSchema,
  forgotPasswordSchema,
  loginSchema,
  registerSchema,
  resetPasswordSchema,
  updateProfileSchema,
  verifyEmailSchema,
} from '../validators/auth.validator';
import { authenticate } from '../middleware/authenticate';
import { optionalDeviceId } from '../middleware/deviceId';
import { env } from '../config/env';
import { tooManyRequestsHandler } from '../utils/rateLimitResponse';

const router = Router();

const tooManyAttempts = tooManyRequestsHandler("Juda ko'p urinish. 15 daqiqadan keyin qayta urinib ko'ring.");

/**
 * Brute-force himoyasi — FAQAT muvaffaqiyatsiz urinishlar sanaladi.
 *
 * Bu `skipSuccessfulRequests` juda muhim: tadbir zali yoki ofis Wi-Fi'sidagi
 * o'nlab foydalanuvchi serverga bitta IP bo'lib ko'rinadi. Barcha urinishlar
 * sanalganda 20 nafar odam muvaffaqiyatli kirgach 21-chisi bloklanardi.
 * Parol topishga urinayotgan hujumchi esa ta'rifi bo'yicha xato javob oladi,
 * shuning uchun uni bu limit avvalgidek to'xtatadi.
 */
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 20,
  skipSuccessfulRequests: true,
  standardHeaders: true,
  legacyHeaders: false,
  skip: () => env.NODE_ENV === 'test',
  handler: tooManyAttempts,
});

/**
 * Ro'yxatdan o'tish — bu yerda muvaffaqiyatli so'rovlarni ham sanaymiz, aks
 * holda bitta IP'dan cheksiz soxta akkaunt yaratish mumkin bo'lardi.
 *
 * Limit avval 60 edi (bitta Wi-Fi'dan ommaviy ro'yxatdan o'tishni ko'zlab), lekin
 * shu keng oraliqdan foydalanib bir IP'dan o'nlab soxta hisob ochilgan. Endi 10:
 * haqiqiy yolg'iz foydalanuvchiga bu yetib ortadi. EHTIYOT BO'LING — tadbir yoki
 * ochiq dars kuni bitta xonadan 10 dan ko'p odam ro'yxatdan o'tsa, 11-chisi
 * "juda ko'p urinish" oladi; bunday kunlarda bu qiymatni vaqtincha oshirib
 * qo'yish kerak.
 */
const registerLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 10,
  standardHeaders: true,
  legacyHeaders: false,
  skip: () => env.NODE_ENV === 'test',
  handler: tooManyAttempts,
});

// Parol tiklash uchun qattiqroq limit — email-bombing'ning oldini oladi
const forgotLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 5,
  standardHeaders: true,
  legacyHeaders: false,
  skip: () => env.NODE_ENV === 'test',
  handler: tooManyAttempts,
});

// `optionalDeviceId` — seans yozuviga brauzerning anonim qurilma id'sini
// biriktirish uchun: User-Agent bir nechta qurilmada bir xil bo'lishi mumkin,
// bu id esa "shu qurilma"ni aniq ajratadi.
router.post('/register', registerLimiter, optionalDeviceId, validateBody(registerSchema), registerHandler);
router.post('/login', authLimiter, optionalDeviceId, validateBody(loginSchema), loginHandler);
router.post('/forgot-password', forgotLimiter, validateBody(forgotPasswordSchema), forgotPasswordHandler);
router.post('/reset-password', authLimiter, validateBody(resetPasswordSchema), resetPasswordHandler);
router.post('/verify-email', authLimiter, validateBody(verifyEmailSchema), verifyEmailHandler);
router.post('/resend-verification', forgotLimiter, authenticate, resendVerificationHandler);
router.post('/logout', logoutHandler);
router.get('/me', authenticate, meHandler);
router.patch('/me', authenticate, validateBody(updateProfileSchema), updateProfileHandler);
router.patch('/me/password', authenticate, validateBody(changePasswordSchema), changePasswordHandler);

/**
 * Seans boshqaruvi.
 *
 * `/heartbeat` ATAYIN GET: POST bo'lsa u yozuv limitiga (writeLimiter) tushardi
 * va bitta Wi-Fi ortidagi o'nlab foydalanuvchi limitni birgalikda yeb qo'yardi.
 * Yozuv baribir bo'ladi — `authenticate` ichida, daqiqasiga bir marta.
 *
 * `/sessions/others` `/sessions/:id` dan OLDIN turishi shart, aks holda
 * "others" so'zi `:id` sifatida o'qilardi.
 */
router.get('/heartbeat', authenticate, heartbeatHandler);
router.get('/sessions', authenticate, listSessionsHandler);
router.delete('/sessions/others', authenticate, revokeOtherSessionsHandler);
router.delete('/sessions/:id', authenticate, revokeSessionHandler);

export default router;
