#!/usr/bin/env tsx
// DATA LIFE — seed'dan qolgan demo kontentni topadi va tozalaydi.
//
// NEGA KERAK: `prisma/seed.ts` sayt bo'sh ko'rinmasligi uchun namunaviy kontent
// yozadi va u kontentda TO'QIMA raqamlar bor — kurslarga qo'lda yozilgan
// `rating: 4.9` va `students: 840`, blog maqolalariga `views: 3200…9100`,
// mavjud bo'lmagan hamkor kompaniyalar. Jonli saytda bu raqamlar mijozga
// haqiqiy statistika bo'lib ko'rinadi.
//
// MUHIM: bu skript bazani BO'SHATMAYDI. Faqat seed'dan kelgan aniq yozuvlarga
// tegadi (sarlavha/nomi bo'yicha aniq moslik) va hisoblagichlarni haqiqiy
// ma'lumotdan qayta hisoblaydi. Foydalanuvchilar, yozilishlar, to'lovlar,
// progress va sertifikatlarga UMUMAN tegilmaydi.
//
// Ishga tushirish:
//   npm run clean:demo              -- faqat hisobot, hech narsa o'zgarmaydi
//   npm run clean:demo -- --apply   -- o'zgartirishlarni qo'llaydi
//
// PROD'da ishlatishdan oldin BACKUP oling (Render → Postgres → Backups).

import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import 'dotenv/config';

const needsSsl = /\.render\.com/.test(process.env.DATABASE_URL ?? '');
const adapter = new PrismaPg({
  connectionString: process.env.DATABASE_URL,
  ...(needsSsl ? { ssl: { rejectUnauthorized: false } } : {}),
});
const prisma = new PrismaClient({ adapter });

const APPLY = process.argv.includes('--apply');

// Seed'dagi aynan shu qiymatlar bo'yicha aniqlanadi. ATAYIN nusxalangan:
// seed.ts konstantalari eksport qilinmagan va ularni eksport qilish seed'ning
// o'zini o'zgartirishni talab qilardi. Seed o'zgarsa bu ro'yxat ham yangilanadi.
const DEMO_BLOG_TITLES = [
  "React Hooks: useState va useEffect ni chuqur o'rganing",
  'Kiberxavfsizlik: SQL Injection dan qanday himoyalanish',
  "IT Sanoatida Karera: 2025-yilgi To'liq Roadmap",
  'Node.js va Express bilan REST API qurish',
  'Python bilan Machine Learning: Birinchi modelingiz',
  'Docker va Kubernetes: Container deployment asoslari',
];

const DEMO_PARTNER_NAMES = ['TechCorp Uzbekistan', 'Innovate Solutions', 'Tashkent IT Park', 'Digital Bridge'];

const DEMO_PROJECT_TITLES = ['EduTech Platform', 'FinTech Mobile App', 'CyberGuard Dashboard', 'AI Content Generator'];

const DEMO_TESTIMONIAL_NAMES = ['Jasur Toshmatov', 'Madina Yusupova', 'Bekzod Rahimov'];

// Seed kurslarga aynan shu qiymatlarni yozadi — hisoblagich shulardan biriga
// teng bo'lsa, u hech qachon haqiqiy ma'lumotdan hisoblanmagan degani.
const SEEDED_STUDENT_COUNTS = [840, 620, 480, 390, 310, 280];

const changes: string[] = [];
const record = (line: string) => {
  changes.push(line);
  console.log(`  ${APPLY ? '✓' : '·'} ${line}`);
};

const titleUz = (title: unknown): string =>
  typeof title === 'object' && title !== null ? String((title as Record<string, unknown>).uz ?? '') : String(title ?? '');

// Kurs hisoblagichlari: seed qo'lda yozgan, haqiqiysi yozilish/sharhlardan chiqadi
async function fixCourseCounters(): Promise<void> {
  console.log('\n— Kurs hisoblagichlari (rating / studentsCount / reviewsCount)');
  const courses = await prisma.course.findMany({ select: { id: true, title: true, rating: true, reviewsCount: true, studentsCount: true } });

  for (const course of courses) {
    const name = titleUz(course.title) || course.id;

    // Haqiqiy o'quvchi = bekor qilinmagan yozilish
    const realStudents = await prisma.enrollment.count({
      where: { courseId: course.id, status: { in: ['ACTIVE', 'COMPLETED'] } },
    });

    const reviews = await prisma.courseReview.findMany({
      where: { courseId: course.id, published: true },
      select: { rating: true },
    });
    const realReviews = reviews.length;
    const realRating = realReviews === 0
      ? 0
      : Math.round((reviews.reduce((sum, r) => sum + r.rating, 0) / realReviews) * 10) / 10;

    const seeded = SEEDED_STUDENT_COUNTS.includes(course.studentsCount);
    const needsStudents = course.studentsCount !== realStudents;
    const needsRating = Math.abs(course.rating - realRating) > 0.001 || course.reviewsCount !== realReviews;
    if (!needsStudents && !needsRating) continue;

    const parts: string[] = [];
    if (needsStudents) parts.push(`studentsCount ${course.studentsCount} → ${realStudents}${seeded ? ' (seed qiymati)' : ''}`);
    if (needsRating) parts.push(`rating ${course.rating} → ${realRating}, reviewsCount ${course.reviewsCount} → ${realReviews}`);
    record(`Kurs "${name}": ${parts.join('; ')}`);

    if (APPLY) {
      await prisma.course.update({
        where: { id: course.id },
        data: { studentsCount: realStudents, rating: realRating, reviewsCount: realReviews },
      });
    }
  }
}

