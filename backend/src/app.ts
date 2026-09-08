import path from 'path';
import express from 'express';
import compression from 'compression';
import cors from 'cors';
import helmet from 'helmet';
import cookieParser from 'cookie-parser';
import rateLimit from 'express-rate-limit';
import { corsOptions } from './config/cors';
import { env } from './config/env';
import { Sentry, sentryEnabled } from './config/sentry';
import { APKS_DIR, IMAGES_DIR, VIDEOS_DIR } from './config/uploads';
import routes from './routes';
import { csrfProtect } from './middleware/csrfProtect';
import { resolveLocale } from './middleware/locale';
import { clearPublicCache } from './middleware/publicCache';
import { errorHandler } from './middleware/errorHandler';
import { notFoundHandler } from './middleware/notFoundHandler';
import { tooManyRequestsHandler } from './utils/rateLimitResponse';
import { translateErrorMessage } from './i18n/translateError';
import { verifyLocalVideoToken } from './utils/videoAccess';

const app = express();

// Render/har qanday reverse-proxy ortida req.protocol va req.ip to'g'ri bo'lishi uchun
// (aks holda upload URL'lar http:// bo'lib, HTTPS saytda mixed-content sabab bloklanadi)
app.set('trust proxy', 1);

// crossOriginResourcePolicy: /uploads rasmlari boshqa origin'dagi (Vercel) frontend'da ko'rinishi uchun
app.use(helmet({ crossOriginResourcePolicy: { policy: 'cross-origin' } }));
// JSON javoblarni gzip bilan siqish — katta ro'yxatlar (kurslar, foydalanuvchilar)
// sekin tarmoqda bir necha barobar tez yetib boradi. SSE oqimi siqilmaydi:
// compression bufferlab yuboradi va real-vaqt bildirishnomalar kechikib qoladi.
app.use(compression({
  filter: (req, res) => req.path !== '/api/notifications/stream' && compression.filter(req, res),
}));
app.use(cors(corsOptions));
// Aniq hajm chegarasi: hech bir endpoint 100 KB'dan katta JSON kutmaydi
// (fayllar multer orqali alohida yuklanadi), shuning uchun undan kattasi
// faqat xotirani bekorga band qilishga urinish bo'ladi.
app.use(express.json({ limit: '100kb' }));
// Click webhook'lari application/x-www-form-urlencoded yuboradi (Payme JSON ishlatadi, express.json() yetarli)
app.use(express.urlencoded({ extended: true, limit: '100kb' }));
app.use(cookieParser());
// Til BUTUN ilova bo'ylab va eng boshida aniqlanadi. Ilgari u faqat `/api`
// zanjirining o'rtasida turardi, ya'ni undan oldingi middleware'lar
// (chastota chegarasi, CSRF) hamda /uploads yo'llari `req.locale` ni ko'rmay,
// xatolarni doim o'zbekcha qaytarardi.
app.use(resolveLocale);

// Yuklangan rasmlar — nomlari tasodifiy bo'lgani uchun uzoq keshlash xavfsiz, ochiq qoladi
app.use('/uploads/images', express.static(IMAGES_DIR, { maxAge: '30d', immutable: true, index: false, dotfiles: 'deny' }));

// O'yin APK fayllari — rasm kabi ochiq (tekshiruv shart emas, erkin yuklab olinadi)
app.use('/uploads/apks', express.static(APKS_DIR, { maxAge: '30d', immutable: true, index: false, dotfiles: 'deny' }));

// Video darslar (lokal disk rejimi) — enrollment tekshiruvidan o'tgan foydalanuvchiga
// courses.service.ts orqali beriladigan vaqtinchalik ?exp&sig tokensiz ochilmaydi
// (aks holda pullik kurs videosi hech qanday tekshiruvsiz, muddatsiz oshkor bo'lardi).
app.get('/uploads/videos/:filename', (req, res) => {
  const filename = path.basename(req.params.filename);
  if (!verifyLocalVideoToken(filename, req.query.exp, req.query.sig)) {
    res.status(403).json({ success: false, error: { message: translateErrorMessage('Havola yaroqsiz yoki muddati tugagan', req.locale), code: 'VIDEO_TOKEN_INVALID' } });
    return;
  }
  res.sendFile(filename, { root: VIDEOS_DIR, maxAge: '6h', dotfiles: 'deny' }, (err) => {
    if (err && !res.headersSent) {
      res.status(404).json({ success: false, error: { message: translateErrorMessage('Fayl topilmadi', req.locale), code: 'NOT_FOUND' } });
    }
  });
});

