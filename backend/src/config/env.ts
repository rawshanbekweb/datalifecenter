import 'dotenv/config';
import { z } from 'zod';

const envSchema = z.object({
  DATABASE_URL: z.string().min(1, 'DATABASE_URL kerak'),
  PORT: z.coerce.number().default(4000),
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  FRONTEND_URL: z.string().min(1, 'FRONTEND_URL kerak'),
  // Qo'shimcha ruxsat etilgan origin'lar (CORS/CSRF) — vergul bilan ajratilgan ro'yxat
  EXTRA_ALLOWED_ORIGINS: z.string().optional(),
  JWT_SECRET: z.string().min(1, 'JWT_SECRET kerak'),
  JWT_EXPIRES_IN: z.string().default('7d'),

  // Email (ixtiyoriy) — sozlanmasa email yuborilmaydi, oqimlar yiqilmaydi.
  // Brevo HTTP API orqali yuboriladi — SMTP relay'dan farqli o'laroq IP
  // cheklovi yo'q, shuning uchun Render kabi o'zgaruvchan-IP hostingda ham
  // qayta deploy'dan keyin qo'lda hech narsa qilish shart emas.
  BREVO_API_KEY: z.string().optional(),
  EMAIL_FROM: z.string().optional(),

  // --- Fayl xotirasi (ephemeral hostingda ikkalasidan biri MAJBURIY) ---
  // Cloudinary (ixtiyoriy). DIQQAT: Cloudinary ba'zi mamlakatlarda, jumladan
  // O'zbekistonda, ro'yxatdan o'tishni bloklaydi — bunday holda Supabase ishlatiladi.
  CLOUDINARY_CLOUD_NAME: z.string().optional(),
  CLOUDINARY_API_KEY: z.string().optional(),
  CLOUDINARY_API_SECRET: z.string().optional(),

  // Supabase Storage (ixtiyoriy) — Cloudinary'ga muqobil.
  // SUPABASE_SERVICE_ROLE_KEY faqat serverda ishlatiladi (frontendga CHIQMASLIGI shart).
  SUPABASE_URL: z.string().optional(),
  SUPABASE_SERVICE_ROLE_KEY: z.string().optional(),
  SUPABASE_BUCKET_IMAGES: z.string().default('datalife-images'),
  SUPABASE_BUCKET_VIDEOS: z.string().default('datalife-videos'),

  // Sentry (ixtiyoriy) — production'da xatolarni kuzatish
  SENTRY_DSN: z.string().optional(),

  // To'lov shlyuzlari (ixtiyoriy) — sozlanmasa checkout tugmalari frontendda ko'rinmaydi,
  // qo'lda-chek-yuklash oqimi ishlab turadi (bu ikkinchisi bekor qilinmaydi).
  CLICK_SERVICE_ID: z.string().optional(),
  CLICK_MERCHANT_ID: z.string().optional(),
  CLICK_SECRET_KEY: z.string().optional(),
  PAYME_MERCHANT_ID: z.string().optional(),
  PAYME_SECRET_KEY: z.string().optional(),
});

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  console.error('Environment o\'zgaruvchilari noto\'g\'ri sozlangan:');
  console.error(parsed.error.flatten().fieldErrors);
  process.exit(1);
}

// Production'da zaif yoki dev-qiymatli sirlar bilan ishga tushishga yo'l qo'ymaymiz
if (parsed.data.NODE_ENV === 'production') {
  if (parsed.data.JWT_SECRET === 'change-me-in-production' || parsed.data.JWT_SECRET.length < 32) {
    console.error('Production uchun JWT_SECRET kamida 32 belgili tasodifiy qiymat bo\'lishi shart.');
    process.exit(1);
  }
}

export const env = parsed.data;