// Blog: seed maqolalari o'chiriladi. Ular haqiqiy maqola emas — namuna matn.
async function cleanDemoBlog(): Promise<void> {
  console.log('\n— Demo blog maqolalari');
  const posts = await prisma.blogPost.findMany({ select: { id: true, slug: true, title: true, views: true } });

  for (const post of posts) {
    if (!DEMO_BLOG_TITLES.includes(titleUz(post.title))) continue;
    record(`Blog o'chiriladi: "${titleUz(post.title)}" (views=${post.views}, slug=${post.slug})`);
    if (APPLY) await prisma.blogPost.delete({ where: { id: post.id } });
  }
}

async function cleanDemoRows(): Promise<void> {
  console.log('\n— Demo hamkor / loyiha / sharhlar');

  const partners = await prisma.partner.findMany({ select: { id: true, name: true } });
  for (const p of partners) {
    if (!DEMO_PARTNER_NAMES.includes(p.name)) continue;
    record(`Hamkor o'chiriladi: "${p.name}"`);
    if (APPLY) await prisma.partner.delete({ where: { id: p.id } });
  }

  const projects = await prisma.project.findMany({ select: { id: true, title: true } });
  for (const p of projects) {
    if (!DEMO_PROJECT_TITLES.includes(titleUz(p.title))) continue;
    record(`Loyiha o'chiriladi: "${titleUz(p.title)}"`);
    if (APPLY) await prisma.project.delete({ where: { id: p.id } });
  }

  const testimonials = await prisma.testimonial.findMany({ select: { id: true, name: true } });
  for (const t of testimonials) {
    if (!DEMO_TESTIMONIAL_NAMES.includes(t.name)) continue;
    record(`Sharh o'chiriladi: "${t.name}"`);
    if (APPLY) await prisma.testimonial.delete({ where: { id: t.id } });
  }
}

// Tegilmaydigan narsalarni ham ko'rsatamiz — nima saqlanib qolishi oldindan ko'rinsin
async function reportPreserved(): Promise<void> {
  // Sertifikat alohida model emas — u COMPLETED yozilishdan hosil qilinadi
  const [users, enrollments, completed, payments, subs, progress, reviews] = await Promise.all([
    prisma.user.count(),
    prisma.enrollment.count(),
    prisma.enrollment.count({ where: { status: 'COMPLETED' } }),
    prisma.paymentTransaction.count(),
    prisma.subscription.count(),
    prisma.lessonProgress.count(),
    prisma.courseReview.count(),
  ]);
  console.log('\n— TEGILMAYDI (saqlanib qoladi)');
  console.log(`  foydalanuvchi: ${users} · yozilish: ${enrollments} (tugallangan: ${completed}) · to'lov tranzaksiyasi: ${payments}`);
  console.log(`  obuna: ${subs} · dars progressi: ${progress} · kurs sharhi: ${reviews}`);
}

async function main(): Promise<void> {
  const host = (process.env.DATABASE_URL ?? '').match(/@([^/]+)/)?.[1] ?? 'noma\'lum';
  console.log(`DATA LIFE — demo kontent tozalash (${APPLY ? 'QO\'LLASH' : 'faqat hisobot'})`);
  console.log(`Baza: ${host}`);

  await reportPreserved();
  await fixCourseCounters();
  await cleanDemoBlog();
  await cleanDemoRows();

  console.log(`\n${changes.length} ta o'zgarish ${APPLY ? 'qo\'llandi' : 'topildi'}.`);
  if (!APPLY && changes.length > 0) {
    console.log("Qo'llash uchun: npm run clean:demo -- --apply  (avval BACKUP oling)");
  }
}

main()
  .catch((err) => {
    console.error('Skript yiqildi:', err);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
