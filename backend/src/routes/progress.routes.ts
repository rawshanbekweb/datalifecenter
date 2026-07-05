import { Router } from 'express';
import { completeLessonHandler, uncompleteLessonHandler } from '../controllers/progress.controller';
import { authenticate } from '../middleware/authenticate';

const router = Router();

router.use(authenticate);
router.post('/lessons/:lessonId/complete', completeLessonHandler);
router.delete('/lessons/:lessonId/complete', uncompleteLessonHandler);

export default router;
