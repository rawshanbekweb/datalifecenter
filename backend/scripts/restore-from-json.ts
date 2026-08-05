import 'dotenv/config';
import fs from 'node:fs';
import path from 'node:path';
import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { pgSsl } from '../src/config/dbSsl';

/**
 * JSON zaxira nusxasidan BO'SH bazaga tiklaydi.
 *
 * NEGA ODDIY "INSERT" EMAS: nusxa 2026-08-03 da, sxemaning ESKI holatida
 * olingan. O'shandan beri ikkita buzuvchi o'zgarish bo'ldi:
 *   1. `Course.mentorId` ustuni olib tashlandi — o'rniga `CourseMentor`
 *      bog'lovchi jadvali (kursda bir nechta mentor bo'lishi mumkin).
 *   2. `Course.enrollmentOpen` qo'shildi (default true).
 * Shuning uchun skript qatorlarni ko'chirishdan oldin ularni YANGI sxemaga
 * moslashtiradi: eski `mentorId` qiymati kursning "asosiy" mentori sifatida
 * CourseMentor'ga yoziladi, mavjud bo'lmagan ustunlar tashlab yuboriladi.
 *
 * Tartib MUHIM: chet kalitlar buzilmasligi uchun ota jadvallar birinchi.
 * ID'lar, sanalar va JSON maydonlar nusxadagidek saqlanadi — havolalar
 * (masalan Enrollment.courseId) ishlab turishi uchun shart.
 *
 * XAVFSIZLIK: skript bo'sh bo'lmagan bazaga yozmaydi. Ustidan yozish uchun
 * ataylab FORCE=true kerak.
 *
 * Ishga tushirish:
 *   $env:DATABASE_URL='<yangi baza>'; npm run restore -- "C:\...\nusxa.json"
 *   $env:DRY_RUN='true'; ... (faqat rejani ko'rsatadi)
 */

const DRY_RUN = process.env.DRY_RUN === 'true';
const FORCE = process.env.FORCE === 'true';

const adapter = new PrismaPg({
  connectionString: process.env.DATABASE_URL,
  ...pgSsl(process.env.DATABASE_URL),
});
const prisma = new PrismaClient({ adapter });

type Row = Record<string, unknown>;

/**
 * Tiklash tartibi — chet kalit bog'liqligi bo'yicha. Ota jadval bolasidan
 * OLDIN turishi shart, aks holda insert FK xatosi bilan yiqiladi.
 */
const ORDER = [
  'User',
  'Mentor',
  'Course',
  'Module',
  'Lesson',
  'Project',
  'TeamMember',
  'TeamMemberProject',
  'Partner',
  'BlogPost',
  'Testimonial',
  'SiteSetting',
  'Enrollment',
  'LessonProgress',
  'CourseReview',
  'CourseRequest',
  'MentorRequest',
  'LiveSession',
  'Announcement',
  'Assignment',
  'AssignmentSubmission',
  'LessonQuestion',
  'Conversation',
  'ConversationParticipant',
  'Message',
  'Notification',
  'ContactMessage',
  'Subscription',
  'PaymentTransaction',
  'EmailVerificationToken',
  'PasswordResetToken',
  'ContentLike',
  'ContentView',
] as const;

type TableName = (typeof ORDER)[number];

/** Sana ko'rinishidagi ISO satrlarni Date'ga o'giradi (Prisma shuni kutadi) */
const ISO = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(\.\d+)?Z$/;

/**
 * Model -> massiv maydonlari nomlari, `schema.prisma` faylidan o'qiladi.
 *
 * NEGA KERAK: Postgres'da `text[]` ustuni NULL bo'lishi mumkin va nusxaga
 * ham `null` bo'lib tushgan (masalan `TeamMember.skills`), lekin Prisma
 * skalyar ro'yxatga null qabul qilmaydi — "Argument `skills` is missing"
 * deb yiqiladi. Bunday maydonlar `[]` ga aylantiriladi.
 *
 * NEGA DMMF EMAS: Prisma 7 ning ish paytidagi `Prisma.dmmf` maydon
 * tavsifini qisqartirib beradi — `isList` umuman yo'q (tekshirilgan).
 * Shuning uchun sxema faylining o'zi o'qiladi; yangi massiv ustun
 * qo'shilsa ham qo'lda hech narsa yangilash kerak bo'lmaydi.
 */
function readListFields(): Map<string, Set<string>> {
  const schemaPath = path.resolve(__dirname, '../prisma/schema.prisma');
  const schema = fs.readFileSync(schemaPath, 'utf8');
  const out = new Map<string, Set<string>>();

  for (const block of schema.matchAll(/^model\s+(\w+)\s*\{([\s\S]*?)^\}/gm)) {
    const [, model, body] = block;
    const fields = new Set<string>();
    for (const line of body.split('\n')) {
      // "  tags       String[]" ko'rinishi; izoh va bo'sh qatorlar o'tkaziladi
      const m = line.match(/^\s*(\w+)\s+(\w+)\[\]/);
      if (m) fields.add(m[1]);
    }
    out.set(model, fields);
  }
  return out;
}

const LIST_FIELDS = readListFields();

function normalizeRow(model: string, row: Row): Row {
  const lists = LIST_FIELDS.get(model) ?? new Set<string>();
  const out: Row = {};
  for (const [k, v] of Object.entries(row)) {
    if (v === null && lists.has(k)) {
      out[k] = [];
    } else {
      out[k] = typeof v === 'string' && ISO.test(v) ? new Date(v) : v;
    }
  }
  return out;
}

