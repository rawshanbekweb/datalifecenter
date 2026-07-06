import { Router } from 'express';
import { uploadImageHandler, uploadVideoHandler } from '../controllers/uploads.controller';
import { authenticate } from '../middleware/authenticate';
import { authorize } from '../middleware/authorize';
import { uploadImage, uploadVideo } from '../middleware/upload';

const router = Router();

router.use(authenticate);
// Rasm — har qanday tizimga kirgan foydalanuvchi (profil avatari uchun ham)
router.post('/image', uploadImage, uploadImageHandler);
// Video — faqat mentor va admin (dars materiallari)
router.post('/video', authorize('MENTOR', 'ADMIN'), uploadVideo, uploadVideoHandler);

export default router;
