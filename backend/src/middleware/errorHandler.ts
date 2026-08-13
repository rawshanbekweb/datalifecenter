import { NextFunction, Request, Response } from 'express';
import { ApiError } from '../utils/ApiError';
import { env } from '../config/env';
import { translateErrorMessage } from '../i18n/translateError';

export function errorHandler(err: unknown, req: Request, res: Response, _next: NextFunction) {
  // Xato matnlari kodda o'zbekcha yozilgan — mijoz tiliga shu yerda, YAGONA
  // joyda o'giriladi (i18n/errorMessages.ts). Shu sababli 221 ta `ApiError`
  // chaqiruvining birortasini ham o'zgartirish kerak bo'lmadi.
  if (err instanceof ApiError) {
    return res.status(err.statusCode).json({
      success: false,
      error: { message: translateErrorMessage(err.message, req.locale), code: err.code },
    });
  }

  console.error(err);
  return res.status(500).json({
    success: false,
    error: {
      // Ishlab chiqarishda xatoning asl matni oshkor qilinmaydi (stack/SQL
      // tafsilotlari sizib chiqmasligi uchun) — shuning uchun faqat shu
      // umumiy matn tarjima qilinadi.
      message:
        env.NODE_ENV === 'production'
          ? translateErrorMessage('Serverda xatolik yuz berdi', req.locale)
          : String(err instanceof Error ? err.message : err),
      code: 'INTERNAL_ERROR',
    },
  });
}
