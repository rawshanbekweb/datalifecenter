import { Request, Response } from 'express';
import { translateErrorMessage } from '../i18n/translateError';

/**
 * Chastota chegarasiga urilgandagi javob.
 *
 * `rateLimit({ message: {...} })` STATIK obyekt kutadi — u so'rov tilini
 * bilmaydi, shuning uchun bu limitlar mijoz qaysi tilda bo'lishidan qat'i
 * nazar o'zbekcha javob berardi. `handler` esa `req` ni ko'radi, ya'ni
 * `req.locale` bo'yicha tarjima qilish mumkin.
 *
 * MUHIM: shu ishlashi uchun `resolveLocale` limitlardan OLDIN turishi kerak
 * (app.ts dagi middleware zanjiriga qarang).
 */
export function tooManyRequestsHandler(message: string) {
  return (req: Request, res: Response): void => {
    res.status(429).json({
      success: false,
      error: { message: translateErrorMessage(message, req.locale), code: 'TOO_MANY_REQUESTS' },
    });
  };
}
