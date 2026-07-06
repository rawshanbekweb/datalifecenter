import { Router } from 'express';
import rateLimit from 'express-rate-limit';
import {
  changePasswordHandler,
  loginHandler,
  logoutHandler,
  meHandler,
  registerHandler,
  updateProfileHandler,
} from '../controllers/auth.controller';
import { validateBody } from '../middleware/validateRequest';
import { changePasswordSchema, loginSchema, registerSchema, updateProfileSchema } from '../validators/auth.validator';
import { authenticate } from '../middleware/authenticate';

const router = Router();

// Brute-force himoyasi: bitta IP'dan 15 daqiqada ko'pi bilan 20 ta login/register urinishi
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 20,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, error: { message: "Juda ko'p urinish. 15 daqiqadan keyin qayta urinib ko'ring.", code: 'TOO_MANY_REQUESTS' } },
});

router.post('/register', authLimiter, validateBody(registerSchema), registerHandler);
router.post('/login', authLimiter, validateBody(loginSchema), loginHandler);
router.post('/logout', logoutHandler);
router.get('/me', authenticate, meHandler);
router.patch('/me', authenticate, validateBody(updateProfileSchema), updateProfileHandler);
router.patch('/me/password', authenticate, validateBody(changePasswordSchema), changePasswordHandler);

export default router;
