import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { env } from './env';

// Render'ning tashqi (external) Postgres manzili SSL talab qiladi, lekin URL'da
// sslmode bo'lmaydi va sertifikati ommaviy CA'dan emas — shuning uchun bunday
// hostlarga SSL'ni verificationsiz yoqamiz. Internal (dpg-xxx-a) va localhost'ga tegmaymiz.
const needsSsl = /\.render\.com/.test(env.DATABASE_URL);

const adapter = new PrismaPg({
  connectionString: env.DATABASE_URL,
  ...(needsSsl ? { ssl: { rejectUnauthorized: false } } : {}),
});

export const prisma = new PrismaClient({ adapter });
