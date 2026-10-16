import 'dotenv/config';
import { defineConfig } from 'prisma/config';

export default defineConfig({
  schema: 'prisma/schema.prisma',
  datasource: {
    // `env()` o'zgaruvchi yo'q bo'lsa xato tashlaydi — Docker build bosqichida
    // DATABASE_URL bo'lmaydi, `prisma generate` esa unga muhtoj emas.
    // migrate deploy ishga tushganda (runtime) o'zgaruvchi mavjud bo'ladi.
    url: process.env.DATABASE_URL ?? '',
  },
});
