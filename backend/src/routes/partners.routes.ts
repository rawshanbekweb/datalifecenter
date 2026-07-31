import { Router } from 'express';
import {
  createPartnerHandler,
  deletePartnerHandler,
  listPartnersHandler,
  updatePartnerHandler,
} from '../controllers/partners.controller';
import { authenticate } from '../middleware/authenticate';
import { authorize } from '../middleware/authorize';
import { publicCache } from '../middleware/publicCache';
import { validateBody } from '../middleware/validateRequest';
import { createPartnerSchema, updatePartnerSchema } from '../validators/partners.validator';

const router = Router();

router.get('/', publicCache(300), listPartnersHandler);
router.post('/', authenticate, authorize('ADMIN'), validateBody(createPartnerSchema), createPartnerHandler);
router.put('/:id', authenticate, authorize('ADMIN'), validateBody(updatePartnerSchema), updatePartnerHandler);
router.delete('/:id', authenticate, authorize('ADMIN'), deletePartnerHandler);

export default router;
