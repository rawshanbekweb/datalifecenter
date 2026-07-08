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

const router = Router();

// Brute-force himoyasi: bitta IP'dan 15 daqiqada ko'pi bilan 20 ta login/register urinishi
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 20,
  standardHeaders: true,
  legacyHeaders: false,
  skip: () => env.NODE_ENV === 'test',
  message: { success: false, error: { message: "Juda ko'p urinish. 15 daqiqadan keyin qayta urinib ko'ring.", code: 'TOO_MANY_REQUESTS' } },
});

// Parol tiklash uchun qattiqroq limit — email-bombing'ning oldini oladi
const forgotLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 5,
  standardHeaders: true,
  legacyHeaders: false,
  skip: () => env.NODE_ENV === 'test',
  message: { success: false, error: { message: "Juda ko'p urinish. 15 daqiqadan keyin qayta urinib ko'ring.", code: 'TOO_MANY_REQUESTS' } },
});

router.post('/register', authLimiter, validateBody(registerSchema), registerHandler);
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
