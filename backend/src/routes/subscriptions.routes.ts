import { Router } from 'express';
import {
  createSubscriptionHandler,
  listSubscriptionsAdminHandler,
  mySubscriptionHandler,
  subscriptionReceiptHandler,
  submitSubscriptionReceiptHandler,
  updateSubscriptionAdminHandler,
} from '../controllers/subscriptions.controller';
import { authenticate } from '../middleware/authenticate';
import { authorize } from '../middleware/authorize';
import { validateBody, validateQuery } from '../middleware/validateRequest';
import {
  listSubscriptionsAdminQuerySchema,
  submitSubscriptionReceiptSchema,
  updateSubscriptionAdminSchema,
} from '../validators/subscriptions.validator';

const router = Router();

router.use(authenticate);
router.get('/admin', authorize('ADMIN'), validateQuery(listSubscriptionsAdminQuerySchema), listSubscriptionsAdminHandler);
router.patch('/:id', authorize('ADMIN'), validateBody(updateSubscriptionAdminSchema), updateSubscriptionAdminHandler);
router.post('/', createSubscriptionHandler);
router.get('/me', mySubscriptionHandler);
router.post('/:id/receipt', validateBody(submitSubscriptionReceiptSchema), submitSubscriptionReceiptHandler);
router.get('/:id/receipt', subscriptionReceiptHandler);

export default router;
