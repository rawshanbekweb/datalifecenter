// Sentry birinchi bo'lib yuklanishi kerak — keyingi importlardagi xatolarni ham tutadi
import './config/sentry';
import { env } from './config/env';
import app from './app';
import { cloudStorageEnabled, storageProvider } from './services/storage.service';

app.listen(env.PORT, () => {
  console.log(`DATA LIFE API http://localhost:${env.PORT}`);

  // Render/Railway'da lokal disk EPHEMERAL: har deploy va har uyg'onishda
  // tozalanadi. Bulut xotira sozlanmasa yuklash "ishlaganday" ko'rinadi —
  // rasm saqlanadi, URL bazaga yoziladi, lekin keyingi deploydan so'ng
  // o'sha URL 404 qaytaradi va sayt bo'ylab singan rasmlar paydo bo'ladi.
  // Bu jimgina yo'qotish bo'lgani uchun ishga tushishda baland ogohlantiramiz.
  if (cloudStorageEnabled) {
    console.log(`Fayl xotirasi: ${storageProvider}`);
  } else if (env.NODE_ENV === 'production') {
    console.warn(
      '\n[OGOHLANTIRISH] Bulut xotira sozlanmagan — yuklangan rasm va videolar ' +
      'lokal diskda saqlanadi va KEYINGI DEPLOYDA YO\'QOLADI.\n' +
      'Render/Railway kabi hostingda quyidagilardan biri kiritilishi shart:\n' +
      '  SUPABASE_URL + SUPABASE_SERVICE_ROLE_KEY   (Cloudinary ochilmaydigan mamlakatlar uchun)\n' +
      '  CLOUDINARY_CLOUD_NAME + CLOUDINARY_API_KEY + CLOUDINARY_API_SECRET\n'
    );
  }
});
