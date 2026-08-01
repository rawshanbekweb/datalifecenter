// Sentry birinchi bo'lib yuklanishi kerak — keyingi importlardagi xatolarni ham tutadi
import './config/sentry';
import { env } from './config/env';
import app from './app';
import { cloudinaryEnabled } from './services/storage.service';

app.listen(env.PORT, () => {
  console.log(`DATA LIFE API http://localhost:${env.PORT}`);

  // Render/Railway'da lokal disk EPHEMERAL: har deploy va har uyg'onishda
  // tozalanadi. Bulut xotira sozlanmasa yuklash "ishlaganday" ko'rinadi —
  // rasm saqlanadi, URL bazaga yoziladi, lekin keyingi deploydan so'ng
  // o'sha URL 404 qaytaradi va sayt bo'ylab singan rasmlar paydo bo'ladi.
  // Bu jimgina yo'qotish bo'lgani uchun ishga tushishda baland ogohlantiramiz.
  if (!cloudinaryEnabled && env.NODE_ENV === 'production') {
    console.warn(
      '\n[OGOHLANTIRISH] CLOUDINARY_* sozlanmagan — yuklangan rasm va videolar ' +
      'lokal diskda saqlanadi va KEYINGI DEPLOYDA YO\'QOLADI.\n' +
      'Render/Railway kabi hostingda CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY ' +
      'va CLOUDINARY_API_SECRET kiritilishi shart.\n'
    );
  }
});
