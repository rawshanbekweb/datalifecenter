import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { env } from './env';
import { pgSsl } from './dbSsl';

const adapter = new PrismaPg({
  connectionString: env.DATABASE_URL,
  ...pgSsl(env.DATABASE_URL),
});

export const prisma = new PrismaClient({ adapter });
