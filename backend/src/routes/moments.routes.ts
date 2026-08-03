import { Router } from 'express';
import {
  createMomentHandler,
  deleteMomentHandler,
  listMomentsAdminHandler,
  listMomentsHandler,
  updateMomentHandler,
} from '../controllers/moments.controller';
import { authenticate } from '../middleware/authenticate';
import { authorize } from '../middleware/authorize';
import { publicCache } from '../middleware/publicCache';
import { validateBody } from '../middleware/validateRequest';
import { createMomentSchema, updateMomentSchema } from '../validators/moments.validator';

const router = Router();

router.get('/', publicCache(120), listMomentsHandler);
router.get('/admin', authenticate, authorize('ADMIN'), listMomentsAdminHandler);
router.post('/', authenticate, authorize('ADMIN'), validateBody(createMomentSchema), createMomentHandler);
router.put('/:id', authenticate, authorize('ADMIN'), validateBody(updateMomentSchema), updateMomentHandler);
router.delete('/:id', authenticate, authorize('ADMIN'), deleteMomentHandler);

export default router;
