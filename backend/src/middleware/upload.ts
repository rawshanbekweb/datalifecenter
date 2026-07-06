import crypto from 'crypto';
import { RequestHandler } from 'express';
import multer from 'multer';
import { ApiError } from '../utils/ApiError';
import {
  IMAGES_DIR,
  IMAGE_MAX_BYTES,
  IMAGE_MIME_EXT,
  VIDEOS_DIR,
  VIDEO_MAX_BYTES,
  VIDEO_MIME_EXT,
} from '../config/uploads';

function makeStorage(dir: string, mimeExt: Record<string, string>) {
  return multer.diskStorage({
    destination: dir,
    filename: (_req, file, cb) => {
      // Foydalanuvchi yuborgan nom ishlatilmaydi — path traversal'ga qarshi
      cb(null, `${Date.now()}-${crypto.randomBytes(8).toString('hex')}${mimeExt[file.mimetype]}`);
    },
  });
}

function makeFilter(mimeExt: Record<string, string>, errorMessage: string): multer.Options['fileFilter'] {
  return (_req, file, cb) => {
    if (!mimeExt[file.mimetype]) {
      return cb(ApiError.badRequest(errorMessage, 'INVALID_FILE_TYPE'));
    }
    cb(null, true);
  };
}

const imageMulter = multer({
  storage: makeStorage(IMAGES_DIR, IMAGE_MIME_EXT),
  limits: { fileSize: IMAGE_MAX_BYTES, files: 1 },
  fileFilter: makeFilter(IMAGE_MIME_EXT, 'Faqat JPG, PNG, WEBP yoki GIF rasm yuklash mumkin'),
});

const videoMulter = multer({
  storage: makeStorage(VIDEOS_DIR, VIDEO_MIME_EXT),
  limits: { fileSize: VIDEO_MAX_BYTES, files: 1 },
  fileFilter: makeFilter(VIDEO_MIME_EXT, 'Faqat MP4 yoki WEBM video yuklash mumkin'),
});

// Multer xatolarini API formatiga o'girib beradi
function wrapMulter(mw: RequestHandler, sizeMessage: string): RequestHandler {
  return (req, res, next) =>
    mw(req, res, (err: unknown) => {
      if (!err) return next();
      if (err instanceof multer.MulterError) {
        if (err.code === 'LIMIT_FILE_SIZE') return next(ApiError.badRequest(sizeMessage, 'FILE_TOO_LARGE'));
        return next(ApiError.badRequest(err.message, 'UPLOAD_ERROR'));
      }
      next(err);
    });
}

export const uploadImage = wrapMulter(imageMulter.single('file'), "Rasm hajmi 5 MB dan oshmasligi kerak");
export const uploadVideo = wrapMulter(videoMulter.single('file'), "Video hajmi 500 MB dan oshmasligi kerak");
