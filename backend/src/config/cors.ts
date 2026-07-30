import { CorsOptions } from 'cors';
import { env } from './env';

// Saytning doimiy manzillari: custom domen (apex + www) va Vercel'ning standart domeni
const STATIC_ORIGINS = [
  'https://datalife.uz',
  'https://www.datalife.uz',
  'https://datalifecenter.vercel.app',
];
const PREVIEW_ORIGIN_REGEX = /^https:\/\/datalifecenter-.*-rawshanbekwebs-projects\.vercel\.app$/;

// FRONTEND_URL oxirida "/" bilan yozilsa origin bilan solishtirish ishlamay qolardi
const normalize = (value: string) => value.trim().replace(/\/+$/, '');

// EXTRA_ALLOWED_ORIGINS — yangi domen ulanganda kodni o'zgartirmasdan
// (Render'da env qo'shib) ruxsat berish uchun, vergul bilan ajratiladi
const ALLOWED_ORIGINS = new Set(
  [...STATIC_ORIGINS, env.FRONTEND_URL, ...(env.EXTRA_ALLOWED_ORIGINS?.split(',') ?? [])]
    .map(normalize)
    .filter(Boolean),
);

// CORS va CSRF (Origin tekshiruvi) bitta ro'yxatdan ishlaydi
export function isAllowedOrigin(origin: string): boolean {
  return ALLOWED_ORIGINS.has(normalize(origin)) || PREVIEW_ORIGIN_REGEX.test(origin);
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
