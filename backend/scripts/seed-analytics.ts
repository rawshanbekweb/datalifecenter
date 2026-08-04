/**
 * Monitoring sahifasini KO'RISH uchun namunaviy kunlik statistika.
 *
 * NEGA KERAK: `EngagementDaily` faqat haqiqiy ko'rish/yoqtirish bo'lganda
 * to'ladi, ya'ni yangi o'rnatilgan platformada monitoring sahifasi bir necha
 * hafta davomida bo'sh turadi va uni tekshirib ham bo'lmaydi. Bu skript
 * shu bo'shliqni namunaviy raqamlar bilan to'ldiradi.
 *
 * DIQQAT: bu SOXTA ma'lumot — faqat lokal/demo bazada ishlatilsin.
 * Ishlatish:
 *   npx tsx scripts/seed-analytics.ts          # 90 kunlik namuna yozadi
 *   npx tsx scripts/seed-analytics.ts --clear  # BARCHA kunlik kesimni o'chiradi
 */
import { EngagementTarget } from '@prisma/client';
import { prisma } from '../src/config/prisma';

const DAYS = 90;

interface Target {
  type: EngagementTarget;
  id: string;
  /** Kunlik ko'rishlarning taxminiy og'irligi — mashhurroq kontent kattaroq */
  weight: number;
}

async function collectTargets(): Promise<Target[]> {
  const [courses, posts, projects] = await Promise.all([
    prisma.course.findMany({ where: { published: true }, select: { id: true }, take: 6 }),
    prisma.blogPost.findMany({ where: { published: true }, select: { id: true }, take: 5 }),
    prisma.project.findMany({ where: { published: true }, select: { id: true }, take: 4 }),
  ]);

  return [
    ...courses.map((row, i) => ({ type: 'COURSE' as const, id: row.id, weight: Math.max(2, 10 - i * 2) })),
    ...posts.map((row, i) => ({ type: 'BLOG_POST' as const, id: row.id, weight: Math.max(1, 6 - i) })),
    ...projects.map((row) => ({ type: 'PROJECT' as const, id: row.id, weight: 3 })),
  ];
}

async function main(): Promise<void> {
  if (process.argv.includes('--clear')) {
    const { count } = await prisma.engagementDaily.deleteMany();
    console.log(`Kunlik kesim tozalandi: ${count} qator o'chirildi.`);
    return;
  }

  const targets = await collectTargets();
  if (!targets.length) {
    console.log("Nashr qilingan kontent yo'q — avval `npm run seed` bajaring.");
    return;
  }

  const rows = [];
  for (let back = DAYS - 1; back >= 0; back -= 1) {
    const day = new Date();
    day.setUTCHours(0, 0, 0, 0);
    day.setUTCDate(day.getUTCDate() - back);

    // Sekin o'sish + dam olish kunlaridagi pasayish: grafik jonli ko'rinsin
    const growth = 1 + (DAYS - 1 - back) / 60;
    const weekend = [0, 6].includes(day.getUTCDay()) ? 0.55 : 1;

    for (const target of targets) {
      const views = Math.round(target.weight * growth * weekend * (0.6 + Math.random() * 0.9));
      if (views === 0) continue;
      rows.push({
        contentType: target.type,
        contentId: target.id,
        day,
        views,
        // Har ko'rish yoqtirishga aylanmaydi — taxminan 7 tadan bittasi
        likes: Math.random() < 0.45 ? Math.max(1, Math.round(views / 7)) : 0,
      });
    }
  }

  const { count } = await prisma.engagementDaily.createMany({ data: rows, skipDuplicates: true });
  console.log(`${count} qator yozildi (${DAYS} kun, ${targets.length} ta kontent).`);
}

main()
  .catch((err) => {
    console.error(err);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
