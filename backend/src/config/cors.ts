import { CorsOptions } from 'cors';
import { env } from './env';

const PROD_ORIGIN = 'https://datalifecenter.vercel.app';
const PREVIEW_ORIGIN_REGEX = /^https:\/\/datalifecenter-.*-rawshanbekwebs-projects\.vercel\.app$/;

// CORS va CSRF (Origin tekshiruvi) bitta ro'yxatdan ishlaydi
export function isAllowedOrigin(origin: string): boolean {
  return (
    origin === PROD_ORIGIN ||
    origin === env.FRONTEND_URL ||
    PREVIEW_ORIGIN_REGEX.test(origin)
  );
}

export const corsOptions: CorsOptions = {
  // Ruxsatsiz origin'ga xato otmaymiz (500 bo'lib ketadi) — shunchaki CORS
  // headerlarisiz qaytaramiz: brauzer javobni o'qiy olmaydi, holatni
  // o'zgartiruvchi so'rovlarni esa csrfProtect 403 bilan to'xtatadi.
  origin: (origin, callback) => {
    callback(null, !origin || isAllowedOrigin(origin));
  },
  credentials: true,
};
