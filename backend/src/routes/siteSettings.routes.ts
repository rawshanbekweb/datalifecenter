import { Router } from 'express';
import { getSiteSettingsHandler, updateSiteSettingSectionHandler } from '../controllers/siteSettings.controller';
import { authenticate } from '../middleware/authenticate';
import { authorize } from '../middleware/authorize';

const router = Router();

router.get('/', getSiteSettingsHandler);
router.patch('/:section', authenticate, authorize('ADMIN'), updateSiteSettingSectionHandler);

export default router;
