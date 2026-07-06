import { CorsOptions } from 'cors';
import { env } from './env';

const PROD_ORIGIN = 'https://datalifecenter.vercel.app';
const PREVIEW_ORIGIN_REGEX = /^https:\/\/datalifecenter-.*-rawshanbekwebs-projects\.vercel\.app$/;

export const corsOptions: CorsOptions = {
  origin: (origin, callback) => {
    // Postman, server-to-server so'rovlar uchun (origin header bo'lmaydi)
    if (!origin) return callback(null, true);

    const isAllowed =
      origin === PROD_ORIGIN ||
      origin === env.FRONTEND_URL ||
      PREVIEW_ORIGIN_REGEX.test(origin);

    if (isAllowed) {
      callback(null, true);
    } else {
      callback(new Error(`Not allowed by CORS: ${origin}`));
    }
  },
  credentials: true,
};