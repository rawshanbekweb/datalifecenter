import { Router } from 'express';
import {
  clickCompleteHandler,
  clickPrepareHandler,
  createCheckoutHandler,
  paymentConfigHandler,
  paymeRpcHandler,
} from '../controllers/payments.controller';
import { authenticate } from '../middleware/authenticate';
import { validateBody } from '../middleware/validateRequest';
import { createCheckoutSchema } from '../validators/payments.validator';

const router = Router();

// Ochiq — shlyuz sozlanganini frontend shundan biladi
router.get('/config', paymentConfigHandler);

// Talaba: checkout URL so'raydi (Click/Payme sahifasiga yo'naltirish uchun)
router.post('/checkout', authenticate, validateBody(createCheckoutSchema), createCheckoutHandler);

// Click/Payme server-server webhook'lari — auth cookie/token yubormaydi,
// o'z protokoli ichida (imzo/Basic Auth) tekshiriladi
router.post('/click/prepare', clickPrepareHandler);
router.post('/click/complete', clickCompleteHandler);
router.post('/payme', paymeRpcHandler);

export default router;