async function main(): Promise<void> {
  const file = process.argv[2];
  if (!file) throw new Error('Nusxa fayli ko\'rsatilmagan. Masalan: npm run restore -- "C:\\...\\nusxa.json"');

  const abs = path.resolve(file);
  const backup = JSON.parse(fs.readFileSync(abs, 'utf8')) as {
    exportedAt?: string;
    database?: string;
    tables: Record<string, Row[]>;
  };
  const tables = backup.tables ?? {};

  console.log(`Nusxa: ${abs}`);
  console.log(`Olingan sana: ${backup.exportedAt ?? '(nomalum)'}`);
  console.log(`Manba baza: ${backup.database ?? '(nomalum)'}\n`);

  // --- Bo'shlik tekshiruvi: mavjud ma'lumot ustidan yozib yubormaslik uchun
  const userCount = await prisma.user.count();
  if (userCount > 0 && !FORCE) {
    throw new Error(
      `Baza bo'sh emas (${userCount} ta foydalanuvchi bor). Ustidan yozish uchun FORCE=true bering.`
    );
  }

  // --- Eski sxemadan yangisiga moslashtirish
  // Course.mentorId olib tashlangan; qiymati CourseMentor'ga ko'chiriladi
  const courseMentors: { courseId: string; mentorId: string; isLead: boolean; order: number }[] = [];
  const mentorIds = new Set((tables.Mentor ?? []).map((m) => String(m.id)));

  for (const course of tables.Course ?? []) {
    const legacyMentorId = course.mentorId;
    delete course.mentorId;
    // enrollmentOpen nusxada yo'q — yangi kurslar ochiq bo'lib tiklanadi
    if (course.enrollmentOpen === undefined) course.enrollmentOpen = true;

    if (typeof legacyMentorId === 'string' && legacyMentorId) {
      if (mentorIds.has(legacyMentorId)) {
        courseMentors.push({ courseId: String(course.id), mentorId: legacyMentorId, isLead: true, order: 0 });
      } else {
        // Nusxada mentor qatori yo'q (o'sha paytda o'chirilgan bo'lishi mumkin)
        console.log(`  DIQQAT: "${course.slug}" kursining mentori (${legacyMentorId}) nusxada yo'q — bog'lanmadi`);
      }
    }
  }

  if (DRY_RUN) {
    let planned = 0;
    for (const name of ORDER) {
      const rows = tables[name] ?? [];
      if (rows.length === 0) continue;
      console.log(`  ${name.padEnd(24)} ${rows.length} ta qator (yozilardi)`);
      planned += rows.length;
    }
    if (courseMentors.length > 0) {
      console.log(`  ${'CourseMentor'.padEnd(24)} ${courseMentors.length} ta qator (eski mentorId dan)`);
      planned += courseMentors.length;
    }
    console.log(`\nJami: ${planned} ta qator (DRY RUN — hech narsa yozilmadi).`);
    return;
  }

  // HAMMASI YOKI HECH NARSA. Tiklash o'rtasida xato chiqsa (masalan bitta
  // jadvalda kutilmagan maydon), yarim to'ldirilgan baza qolib ketmasligi
  // kerak — undan keyin skriptni qayta ishga tushirib ham bo'lmaydi, chunki
  // "baza bo'sh emas" tekshiruvi to'sadi. Shuning uchun bitta tranzaksiya.
  const counts = await prisma.$transaction(
    async (tx) => {
      const written: [string, number][] = [];

      for (const name of ORDER) {
        const rows = tables[name] ?? [];
        if (rows.length === 0) continue;

        // @ts-expect-error — jadval nomi ish paytida tanlanadi, Prisma delegatlari statik
        const delegate = tx[(name.charAt(0).toLowerCase() + name.slice(1)) as TableName];
        const result = await delegate.createMany({
          data: rows.map((r) => normalizeRow(name, r)),
          skipDuplicates: true,
        });
        written.push([name, result.count]);
      }

      if (courseMentors.length > 0) {
        const res = await tx.courseMentor.createMany({ data: courseMentors, skipDuplicates: true });
        written.push(['CourseMentor (eski mentorId dan)', res.count]);
      }

      return written;
    },
    // Katta nusxada standart 5 soniya yetmaydi
    { timeout: 120_000, maxWait: 20_000 }
  );

  let total = 0;
  for (const [name, count] of counts) {
    console.log(`  ${name.padEnd(24)} ${count} ta qator`);
    total += count;
  }

  // Nusxada bor, lekin tiklanmagan jadvallar bo'lsa — jimgina o'tkazib
  // yubormaymiz, aks holda ma'lumot yo'qolgani bilinmay qolardi
  const known = new Set<string>(ORDER);
  const unknown = Object.keys(tables).filter((t) => !known.has(t) && (tables[t] ?? []).length > 0);
  if (unknown.length > 0) {
    console.log(`\nDIQQAT — bu jadvallar tiklanmadi (ro'yxatda yo'q): ${unknown.join(', ')}`);
  }

  console.log(`\nJami: ${total} ta qator tiklandi.`);
}

main()
  .catch((err) => {
    console.error(`\nXATO: ${err instanceof Error ? err.message : err}`);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
