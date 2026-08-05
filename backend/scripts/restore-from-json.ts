import 'dotenv/config';
import fs from 'node:fs';
import path from 'node:path';
import { Client } from 'pg';

/**
 * JSON zaxira nusxasidan BO'SH bazaga tiklaydi.
 *
 * NEGA PRISMA EMAS, XOM SQL: tiklash sxemaning HAR QANDAY versiyasiga
 * tushishi kerak. Prisma mijozi kod bilan birga generatsiya qilinadi va
 * faqat ENG YANGI sxemani biladi — nusxa esa eskirok sxemada olingan
 * bo'lishi mumkin (bizda shunday: nusxada `Course.mentorId` bor, u
 * keyinchalik `CourseMentor` jadvaliga ko'chirilgan). Bundan tashqari
 * tiklanayotgan baza deploy qilingan koddan orqada bo'lishi mumkin.
 * Shuning uchun skript ustunlarni BAZANING O'ZIDAN o'qiydi va nusxa bilan
 * kesishmasini yozadi:
 *
 *   - bazada bor, nusxada yo'q  -> ustun default qiymatida qoladi
 *   - nusxada bor, bazada yo'q  -> o'tkazib yuboriladi va ogohlantiriladi
 *
 * Shu tufayli bir xil nusxani ham eski, ham yangi sxemali bazaga tiklash
 * mumkin. Sxema keyin migratsiya bilan ko'tarilsa, Prisma migratsiyasi
 * ma'lumotni o'zi ko'chiradi (`course_multi_mentor` shunday qiladi).
 *
 * ID'lar, sanalar va JSON maydonlar nusxadagidek saqlanadi — havolalar
 * (masalan Enrollment.courseId) ishlab turishi uchun shart.
 *
 * HAMMASI YOKI HECH NARSA: bitta tranzaksiya. O'rtada xato chiqsa baza
 * chala to'ldirilgan holda qolmaydi.
 *
 * XAVFSIZLIK: bo'sh bo'lmagan bazaga yozmaydi (FORCE=true kerak).
 *
 * Ishga tushirish:
 *   $env:DATABASE_URL='<baza>'; npm run restore -- "C:\...\nusxa.json"
 *   $env:DRY_RUN='true'; ...   (faqat rejani ko'rsatadi)
 */

const DRY_RUN = process.env.DRY_RUN === 'true';
const FORCE = process.env.FORCE === 'true';

/**
 * Tiklash tartibi — chet kalit bog'liqligi bo'yicha: ota jadval bolasidan
 * OLDIN. Bazada yo'q jadvallar jimgina o'tkazib yuboriladi (sxema versiyasi
 * har xil bo'lishi mumkin).
 */
const ORDER = [
  'User',
  'Mentor',
  'Course',
  'CourseMentor',
  'Module',
  'Lesson',
  'Project',
  'TeamMember',
  'TeamMemberProject',
  'Partner',
  'BlogPost',
  'Testimonial',
  'SiteSetting',
  'Moment',
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
  'EngagementDaily',
];

type Row = Record<string, unknown>;

interface ColumnInfo {
  name: string;
  isArray: boolean;
  isJson: boolean;
}

async function tableColumns(client: Client, table: string): Promise<Map<string, ColumnInfo> | null> {
  const res = await client.query(
    `SELECT column_name, data_type
       FROM information_schema.columns
      WHERE table_schema = 'public' AND table_name = $1`,
    [table]
  );
  if (res.rowCount === 0) return null;

  const map = new Map<string, ColumnInfo>();
  for (const r of res.rows) {
    map.set(r.column_name, {
      name: r.column_name,
      // Postgres massiv ustunlari information_schema'da 'ARRAY' bo'lib ko'rinadi
      isArray: r.data_type === 'ARRAY',
      isJson: r.data_type === 'json' || r.data_type === 'jsonb',
    });
  }
  return map;
}

/** Qiymatni pg drayveri to'g'ri yuboradigan ko'rinishga keltiradi */
function toParam(value: unknown, col: ColumnInfo): unknown {
  if (value === null || value === undefined) {
    // Massiv ustun NOT NULL bo'lishi mumkin (masalan TeamMember.skills),
    // nusxada esa null bo'lib tushgan — bo'sh massivga aylantiramiz
    return col.isArray ? [] : null;
  }
  // JSON ustunga obyekt/massiv bersak, pg uni avtomatik JSON.stringify qiladi;
  // lekin massiv JSON ustunda Postgres massivi deb talqin qilinmasligi uchun
  // ochiq-oydin satrga o'giramiz
  if (col.isJson && typeof value === 'object') return JSON.stringify(value);
  return value;
}

