import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import cookieParser from 'cookie-parser';
import rateLimit from 'express-rate-limit';
import { corsOptions } from './config/cors';
import { env } from './config/env';
import { Sentry, sentryEnabled } from './config/sentry';
import { UPLOADS_ROOT } from './config/uploads';
import routes from './routes';
import { csrfProtect } from './middleware/csrfProtect';
import { errorHandler } from './middleware/errorHandler';
import { notFoundHandler } from './middleware/notFoundHandler';

const app = express();

// Render/har qanday reverse-proxy ortida req.protocol va req.ip to'g'ri bo'lishi uchun
// (aks holda upload URL'lar http:// bo'lib, HTTPS saytda mixed-content sabab bloklanadi)
app.set('trust proxy', 1);

// crossOriginResourcePolicy: /uploads rasmlari boshqa origin'dagi (Vercel) frontend'da ko'rinishi uchun
app.use(helmet({ crossOriginResourcePolicy: { policy: 'cross-origin' } }));
app.use(cors(corsOptions));
app.use(express.json());
app.use(cookieParser());

// Yuklangan fayllar — nomlari tasodifiy bo'lgani uchun uzoq keshlash xavfsiz
app.use('/uploads', express.static(UPLOADS_ROOT, { maxAge: '30d', immutable: true, index: false, dotfiles: 'deny' }));

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
