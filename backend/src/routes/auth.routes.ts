import { Router } from 'express';
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

router.post('/register', validateBody(registerSchema), registerHandler);
router.post('/login', validateBody(loginSchema), loginHandler);
router.post('/logout', logoutHandler);
router.get('/me', authenticate, meHandler);
router.patch('/me', authenticate, validateBody(updateProfileSchema), updateProfileHandler);
router.patch('/me/password', authenticate, validateBody(changePasswordSchema), changePasswordHandler);

export default router;
