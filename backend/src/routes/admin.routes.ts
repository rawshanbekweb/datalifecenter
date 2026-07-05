import { Router } from 'express';
import { getStatsHandler } from '../controllers/admin.controller';
import { authenticate } from '../middleware/authenticate';
import { authorize } from '../middleware/authorize';

const router = Router();

router.use(authenticate, authorize('ADMIN'));
router.get('/stats', getStatsHandler);

export default router;
