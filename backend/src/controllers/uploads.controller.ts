import fs from 'fs/promises';
import { Request, Response } from 'express';
import { asyncHandler } from '../utils/asyncHandler';
import { sendSuccess } from '../utils/ApiResponse';
import { ApiError } from '../utils/ApiError';
import { verifyFileSignature } from '../utils/fileSignature';
import { APK_MAX_BYTES, IMAGE_MAX_BYTES, VIDEO_MAX_BYTES } from '../config/uploads';
import { cloudStorageEnabled, storageProvider, uploadToCloud } from '../services/storage.service';
import { StorageLimitError } from '../services/storage/supabase';

function publicUrl(req: Request, folder: 'images' | 'videos' | 'apks', filename: string): string {
  return `${req.protocol}://${req.get('host')}/uploads/${folder}/${filename}`;
}

function makeUploadHandler(folder: 'images' | 'videos' | 'apks') {
  return asyncHandler(async (req: Request, res: Response) => {
    const file = req.file;
    if (!file) {
      throw ApiError.badRequest('Fayl yuborilmadi', 'NO_FILE');
    }

    // Mime turi fayl mazmuniga mos kelishini tekshiramiz (magic bytes)
    const genuine = await verifyFileSignature(file.path, file.mimetype);
    if (!genuine) {
      await fs.unlink(file.path).catch(() => {});
      throw ApiError.badRequest("Fayl mazmuni e'lon qilingan turiga mos emas", 'FILE_SIGNATURE_MISMATCH');
    }

    // Bulut xotira sozlangan bo'lsa fayl u yerga ko'chadi (ephemeral hostingda
    // majburiy), lokal nusxa o'chiriladi. Sozlanmagan bo'lsa avvalgidek /uploads'dan beriladi.
    let url = publicUrl(req, folder, file.filename);
    if (cloudStorageEnabled) {
      try {
        const uploaded = await uploadToCloud(file.path, folder, file.mimetype);
        url = uploaded.url;
      } catch (err) {
        console.error('Bulut xotiraga yuklash xatosi:', err);
        await fs.unlink(file.path).catch(() => {});
        // Bulut xotiraning o'z chegarasi bizning limitdan past — buni "qayta
        // urinib ko'ring" deb ko'rsatish noto'g'ri, qayta urinish yordam bermaydi
        if (err instanceof StorageLimitError) {
          throw ApiError.badRequest(
            "Fayl bulut xotira hajmi chegarasidan katta. Kichikroq fayl yuklang yoki administrator xotira rejasini oshirsin.",
            'STORAGE_LIMIT_EXCEEDED'
          );
        }
        throw ApiError.badRequest("Faylni bulut xotirasiga yuklab bo'lmadi. Qayta urinib ko'ring.", 'CLOUD_UPLOAD_FAILED');
      }
      await fs.unlink(file.path).catch(() => {});
    }

    sendSuccess(res, {
      url,
      filename: file.filename,
      size: file.size,
      mimeType: file.mimetype,
    }, 201);
  });
}

export const uploadImageHandler = makeUploadHandler('images');
export const uploadVideoHandler = makeUploadHandler('videos');
export const uploadApkHandler = makeUploadHandler('apks');

/**
 * Yuklash sozlamalari holati.
 *
 * Bulut xotira o'chiq bo'lsa yuklash muvaffaqiyatli tugaydi, lekin fayl
 * ephemeral diskda qoladi va keyingi deployda yo'qoladi. Bu jimgina
 * yo'qotish: admin buni faqat oylar keyin, sayt bo'ylab singan rasmlarni
 * ko'rganda sezadi. Shuning uchun panel yuklashdan OLDIN ogohlantirsin.
 *
 * Hajm limitlari ham shu yerdan beriladi — mijoz katta faylni tarmoqqa
 * chiqarmasdan, tanlangan zahoti rad etsin (limit ikki joyda qo'lda
 * yozilmasin degani ham).
 */
export const uploadConfigHandler = asyncHandler(async (_req: Request, res: Response) => {
  sendSuccess(res, {
    cloudStorage: cloudStorageEnabled,
    provider: storageProvider,
    imageMaxBytes: IMAGE_MAX_BYTES,
    videoMaxBytes: VIDEO_MAX_BYTES,
    apkMaxBytes: APK_MAX_BYTES,
  });
});
