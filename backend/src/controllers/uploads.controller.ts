import fs from 'fs/promises';
import { Request, Response } from 'express';
import { asyncHandler } from '../utils/asyncHandler';
import { sendSuccess } from '../utils/ApiResponse';
import { ApiError } from '../utils/ApiError';
import { verifyFileSignature } from '../utils/fileSignature';

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

    sendSuccess(res, {
      url: publicUrl(req, folder, file.filename),
      filename: file.filename,
      size: file.size,
      mimeType: file.mimetype,
    }, 201);
  });
}

export const uploadImageHandler = makeUploadHandler('images');
export const uploadVideoHandler = makeUploadHandler('videos');
