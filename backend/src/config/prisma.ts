import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { env } from './env';
import { pgSsl } from './dbSsl';

/**
 * Ulanishlar havzasi (pool) ATAYIN chegaralangan.
 *
 * NEGA: standart holatda `pg` ulanish kutish muddatini umuman qo'ymaydi
 * (`connectionTimeoutMillis: 0` = cheksiz kutish). Yuklama tepaga chiqqanda
 * bu eng yomon xatti-harakat: havza to'lgach yangi so'rovlar xatoga
 * chiqmaydi, balki NAVBATDA jim turaveradi. Foydalanuvchi uchun sayt
 * "yiqilgan" emas, "osilgan" bo'lib ko'rinadi va u qayta-qayta yangilaydi —
 * har yangilash navbatni yana uzaytiradi. Chegara qo'yilganda so'rov tez
 * xatoga chiqadi, navbat qisqaradi va server o'zini o'nglab oladi.
 *
 * `max` bitta instans uchun: Render'da 0.1 CPU bilan 10 ta parallel
 * so'rovdan ortig'ini baribir bajara olmaymiz, ko'proq ulanish faqat
 * Postgres tomonda navbat hosil qiladi. Neon'da ulanishlar soni ham
 * cheklangan resurs, ortiqcha ochish foyda bermaydi.
 */
const adapter = new PrismaPg({
  connectionString: env.DATABASE_URL,
  ...pgSsl(env.DATABASE_URL),
  max: 10,
  // Bo'sh ulanish 30 soniyadan keyin qaytariladi — Neon serverless'da
  // uzoq osilib turgan ulanish bekorga resurs band qiladi
  idleTimeoutMillis: 30_000,
  // Havzadan ulanish kutish chegarasi: bundan uzoq kutgan so'rov baribir
  // foydalanuvchi uchun kech, tez xatoga chiqargan ma'qul
  connectionTimeoutMillis: 10_000,
});

export const prisma = new PrismaClient({ adapter });
