import { NextFunction, Request, Response } from 'express';
import { ApiError } from '../utils/ApiError';

/**
 * Anonim qurilma identifikatorini `X-Device-Id` header'idan o'qiydi.
 *
 * NEGA COOKIE EMAS: frontend va backend turli domenlarda joylashgan
 * (datalife.uz / vercel.app ↔ onrender.com) va Safari kabi brauzerlar
 * krossdomen cookie'ni bloklaydi. Loyihada autentifikatsiya ham aynan shu
 * sabab cookie'dan Bearer token + localStorage'ga o'tkazilgan — yoqtirish
 * hisoblagichi ham xuddi shu yo'ldan boradi, aks holda Safari
 * foydalanuvchilari har safar "yoqtirmagan" holatda ko'rinardi.
 *
 * Identifikatorni mijoz o'zi generatsiya qiladi (`crypto.randomUUID()`).
 * Bu uni soxtalashtirish mumkin degani — anonim yoqtirishda bu muqarrar
 * (cookie ham tozalanadi). Suiiste'mol miqyosi rate-limit bilan cheklanadi.
 */

// Faqat shakl tekshiruvi: UUID va shunga o'xshash identifikatorlar o'tadi,
// bazaga cheksiz uzun yoki g'alati satr tushmasligi kafolatlanadi
const DEVICE_ID_PATTERN = /^[A-Za-z0-9_-]{8,64}$/;

/** Header'dagi identifikatorni tekshirib qaytaradi (yaroqsiz bo'lsa undefined). */
function readDeviceId(req: Request): string | undefined {
  const raw = req.header('x-device-id');
  return raw && DEVICE_ID_PATTERN.test(raw) ? raw : undefined;
}

/** Identifikator bo'lsa o'qiydi, bo'lmasa ham o'tkazadi (statistika uchun). */
export function optionalDeviceId(req: Request, _res: Response, next: NextFunction): void {
  req.deviceId = readDeviceId(req);
  next();
}

/** Identifikator MAJBURIY (yoqtirish/ko'rish yozish uchun). */
export function requireDeviceId(req: Request, _res: Response, next: NextFunction): void {
  const deviceId = readDeviceId(req);
  if (!deviceId) {
    next(ApiError.badRequest('Qurilma identifikatori yuborilmadi', 'DEVICE_ID_REQUIRED'));
    return;
  }
  req.deviceId = deviceId;
  next();
}
