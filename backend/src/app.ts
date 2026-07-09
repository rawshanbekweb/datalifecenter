import path from 'path';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import cookieParser from 'cookie-parser';
import rateLimit from 'express-rate-limit';
import { corsOptions } from './config/cors';
import { env } from './config/env';
import { Sentry, sentryEnabled } from './config/sentry';
import { IMAGES_DIR, VIDEOS_DIR } from './config/uploads';
import routes from './routes';
import { csrfProtect } from './middleware/csrfProtect';
import { errorHandler } from './middleware/errorHandler';
import { notFoundHandler } from './middleware/notFoundHandler';
import { verifyLocalVideoToken } from './utils/videoAccess';

const app = express();

// Render/har qanday reverse-proxy ortida req.protocol va req.ip to'g'ri bo'lishi uchun
// (aks holda upload URL'lar http:// bo'lib, HTTPS saytda mixed-content sabab bloklanadi)
app.set('trust proxy', 1);

// crossOriginResourcePolicy: /uploads rasmlari boshqa origin'dagi (Vercel) frontend'da ko'rinishi uchun
app.use(helmet({ crossOriginResourcePolicy: { policy: 'cross-origin' } }));
app.use(cors(corsOptions));
app.use(express.json());
// Click webhook'lari application/x-www-form-urlencoded yuboradi (Payme JSON ishlatadi, express.json() yetarli)
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

// Yuklangan rasmlar — nomlari tasodifiy bo'lgani uchun uzoq keshlash xavfsiz, ochiq qoladi
app.use('/uploads/images', express.static(IMAGES_DIR, { maxAge: '30d', immutable: true, index: false, dotfiles: 'deny' }));

// Video darslar (lokal disk rejimi) — enrollment tekshiruvidan o'tgan foydalanuvchiga
// courses.service.ts orqali beriladigan vaqtinchalik ?exp&sig tokensiz ochilmaydi
// (aks holda pullik kurs videosi hech qanday tekshiruvsiz, muddatsiz oshkor bo'lardi).
app.get('/uploads/videos/:filename', (req, res) => {
  const filename = path.basename(req.params.filename);
  if (!verifyLocalVideoToken(filename, req.query.exp, req.query.sig)) {
    res.status(403).json({ success: false, error: { message: 'Havola yaroqsiz yoki muddati tugagan', code: 'VIDEO_TOKEN_INVALID' } });
    return;
  }
  res.sendFile(filename, { root: VIDEOS_DIR, maxAge: '6h', dotfiles: 'deny' }, (err) => {
    if (err && !res.headersSent) {
      res.status(404).json({ success: false, error: { message: 'Fayl topilmadi', code: 'NOT_FOUND' } });
    }
  });
});

// Umumiy API limiti — bitta IP'dan 15 daqiqada 1000 so'rov (auth route'larida qattiqroq limitlar bor)
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 1000,
  standardHeaders: true,
  legacyHeaders: false,
  skip: () => env.NODE_ENV === 'test',
  message: { success: false, error: { message: "Juda ko'p so'rov yuborildi. Birozdan keyin qayta urinib ko'ring.", code: 'TOO_MANY_REQUESTS' } },
});

app.use('/api', apiLimiter, csrfProtect, routes);

app.use(notFoundHandler);
// Sentry'ga xatolar bizning errorHandler'dan OLDIN yoziladi (DSN sozlangan bo'lsa)
if (sentryEnabled) {
  Sentry.setupExpressErrorHandler(app);
}
app.use(errorHandler);

export default app;
