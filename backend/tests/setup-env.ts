import 'dotenv/config';
import { deriveTestDbUrl } from './test-db-url';

// Har bir test-worker'da app importidan OLDIN ishlaydi —
// server test bazasiga ulanadi va test rejimida ishga tushadi.
process.env.NODE_ENV = 'test';
process.env.DATABASE_URL = deriveTestDbUrl(process.env.DATABASE_URL as string);
process.env.FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:5173';
process.env.JWT_SECRET = process.env.JWT_SECRET || 'test-secret-kamida-32-belgidan-iborat!!';
