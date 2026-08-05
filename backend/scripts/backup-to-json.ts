import 'dotenv/config';
import fs from 'node:fs';
import path from 'node:path';
import { Client } from 'pg';

/**
 * Butun bazani bitta JSON faylga ko'chiradi — `restore-from-json.ts` aynan
 * shu formatni kutadi.
 *
 * NEGA KERAK: tiklash skripti bor edi, lekin nusxani YARATADIGAN skript
 * yo'q edi. Ya'ni zaxira qo'lda olinardi va bir marta 34 daqiqalik farq
 * 19 ta yozuvni yo'qotgan. Qo'lda olinadigan nusxa — olinmaydigan nusxa.
 *
 * NEGA PRISMA EMAS, XOM SQL: nusxa sxemaning istalgan versiyasida ishlashi
 * kerak. Prisma mijozi faqat eng yangi sxemani biladi; jadval ro'yxati
 * BAZANING O'ZIDAN o'qilsa, kod bilmaydiganini ham nusxaga tushadi.
 * Aynan shu sabab yangi jadval qo'shilganda nusxa jimgina to'liqsiz
 * bo'lib qolmaydi.
 *
 * TARTIB: jadvallar restore'dagi ORDER bo'yicha yoziladi (ota jadval
 * boladan oldin). Ro'yxatda yo'q jadval oxiriga qo'shiladi va ochiq
 * aytiladi — u restore'ning ORDER ro'yxatiga ham kiritilishi kerak,
 * aks holda nusxada bo'lsa ham TIKLANMAYDI.
 *
 * DIQQAT: fayl ichida parol hash'lari va shaxsiy ma'lumot bor. Repoga
 * qo'shilmasin, xat bilan yuborilmasin.
 *
 * Ishga tushirish:
 *   $env:DATABASE_URL='<baza>'; npm run backup
 *   npm run backup -- "C:\yo'l\nusxa.json"    (fayl nomini o'zingiz bersangiz)
 */

/** restore-from-json.ts dagi ro'yxat bilan bir xil bo'lishi shart */
const ORDER = [
  'User', 'Mentor', 'Course', 'CourseMentor', 'Module', 'Lesson', 'Project',
  'TeamMember', 'TeamMemberProject', 'Partner', 'BlogPost', 'Testimonial',
  'SiteSetting', 'Moment', 'Enrollment', 'LessonProgress', 'CourseReview',
  'CourseRequest', 'MentorRequest', 'LiveSession', 'Announcement', 'Assignment',
  'AssignmentSubmission', 'LessonQuestion', 'Conversation',
  'ConversationParticipant', 'Message', 'Notification', 'ContactMessage',
  'Subscription', 'PaymentTransaction', 'EmailVerificationToken',
  'PasswordResetToken', 'ContentLike', 'ContentView', 'EngagementDaily',
];

/** Prisma o'zining migratsiya jurnalini o'zi boshqaradi — nusxaga kerak emas */
const SKIP = new Set(['_prisma_migrations']);

function defaultFile(): string {
  const now = new Date();
  const p = (n: number): string => String(n).padStart(2, '0');
  const stamp = `${now.getFullYear()}-${p(now.getMonth() + 1)}-${p(now.getDate())}-${p(now.getHours())}${p(now.getMinutes())}`;
  const home = process.env.USERPROFILE || process.env.HOME || '.';
  return path.join(home, 'Desktop', `datalife-zaxira-${stamp}.json`);
}

async function main(): Promise<void> {
  if (!process.env.DATABASE_URL) throw new Error('DATABASE_URL berilmagan');

  const out = path.resolve(process.argv[2] || defaultFile());
  const client = new Client({ connectionString: process.env.DATABASE_URL, connectionTimeoutMillis: 30_000 });
  await client.connect();

  try {
    // Jadval ro'yxati bazadan olinadi — kod bilmaydigan jadval ham tushsin
    const found = await client.query<{ table_name: string }>(
      `SELECT table_name FROM information_schema.tables
        WHERE table_schema = 'public' AND table_type = 'BASE TABLE'`
    );
    const present = found.rows.map((r) => r.table_name).filter((t) => !SKIP.has(t));

    // Avval ma'lum tartib, keyin ro'yxatda yo'qlari
    const known = ORDER.filter((t) => present.includes(t));
    const unlisted = present.filter((t) => !ORDER.includes(t));

    const tables: Record<string, unknown[]> = {};
    let total = 0;

    for (const table of [...known, ...unlisted]) {
      const res = await client.query(`SELECT * FROM "${table}"`);
      tables[table] = res.rows;
      total += res.rows.length;
      console.log(`  ${table.padEnd(26)} ${String(res.rows.length).padStart(5)} ta qator`);
    }

    const backup = {
      exportedAt: new Date().toISOString(),
      database: process.env.DATABASE_URL.replace(/:[^:@]+@/, ':***@'),
      tables,
    };

    fs.mkdirSync(path.dirname(out), { recursive: true });
    fs.writeFileSync(out, JSON.stringify(backup, null, 2), 'utf8');

    const mb = (fs.statSync(out).size / (1024 * 1024)).toFixed(2);
    console.log(`\nNusxa: ${out}`);
    console.log(`Hajmi: ${mb} MB, jami ${total} ta qator, ${Object.keys(tables).length} ta jadval.`);

    if (unlisted.length > 0) {
      console.log(
        `\nDIQQAT: quyidagi jadvallar restore'ning ORDER ro'yxatida YO'Q va shu\n` +
        `sababdan nusxada bo'lsa ham TIKLANMAYDI. restore-from-json.ts va\n` +
        `backup-to-json.ts dagi ORDER ro'yxatiga qo'shing:\n  ${unlisted.join(', ')}`
      );
    }

    const missing = ORDER.filter((t) => !present.includes(t));
    if (missing.length > 0) {
      console.log(`\nBazada bunday jadval yo'q (sxema eskiroq bo'lishi mumkin): ${missing.join(', ')}`);
    }

    console.log(`\nFaylda parol hash'lari va shaxsiy ma'lumot bor — repoga qo'shmang.`);
  } finally {
    await client.end().catch(() => {});
  }
}

main().catch((err) => {
  console.error(`\nXATO: ${err instanceof Error ? err.message : err}`);
  process.exitCode = 1;
});
