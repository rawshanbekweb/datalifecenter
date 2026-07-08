import fs from 'fs/promises';
import { Request, Response } from 'express';
import { asyncHandler } from '../utils/asyncHandler';
import { sendSuccess } from '../utils/ApiResponse';
import { ApiError } from '../utils/ApiError';
import { verifyFileSignature } from '../utils/fileSignature';
import { cloudinaryEnabled, uploadToCloudinary } from '../services/storage.service';

function publicUrl(req: Request, folder: 'images' | 'videos', filename: string): string {
  return `${req.protocol}://${req.get('host')}/uploads/${folder}/${filename}`;
}

function makeUploadHandler(folder: 'images' | 'videos') {
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

    // Cloudinary sozlangan bo'lsa fayl bulutga ko'chadi (ephemeral hostingda majburiy),
    // lokal nusxa o'chiriladi. Sozlanmagan bo'lsa avvalgidek /uploads'dan beriladi.
    let url = publicUrl(req, folder, file.filename);
    if (cloudinaryEnabled) {
      try {
        const uploaded = await uploadToCloudinary(file.path, folder);
        url = uploaded.url;
      } catch (err) {
        console.error('Cloudinary yuklash xatosi:', err);
        await fs.unlink(file.path).catch(() => {});
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
