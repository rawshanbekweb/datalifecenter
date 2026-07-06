import fs from 'fs';
import path from 'path';

export const UPLOADS_ROOT = path.resolve(__dirname, '../../uploads');
export const IMAGES_DIR = path.join(UPLOADS_ROOT, 'images');
export const VIDEOS_DIR = path.join(UPLOADS_ROOT, 'videos');

for (const dir of [UPLOADS_ROOT, IMAGES_DIR, VIDEOS_DIR]) {
  fs.mkdirSync(dir, { recursive: true });
}

export const IMAGE_MAX_BYTES = 5 * 1024 * 1024; // 5 MB
export const VIDEO_MAX_BYTES = 500 * 1024 * 1024; // 500 MB

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
