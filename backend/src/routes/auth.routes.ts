import { Router } from 'express';
import rateLimit from 'express-rate-limit';
import {
  changePasswordHandler,
  forgotPasswordHandler,
  loginHandler,
  logoutHandler,
  meHandler,
  registerHandler,
  resendVerificationHandler,
  resetPasswordHandler,
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

router.post('/register', registerLimiter, validateBody(registerSchema), registerHandler);
router.post('/login', authLimiter, validateBody(loginSchema), loginHandler);
router.post('/forgot-password', forgotLimiter, validateBody(forgotPasswordSchema), forgotPasswordHandler);
router.post('/reset-password', authLimiter, validateBody(resetPasswordSchema), resetPasswordHandler);
router.post('/verify-email', authLimiter, validateBody(verifyEmailSchema), verifyEmailHandler);
router.post('/resend-verification', forgotLimiter, authenticate, resendVerificationHandler);
router.post('/logout', logoutHandler);
router.get('/me', authenticate, meHandler);
router.patch('/me', authenticate, validateBody(updateProfileSchema), updateProfileHandler);
router.patch('/me/password', authenticate, validateBody(changePasswordSchema), changePasswordHandler);

export default router;
