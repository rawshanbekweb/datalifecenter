import 'dotenv/config';
import path from 'path';
import { execSync } from 'child_process';
import { Client } from 'pg';
import { deriveTestDbUrl, TEST_DB_NAME } from './test-db-url';

// Bir marta, testlardan oldin: test bazasini yaratadi, sxemani tozalab
// migratsiyalarni qo'llaydi. Asosiy bazaga tegilmaydi.
export default async function setup() {
  const baseUrl = process.env.DATABASE_URL;
  if (!baseUrl) {
    throw new Error('DATABASE_URL sozlanmagan — testlar uchun ham kerak (test bazasi undan yasaladi)');
  }
  const testUrl = deriveTestDbUrl(baseUrl);

  const admin = new Client({ connectionString: baseUrl });
  await admin.connect();
  const exists = await admin.query('SELECT 1 FROM pg_database WHERE datname = $1', [TEST_DB_NAME]);
  if (!exists.rowCount) {
    await admin.query(`CREATE DATABASE ${TEST_DB_NAME}`);
  }
  await admin.end();

  const test = new Client({ connectionString: testUrl });
  await test.connect();
  await test.query('DROP SCHEMA IF EXISTS public CASCADE; CREATE SCHEMA public;');
  await test.end();

  execSync('npx prisma migrate deploy', {
    cwd: path.resolve(__dirname, '..'),
    env: { ...process.env, DATABASE_URL: testUrl },
    stdio: 'inherit',
  });
}
