import { Router } from 'express';
import {
  createGameHandler,
  deleteGameHandler,
  downloadGameHandler,
  listGamesAdminHandler,
  listGamesHandler,
  updateGameHandler,
} from '../controllers/games.controller';
import { authenticate } from '../middleware/authenticate';
import { authorize } from '../middleware/authorize';
import { publicCache } from '../middleware/publicCache';
import { validateBody } from '../middleware/validateRequest';
import { createGameSchema, updateGameSchema } from '../validators/games.validator';

const router = Router();

router.get('/', publicCache(120), listGamesHandler);
router.get('/admin', authenticate, authorize('ADMIN'), listGamesAdminHandler);
router.post('/', authenticate, authorize('ADMIN'), validateBody(createGameSchema), createGameHandler);
router.put('/:id', authenticate, authorize('ADMIN'), validateBody(updateGameSchema), updateGameHandler);
router.delete('/:id', authenticate, authorize('ADMIN'), deleteGameHandler);
// Ochiq — auth yo'q. POST ATAYIN: GET so'rov brauzer/xavfsizlik skaneri
// tomonidan so'ralmasdan yuborilishi mumkin (prefetch) va hisobni soxta
// oshiradi — sanoq faqat haqiqiy bosishda (frontend onClick) yuboriladi.
router.post('/:id/download', downloadGameHandler);

export default router;
