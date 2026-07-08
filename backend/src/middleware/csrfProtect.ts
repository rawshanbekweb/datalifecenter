import { NextFunction, Request, Response } from 'express';
import { isAllowedOrigin } from '../config/cors';
import { ApiError } from '../utils/ApiError';

// Cookie'ga asoslangan autentifikatsiyada krossdomen HTML-form POST'lari cookie bilan
// yuboriladi (CORS buni to'xtatmaydi — u faqat javobni o'qishni cheklaydi).
// Brauzerlar krossdomen POST'da doim Origin header yuboradi — ruxsatsiz origin'dan
// kelgan holatni o'zgartiruvchi so'rovlarni shu yerda rad etamiz.
// Origin'siz so'rovlar (curl, mobil ilova, server-server) o'tkaziladi — ularda
// brauzer cookie'si baribir bo'lmaydi.
export function csrfProtect(req: Request, _res: Response, next: NextFunction) {
  if (req.method === 'GET' || req.method === 'HEAD' || req.method === 'OPTIONS') {
    return next();
  }

  const origin = req.headers.origin;
  if (origin && !isAllowedOrigin(origin)) {
    return next(ApiError.forbidden("So'rov manbai (Origin) ruxsat etilmagan", 'CSRF_ORIGIN_REJECTED'));
  }

  next();
}
