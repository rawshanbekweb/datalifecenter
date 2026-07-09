import 'dotenv/config';
import { z } from 'zod';

const envSchema = z.object({
  DATABASE_URL: z.string().min(1, 'DATABASE_URL kerak'),
  PORT: z.coerce.number().default(4000),
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  FRONTEND_URL: z.string().min(1, 'FRONTEND_URL kerak'),
  JWT_SECRET: z.string().min(1, 'JWT_SECRET kerak'),
  JWT_EXPIRES_IN: z.string().default('7d'),

  // Email (ixtiyoriy) — sozlanmasa email yuborilmaydi, oqimlar yiqilmaydi.
  // Brevo HTTP API orqali yuboriladi — SMTP relay'dan farqli o'laroq IP
  // cheklovi yo'q, shuning uchun Render kabi o'zgaruvchan-IP hostingda ham
  // qayta deploy'dan keyin qo'lda hech narsa qilish shart emas.
  BREVO_API_KEY: z.string().optional(),
  EMAIL_FROM: z.string().optional(),

  // Cloudinary (ixtiyoriy) — sozlansa fayllar bulutga yuklanadi (ephemeral hostingda shart)
  CLOUDINARY_CLOUD_NAME: z.string().optional(),
  CLOUDINARY_API_KEY: z.string().optional(),
  CLOUDINARY_API_SECRET: z.string().optional(),

  // Sentry (ixtiyoriy) — production'da xatolarni kuzatish
  SENTRY_DSN: z.string().optional(),
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
