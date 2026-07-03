import { Router } from 'express';
import { loginHandler, logoutHandler, meHandler, registerHandler } from '../controllers/auth.controller';
import { validateBody } from '../middleware/validateRequest';
import { loginSchema, registerSchema } from '../validators/auth.validator';
import { authenticate } from '../middleware/authenticate';

const router = Router();

router.post('/register', validateBody(registerSchema), registerHandler);
router.post('/login', validateBody(loginSchema), loginHandler);
router.post('/logout', logoutHandler);
router.get('/me', authenticate, meHandler);

export default router;
