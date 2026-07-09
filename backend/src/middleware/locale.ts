import { NextFunction, Request, Response } from 'express';
import { DEFAULT_LOCALE, isSupportedLocale } from '../config/locale';

// Frontend har bir so'rovga X-Locale header qo'shadi (api/client.ts) — shu yerda
// o'qib tekshiriladi va req.locale'ga yoziladi. Noto'g'ri/yo'q bo'lsa o'zbekchaga tushadi.
export function resolveLocale(req: Request, _res: Response, next: NextFunction) {
  const candidate = req.header('x-locale') ?? req.query.locale;
  req.locale = isSupportedLocale(candidate) ? candidate : DEFAULT_LOCALE;
  next();
}