const tooManyRequests = tooManyRequestsHandler("Juda ko'p so'rov yuborildi. Birozdan keyin qayta urinib ko'ring.");

const isRead = (req: express.Request): boolean => req.method === 'GET' || req.method === 'HEAD';

// SSE oqimi uzoq yashaydi va uzilganda backoff bilan qayta ulanadi — har ulanish
// limitga sanalsa umumiy NAT ortidagi IP butun API'dan bloklanib qolardi
const alwaysSkip = (req: express.Request): boolean =>
  env.NODE_ENV === 'test' || req.path === '/notifications/stream';

/**
 * O'QISH limiti — ATAYIN keng.
 *
 * Rate limit IP bo'yicha hisoblaydi, lekin bitta Wi-Fi (tadbir zali, ofis,
 * universitet) yoki mobil operatorning CGNAT'i ortidagi YUZLAB mehmon
 * serverga BITTA IP bo'lib ko'rinadi. Bosh sahifa ~7 ta GET qiladi, ya'ni
 * tor limitda 150 nafar mehmondan keyin butun zal saytdan bloklanardi —
 * ochilish marosimida bu eng ehtimolli nosozlik ssenariysi edi.
 *
 * Keng limit xavfsiz, chunki bu javoblar publicCache tufayli xotiradan
 * beriladi: DB'ga tegmaydi va deyarli CPU sarflamaydi.
 *
 * 3000/daqiqa raqami yuklama testidan olingan: 200 mehmon bosh sahifani bir
 * vaqtda ochsa ~1400 so'rov ketadi, ya'ni 1000 limitida taxminan har uchinchi
 * so'rov bloklanardi. Hozirgi qiymat ~400 nafar bir vaqtdagi mehmonni
 * ko'taradi va shunga qaramay jiddiy skreyper/toshbo'ron urinishini
 * to'xtatadi. Kamaytirish kerak bo'lsa — shu yagona raqamni o'zgartiring.
 */
const readLimiter = rateLimit({
  windowMs: 60 * 1000,
  limit: 3000,
  standardHeaders: true,
  legacyHeaders: false,
  skip: (req) => alwaysSkip(req) || !isRead(req),
  handler: tooManyRequests,
});

/**
 * YOZISH limiti — qattiqroq, chunki har bir POST/PATCH/DELETE DB yozuvi
 * demak va aynan shular suiiste'molga ochiq (sharh spami, soxta ro'yxatdan
 * o'tish to'lqini). Auth va kontakt route'larida bundan ham tor, maqsadli
 * limitlar bor — bu umumiy zaxira to'siq.
 */
const writeLimiter = rateLimit({
  windowMs: 5 * 60 * 1000,
  limit: 300,
  standardHeaders: true,
  legacyHeaders: false,
  skip: (req) => alwaysSkip(req) || isRead(req),
  handler: tooManyRequests,
});

/**
 * Muvaffaqiyatli har qanday o'zgartirishdan keyin ochiq keshni tozalaymiz:
 * admin kursni yoki sayt sozlamasini tahrirlaganda o'zgarish TTL tugashini
 * kutmasdan darhol saytda ko'rinadi. Kesh butunlay tozalanadi — bu arzon
 * (keyingi so'rov uni qayta to'ldiradi) va qaysi yozuv qaysi endpoint'ga
 * ta'sir qilishini kuzatishdan ko'ra ancha ishonchli.
 *
 * `finish` hodisasiga route'lardan OLDIN obuna bo'lish shart — javob
 * yuborilgach ro'yxatdan o'tkazishga urinish kech bo'lardi.
 *
 * ISTISNO: handler `res.locals.skipCacheInvalidation` qo'ysa kesh
 * tozalanmaydi. Bu yoqtirish/ko'rish hisoblagichlari uchun — ular juda
 * tez-tez yoziladi va har bosishda butun keshni tozalash yuklamaga
 * chidamlilikni yo'qqa chiqarardi.
 */
const invalidateCacheOnWrite: express.RequestHandler = (req, res, next) => {
  if (!isRead(req)) {
    res.on('finish', () => {
      if (res.locals.skipCacheInvalidation) return;
      if (res.statusCode >= 200 && res.statusCode < 400) clearPublicCache();
    });
  }
  next();
};

app.use('/api', readLimiter, writeLimiter, csrfProtect, invalidateCacheOnWrite, routes);

app.use(notFoundHandler);
// Sentry'ga xatolar bizning errorHandler'dan OLDIN yoziladi (DSN sozlangan bo'lsa)
if (sentryEnabled) {
  Sentry.setupExpressErrorHandler(app);
}
app.use(errorHandler);

export default app;
