import { Router } from 'express';
import { uploadApkHandler, uploadConfigHandler, uploadImageHandler, uploadVideoHandler } from '../controllers/uploads.controller';
import { authenticate } from '../middleware/authenticate';
import { authorize } from '../middleware/authorize';
import { uploadApk, uploadImage, uploadVideo } from '../middleware/upload';

const router = Router();

router.use(authenticate);
// Bulut xotira yoqilganmi — panel yuklashdan oldin ogohlantirishi uchun
router.get('/config', uploadConfigHandler);
// Rasm — har qanday tizimga kirgan foydalanuvchi (profil avatari uchun ham)
router.post('/image', uploadImage, uploadImageHandler);
// Video — faqat mentor va admin (dars materiallari)
router.post('/video', authorize('MENTOR', 'ADMIN'), uploadVideo, uploadVideoHandler);
// APK — faqat admin (o'yin fayli)
router.post('/apk', authorize('ADMIN'), uploadApk, uploadApkHandler);

export default router;
