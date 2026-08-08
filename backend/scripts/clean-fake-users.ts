#!/usr/bin/env tsx
// DATA LIFE — soxta ro'yxatdan o'tishlarni topadi va tozalaydi.
//
// NEGA KERAK: register formasi ilgari ismni deyarli tekshirmasdi va shu orqali
// `admin' OR '1'='1` ko'rinishidagi skaner payloadlari, 100 xonali raqamli
// "ism"lar va bir raqamga bog'langan o'nlab hisoblar bazaga tushib qolgan.
// Yangi tekshiruvlar bundan keyingisini to'sadi (validators/shared/personName),
// bu skript esa allaqachon tushgan yozuvlarni tozalaydi.
//
// TANLASH SHARTLARI (hammasi birga bajarilishi kerak):
//   1. roli STUDENT (mentor/jamoa/admin hisoblariga umuman tegilmaydi)
//   2. emaili tasdiqlanmagan
//   3. hisobda hech qanday iz yo'q: yozilish, obuna, kurs so'rovi, sharh,
//      xabar, dars savoli, topshiriq, progress — hammasi bo'sh
//   4. ismi yangi qoidadan o'tmaydi (harf bo'lmagan belgi, sof raqam, 60+ belgi)
//
// Ishga tushirish:
//   npm run clean:users              -- faqat hisobot, hech narsa o'chmaydi
//   npm run clean:users -- --apply   -- topilganlarni o'chiradi
//
// PROD'da ishlatishdan oldin zaxira oling: npm run backup

import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import 'dotenv/config';
import { pgSsl } from '../src/config/dbSsl';
import { personName } from '../src/validators/shared/personName.validator';

const adapter = new PrismaPg({
  connectionString: process.env.DATABASE_URL,
  ...pgSsl(process.env.DATABASE_URL),
});
const prisma = new PrismaClient({ adapter });

const APPLY = process.argv.includes('--apply');

/** Ism yangi qoidadan o'tadimi — skript va API bir xil qoidadan foydalanadi */
function nameIsValid(name: string): boolean {
  return personName.safeParse(name).success;
}

async function main(): Promise<void> {
  console.log(`\nDATA LIFE — soxta hisoblarni tozalash ${APPLY ? '(--apply)' : '(faqat hisobot)'}\n`);

  const candidates = await prisma.user.findMany({
    where: {
      role: 'STUDENT',
      emailVerifiedAt: null,
      // Quyidagi jadvallarning bir qismi User'ga RESTRICT bilan bog'langan
      // (Enrollment, Subscription, CourseReview) — ular bo'sh bo'lishi o'chirish
      // ishlashi uchun ham shart, hisob haqiqatan foydalanilmaganini bilish
      // uchun ham
      enrollments: { none: {} },
      subscriptions: { none: {} },
      courseRequests: { none: {} },
      courseReviews: { none: {} },
      sentMessages: { none: {} },
      lessonQuestions: { none: {} },
      assignmentSubmissions: { none: {} },
      lessonProgress: { none: {} },
      mentorProfile: null,
      teamProfile: null,
    },
    select: { id: true, name: true, email: true, phone: true, createdAt: true },
    orderBy: { createdAt: 'asc' },
  });

  const fake = candidates.filter((u) => !nameIsValid(u.name));

  if (fake.length === 0) {
    console.log('  Soxta ko\'rinadigan hisob topilmadi.\n');
    return;
  }

  console.log(`  Topildi: ${fake.length} ta (jami tekshirilgan bo'sh hisob: ${candidates.length})\n`);
  for (const u of fake) {
    const shortName = u.name.length > 40 ? `${u.name.slice(0, 40)}…` : u.name;
    console.log(`  ${APPLY ? '✓' : '·'} ${u.email}  |  "${shortName}"  |  ${u.phone ?? '—'}  |  ${u.createdAt.toISOString().slice(0, 10)}`);
  }

  if (!APPLY) {
    console.log('\n  Hech narsa o\'chirilmadi. O\'chirish uchun: npm run clean:users -- --apply\n');
    return;
  }

  // Foydalanuvchiga bog'liq yozuvlar yuqoridagi shartda yo'q, lekin
  // bildirishnoma/token/qiziqish kabi qatorlar bo'lishi mumkin — ular
  // schema'da onDelete: Cascade bilan bog'langan va o'zi o'chadi.
  const ids = fake.map((u) => u.id);
  const { count } = await prisma.user.deleteMany({ where: { id: { in: ids } } });
  console.log(`\n  O'chirildi: ${count} ta hisob\n`);
}

main()
  .catch((err) => {
    console.error(err);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
