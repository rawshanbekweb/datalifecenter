import * as Sentry from '@sentry/node';
import { env } from './env';

// SENTRY_DSN sozlangan bo'lsa xatolar Sentry'ga yuboriladi (sentry.io — bepul tarif yetadi).
// Sozlanmasa hech narsa yoqilmaydi — lokal ishlashga ta'sir qilmaydi.
export const sentryEnabled = Boolean(env.SENTRY_DSN);

if (sentryEnabled) {
  Sentry.init({
    dsn: env.SENTRY_DSN,
    environment: env.NODE_ENV,
    tracesSampleRate: 0.1,
  });
}

export { Sentry };
