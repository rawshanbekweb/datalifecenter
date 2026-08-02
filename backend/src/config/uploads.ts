import fs from 'fs';
import path from 'path';
import { env } from './env';

export const UPLOADS_ROOT = path.resolve(__dirname, '../../uploads');
export const IMAGES_DIR = path.join(UPLOADS_ROOT, 'images');
export const VIDEOS_DIR = path.join(UPLOADS_ROOT, 'videos');

for (const dir of [UPLOADS_ROOT, IMAGES_DIR, VIDEOS_DIR]) {
  fs.mkdirSync(dir, { recursive: true });
}

// Sukut bo'yicha 15 MB / 500 MB; env orqali bulut xotira rejangizga moslanadi
// (masalan Supabase Free — loyiha bo'yicha 50 MB, VIDEO_MAX_MB=50 qo'yiladi).
export const IMAGE_MAX_BYTES = env.IMAGE_MAX_MB * 1024 * 1024;
export const VIDEO_MAX_BYTES = env.VIDEO_MAX_MB * 1024 * 1024;

/** Limitni xabarda ko'rsatish uchun — raqam bitta joyda tursin, matn undan kelib chiqsin */
export const toMb = (bytes: number): number => Math.round(bytes / (1024 * 1024));

// Ruxsat etilgan mime turlari va ularga mos kengaytmalar.
// Kengaytma foydalanuvchi yuborgan fayl nomidan emas, mime'dan olinadi.
export const IMAGE_MIME_EXT: Record<string, string> = {
  'image/jpeg': '.jpg',
  'image/png': '.png',
  'image/webp': '.webp',
  'image/gif': '.gif',
};

export const VIDEO_MIME_EXT: Record<string, string> = {
  'video/mp4': '.mp4',
  'video/webm': '.webm',
};
