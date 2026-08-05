import { Router } from 'express';
import { getAnalyticsHandler, getStatsHandler } from '../controllers/admin.controller';
import { authenticate } from '../middleware/authenticate';
import { authorize } from '../middleware/authorize';

const router = Router();

router.use(authenticate, authorize('ADMIN'));
router.get('/stats', getStatsHandler);
// Vaqt bo'yicha monitoring: ?days=7|30|90
router.get('/analytics', getAnalyticsHandler);

export default router;
