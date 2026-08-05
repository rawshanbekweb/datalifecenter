import 'dotenv/config';
import { deriveTestDbUrl } from './test-db-url';

// Har bir test-worker'da app importidan OLDIN ishlaydi —
// server test bazasiga ulanadi va test rejimida ishga tushadi.
process.env.NODE_ENV = 'test';
process.env.DATABASE_URL = deriveTestDbUrl(process.env.DATABASE_URL as string);
process.env.FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:5173';
process.env.JWT_SECRET = process.env.JWT_SECRET || 'test-secret-kamida-32-belgidan-iborat!!';

// Testlar HECH QACHON haqiqiy xat yubormaydi. Ilgari .env dagi BREVO_API_KEY
// test rejimida ham o'qilardi va har `npm test` yugurishi parol@test.uz,
// student@test.uz kabi mavjud bo'lmagan manzillarga haqiqiy so'rov yuborardi:
// bepul kvota (kuniga 300 xat) yeyilardi va Brevo'da "blocked" hodisalari
// to'planib jo'natuvchi obro'sini tushirardi — bu esa haqiqiy xatlarning
// spamga tushishiga hissa qo'shadi. Bo'sh kalit = email.service jim rejimda.
process.env.BREVO_API_KEY = '';

// To'lov shlyuzi webhook testlari uchun (haqiqiy merchant hisob emas — faqat
// imzo/protokol mantig'ini sinash uchun sobit test qiymatlari)
process.env.CLICK_SERVICE_ID = process.env.CLICK_SERVICE_ID || 'test-click-service';
process.env.CLICK_MERCHANT_ID = process.env.CLICK_MERCHANT_ID || 'test-click-merchant';
process.env.CLICK_SECRET_KEY = process.env.CLICK_SECRET_KEY || 'test-click-secret';
process.env.PAYME_MERCHANT_ID = process.env.PAYME_MERCHANT_ID || 'test-payme-merchant';
process.env.PAYME_SECRET_KEY = process.env.PAYME_SECRET_KEY || 'test-payme-secret';
