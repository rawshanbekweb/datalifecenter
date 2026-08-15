import { Router } from 'express';
import {
  certificateHandler,
  createEnrollmentHandler,
  listEnrollmentsAdminHandler,
  mockPayHandler,
  myEnrollmentsHandler,
  receiptHandler,
  submitReceiptHandler,
  updateEnrollmentAdminHandler,
} from '../controllers/enrollments.controller';
import {
  addEnrollmentPaymentHandler,
  deleteEnrollmentPaymentHandler,
  listDebtorsHandler,
  listEnrollmentPaymentsHandler,
} from '../controllers/enrollmentPayments.controller';
import { addPaymentSchema, listDebtorsQuerySchema } from '../validators/enrollmentPayments.validator';
import { authenticate } from '../middleware/authenticate';
import { authorize } from '../middleware/authorize';
import { devOnly } from '../middleware/devOnly';
import { validateBody, validateQuery } from '../middleware/validateRequest';
import {
  createEnrollmentSchema,
  listEnrollmentsAdminQuerySchema,
  submitReceiptSchema,
  updateEnrollmentAdminSchema,
} from '../validators/enrollments.validator';

const router = Router();

router.use(authenticate);
router.get('/admin', authorize('ADMIN'), validateQuery(listEnrollmentsAdminQuerySchema), listEnrollmentsAdminHandler);
// Qarzdorlar — '/:id' dan OLDIN turishi shart, aks holda "debtors" id bo'lib ketardi
router.get('/debtors', authorize('ADMIN'), validateQuery(listDebtorsQuerySchema), listDebtorsHandler);
router.patch('/:id', authorize('ADMIN'), validateBody(updateEnrollmentAdminSchema), updateEnrollmentAdminHandler);
router.post('/', validateBody(createEnrollmentSchema), createEnrollmentHandler);
router.get('/me', myEnrollmentsHandler);
router.post('/:id/receipt', validateBody(submitReceiptSchema), submitReceiptHandler);
router.get('/:id/receipt', receiptHandler);
router.get('/:id/certificate', certificateHandler);
router.post('/:id/mock-pay', devOnly, mockPayHandler);

// To'lov daftari: o'quvchi o'zinikini ko'radi, yozish faqat adminda
router.get('/:id/payments', listEnrollmentPaymentsHandler);
router.post('/:id/payments', authorize('ADMIN'), validateBody(addPaymentSchema), addEnrollmentPaymentHandler);
router.delete('/:id/payments/:paymentId', authorize('ADMIN'), deleteEnrollmentPaymentHandler);

export default router;
