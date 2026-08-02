import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import 'dotenv/config';
import { slugify } from '../src/utils/slugify';
import { TEAM_MEMBERS } from '../prisma/data/teamMembers';

/**
 * Jamoa a'zolarini bazaga qo'shadi — production'da ham xavfsiz.
 *
 * NEGA ALOHIDA: to'liq `npm run seed` jonli bazada uchta zarar keltiradi —
 * hamkor logotiplarini placeholder'ga qaytaradi, kurs narxlarini seed
 * qiymatiga tushiradi va `Team123!`/`Student123!` kabi ochiq ma'lum parolli
 * akkauntlar ochadi. Bu skript FAQAT `TeamMember` yozuvlarini yaratadi.
 *
 * Kafolatlar:
 *   - Boshqa hech qanday jadvalga YOZMAYDI (mentorlarni faqat o'qiydi)
 *   - Foydalanuvchi akkaunti ochmaydi — a'zoni keyin /admin/team dan
 *     mavjud akkauntga bog'lash mumkin
 *   - Idempotent: slug bo'yicha mavjud a'zo o'tkazib yuboriladi, ya'ni
 *     qayta ishga tushirish dublikat yaratmaydi
 *   - Bo'sh emas: `--published=false` bilan avval yopiq holda qo'shib,
 *     tekshirib chiqib, keyin panelda nashr qilish mumkin
 *
 * Ishga tushirish (Render Shell yoki lokal):
 *   npx tsx scripts/seed-team.ts
 *   npx tsx scripts/seed-team.ts --published=false
 *   npx tsx scripts/seed-team.ts --dry-run
 */

const needsSsl = /\.render\.com/.test(process.env.DATABASE_URL ?? '');
const adapter = new PrismaPg({
  connectionString: process.env.DATABASE_URL,
  ...(needsSsl ? { ssl: { rejectUnauthorized: false } } : {}),
});
const prisma = new PrismaClient({ adapter });

const args = process.argv.slice(2);
const DRY_RUN = args.includes('--dry-run');
const PUBLISHED = !args.includes('--published=false');

async function main(): Promise<void> {
  if (!process.env.DATABASE_URL) {
    throw new Error('DATABASE_URL sozlanmagan');
  }

  // Loyihalarga bog'lanish faqat o'sha loyiha BAZADA bo'lsa qo'shiladi.
  // Prod'da `seed-project-N` yozuvlari bo'lmasligi mumkin (loyihalar admin
  // panelda qo'lda kiritilgan) — bunda butun skript FK xatosi bilan
  // yiqilmasin, shunchaki bog'lanishsiz a'zo yaratilsin.
  const wantedProjectIds = [...new Set(TEAM_MEMBERS.flatMap((m) => m.projectIndexes))].map(
    (i) => `seed-project-${i}`
  );
  const existingProjects = new Set(
    (
      await prisma.project.findMany({
        where: { id: { in: wantedProjectIds } },
        select: { id: true },
      })
    ).map((p) => p.id)
  );

  // Ismi mos mentor bo'lsa bog'laymiz — bir odam ham mentor, ham jamoa a'zosi
  // bo'lishi mumkin. mentorId @unique, shuning uchun band bo'lganini o'tkazamiz.
  const mentors = await prisma.mentor.findMany({ select: { id: true, name: true } });
  const takenMentorIds = new Set(
    (await prisma.teamMember.findMany({ where: { mentorId: { not: null } }, select: { mentorId: true } }))
      .map((t) => t.mentorId)
      .filter((id): id is string => Boolean(id))
  );
  const mentorIdByName = new Map<string, string>();
  for (const m of mentors) {
    if (!mentorIdByName.has(m.name) && !takenMentorIds.has(m.id)) {
      mentorIdByName.set(m.name, m.id);
    }
  }

  let created = 0;
  let skipped = 0;

  for (const [i, tm] of TEAM_MEMBERS.entries()) {
    const slug = slugify(tm.name);
    const existing = await prisma.teamMember.findUnique({ where: { slug } });
    if (existing) {
      console.log(`  o'tkazildi (mavjud): ${tm.name} → /team/${slug}`);
      skipped += 1;
      continue;
    }

    const links = tm.projectIndexes
      .map((p) => `seed-project-${p}`)
      .filter((id) => existingProjects.has(id))
      .map((projectId, order) => ({ projectId, order }));

    const mentorId = mentorIdByName.get(tm.name) ?? null;
    if (mentorId) mentorIdByName.delete(tm.name);

    if (DRY_RUN) {
      console.log(
        `  [dry-run] yaratilardi: ${tm.name} (${tm.department})` +
          `${mentorId ? ' + mentor profiliga bog\'lanardi' : ''}` +
          `${links.length ? ` + ${links.length} loyiha` : ''}`
      );
      created += 1;
      continue;
    }

    await prisma.teamMember.create({
      data: {
        slug,
        // Akkaunt ATAYIN bog'lanmaydi: bu skript parol yaratmaydi.
        // Kerak bo'lsa /admin/team dan mavjud foydalanuvchiga bog'lanadi.
        userId: null,
        mentorId,
        name: tm.name,
        position: { uz: tm.position },
        bio: { uz: tm.bio },
        department: tm.department,
        leadership: tm.leadership ?? false,
        skills: tm.skills,
        order: i,
        featured: i < 3,
        published: PUBLISHED,
        ...(links.length ? { projects: { createMany: { data: links } } } : {}),
      },
    });
    console.log(
      `  qo'shildi: ${tm.name} → /team/${slug}` +
        `${mentorId ? ' (mentor profiliga bog\'landi)' : ''}` +
        `${links.length ? ` (${links.length} loyiha)` : ''}`
    );
    created += 1;
  }

  console.log(
    `\n${DRY_RUN ? '[dry-run] ' : ''}Yakun: ${created} ta qo'shildi, ${skipped} ta o'tkazildi` +
      `${PUBLISHED ? '' : " — nashr qilinmagan holatda (/admin/team dan yoqing)"}`
  );
  if (created > 0 && !DRY_RUN) {
    console.log('Rasmlar hali yo\'q — /admin/team dan yuklab, fokus nuqtasini belgilang.');
  }
}

main()
  .catch((e) => {
    console.error('Jamoa seed xatosi:', e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