async function main(): Promise<void> {
  const file = process.argv[2];
  if (!file) throw new Error('Nusxa fayli ko\'rsatilmagan. Masalan: npm run restore -- "C:\\...\\nusxa.json"');
  if (!process.env.DATABASE_URL) throw new Error('DATABASE_URL berilmagan');

  const abs = path.resolve(file);
  const backup = JSON.parse(fs.readFileSync(abs, 'utf8')) as {
    exportedAt?: string;
    database?: string;
    tables: Record<string, Row[]>;
  };
  const tables = backup.tables ?? {};

  console.log(`Nusxa:        ${abs}`);
  console.log(`Olingan sana: ${backup.exportedAt ?? '(nomalum)'}`);
  console.log(`Manba baza:   ${backup.database ?? '(nomalum)'}`);
  console.log(`Nishon baza:  ${process.env.DATABASE_URL.replace(/:[^:@]+@/, ':***@')}\n`);

  const client = new Client({ connectionString: process.env.DATABASE_URL, connectionTimeoutMillis: 30_000 });
  await client.connect();

  try {
    // --- Bo'shlik tekshiruvi
    const users = await client.query('SELECT count(*)::int AS n FROM "User"');
    if (users.rows[0].n > 0 && !FORCE) {
      throw new Error(`Baza bo'sh emas (${users.rows[0].n} ta foydalanuvchi). Ustidan yozish uchun FORCE=true bering.`);
    }

    const plan: { table: string; rows: Row[]; cols: Map<string, ColumnInfo>; skipped: string[] }[] = [];
    const missingTables: string[] = [];

    for (const table of ORDER) {
      const rows = tables[table] ?? [];
      if (rows.length === 0) continue;

      const cols = await tableColumns(client, table);
      if (!cols) {
        missingTables.push(table);
        continue;
      }

      // Nusxada bor, lekin bazada yo'q ustunlar (sxema oldinga ketgan)
      const skipped = [...new Set(rows.flatMap((r) => Object.keys(r)))].filter((k) => !cols.has(k));
      plan.push({ table, rows, cols, skipped });
    }

    // Nusxada bor, lekin ORDER ro'yxatiga kirmagan jadvallar — jimgina
    // yo'qotib qo'ymaslik uchun ochiq aytiladi
    const known = new Set(ORDER);
    const unlisted = Object.keys(tables).filter((t) => !known.has(t) && (tables[t] ?? []).length > 0);

    for (const { table, rows, skipped } of plan) {
      console.log(`  ${table.padEnd(24)} ${String(rows.length).padStart(4)} ta qator` +
        (skipped.length > 0 ? `   (bazada yo'q ustunlar o'tkazildi: ${skipped.join(', ')})` : ''));
    }
    if (missingTables.length > 0) console.log(`\n  Bazada bunday jadval yo'q, o'tkazildi: ${missingTables.join(', ')}`);
    if (unlisted.length > 0) console.log(`  DIQQAT — ro'yxatda yo'q jadvallar TIKLANMADI: ${unlisted.join(', ')}`);

    if (DRY_RUN) {
      console.log(`\nJami: ${plan.reduce((n, p) => n + p.rows.length, 0)} ta qator (DRY RUN — hech narsa yozilmadi).`);
      return;
    }

    await client.query('BEGIN');
    let total = 0;

    for (const { table, rows, cols } of plan) {
      for (const row of rows) {
        const names = Object.keys(row).filter((k) => cols.has(k));
        const values = names.map((n) => toParam(row[n], cols.get(n)!));
        const placeholders = names.map((_, i) => `$${i + 1}`).join(', ');
        const quoted = names.map((n) => `"${n}"`).join(', ');

        await client.query(
          `INSERT INTO "${table}" (${quoted}) VALUES (${placeholders}) ON CONFLICT DO NOTHING`,
          values
        );
        total += 1;
      }
      console.log(`  ${table.padEnd(24)} yozildi`);
    }

    await client.query('COMMIT');
    console.log(`\nJami: ${total} ta qator tiklandi.`);
  } catch (err) {
    await client.query('ROLLBACK').catch(() => {});
    throw err;
  } finally {
    await client.end().catch(() => {});
  }
}

main().catch((err) => {
  console.error(`\nXATO: ${err instanceof Error ? err.message : err}`);
  process.exitCode = 1;
});
