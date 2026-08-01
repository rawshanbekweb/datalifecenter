import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import 'dotenv/config';

// Bazadagi barcha fayl havolalarini bir joyda ko'rsatadi va ularning haqiqatan
// ochilishini tekshiradi. Maqsad: Render kabi EPHEMERAL diskda yo'qolgan
// (yoki tashqi CDN tomonidan bloklangan) rasmlarni admin qo'lda qidirmasin —
// nimani qayta yuklash kerakligi aniq ro'yxat bo'lib chiqsin.
//
// Faqat O'QIYDI — bazaga ham, fayllarga ham hech narsa yozmaydi.
//
// Ishga tushirish:  npm run check:uploads                        (lokal baza)
//                   DATABASE_URL=<prod url> npm run check:uploads
//                   SKIP_HTTP=true npm run check:uploads         (tarmoqsiz, faqat tasnif)
//
// Nisbiy havolalar (masalan /uploads/x.jpg yoki /partners/logo.svg) faqat
// tegishli manzil berilganda tekshiriladi:
//   API_URL=https://api.example.com FRONTEND_URL=https://datalife.uz npm run check:uploads

const needsSsl = /\.render\.com/.test(process.env.DATABASE_URL ?? '');
const adapter = new PrismaPg({
  connectionString: process.env.DATABASE_URL,
  ...(needsSsl ? { ssl: { rejectUnauthorized: false } } : {}),
});
const prisma = new PrismaClient({ adapter });

const SKIP_HTTP = process.env.SKIP_HTTP === 'true';
const CONCURRENCY = 6;
const REQUEST_TIMEOUT_MS = 15_000;
const API_URL = process.env.API_URL?.replace(/\/$/, '');
const FRONTEND_URL = process.env.FRONTEND_URL?.replace(/\/$/, '');

// cloud    — Cloudinary'da, deploydan omon qoladi
// local    — server diskidagi /uploads fayli, Render'da EPHEMERAL
// static   — frontend repo'sidagi fayl (public/), deploy bilan birga keladi
// external — begona sayt/CDN (Instagram, unsplash va h.k.)
type Storage = 'cloud' | 'local' | 'static' | 'external';

type Entry = {
  group: string;
  label: string;
  url: string | null;
  fix: string;
  // Dars videosi imzoli havola bilan beriladi — xom URL doim rad javob qaytaradi
  isVideo?: boolean;
};

type Item = Entry & {
  url: string;
  storage: Storage;
  probeUrl?: string;
  // Tekshirilmaslik sababi: video imzo talab qiladi yoki nisbiy havola uchun
  // bazaviy manzil (API_URL/FRONTEND_URL) berilmagan.
  skipReason?: string;
  // ok          — ochildi
  // http-error  — server javob berdi, lekin 404/403 kabi (fayl haqiqatan yo'q)
  // unreachable — serverga umuman ulanib bo'lmadi (fayl haqida hech narsa deyish mumkin emas)
  result?: 'ok' | 'http-error' | 'unreachable';
  status?: string;
};

function classify(url: string): Storage {
  if (/res\.cloudinary\.com/.test(url) || /\.supabase\.co\/storage\/v1\//.test(url)) return 'cloud';
  if (url.includes('/uploads/')) return 'local';
  if (url.startsWith('/')) return 'static';
  return 'external';
}

// Nisbiy havolani to'liq manzilga aylantiradi. Bazaviy manzil berilmagan bo'lsa
// null qaytaradi — bunday havola tekshirilmaydi (soxta "ochilmadi" bermaslik uchun).
function resolveUrl(url: string, storage: Storage): string | null {
  if (/^https?:\/\//.test(url)) return url;
  const base = storage === 'local' ? API_URL : FRONTEND_URL;
  return base ? `${base}${url.startsWith('/') ? '' : '/'}${url}` : null;
}

// Ko'p tilli Json maydondan o'qiladigan matn ajratadi
function text(value: unknown): string {
  if (typeof value === 'string') return value;
  if (value && typeof value === 'object') {
    const v = value as Record<string, unknown>;
    const first = v.uz ?? v.ru ?? v.en ?? v.kaa ?? Object.values(v)[0];
    if (typeof first === 'string') return first;
  }
  return '—';
}

async function collect(): Promise<Item[]> {
  const items: Item[] = [];
  const add = (entry: Entry) => {
    const url = entry.url?.trim();
    if (!url) return;

    const storage = classify(url);
    const probeUrl = resolveUrl(url, storage);
    let skipReason: string | undefined;
    if (entry.isVideo && storage !== 'external') {
      skipReason = 'video imzo talab qiladi';
    } else if (!probeUrl) {
      skipReason = storage === 'local' ? "nisbiy havola — API_URL berilmagan" : "nisbiy havola — FRONTEND_URL berilmagan";
    }

    items.push({ ...entry, url, storage, probeUrl: probeUrl ?? undefined, skipReason });
  };

  const [mentors, partners, projects, testimonials, users, lessons, enrollments, subscriptions, submissions] =
    await Promise.all([
      prisma.mentor.findMany({ select: { name: true, photoUrl: true } }),
      prisma.partner.findMany({ select: { name: true, logoUrl: true } }),
      prisma.project.findMany({ select: { title: true, screenshotUrl: true } }),
      prisma.testimonial.findMany({ select: { name: true, avatarUrl: true } }),
      prisma.user.findMany({
        where: { avatarUrl: { not: null } },
        select: { email: true, avatarUrl: true },
      }),
      prisma.lesson.findMany({
        where: { videoUrl: { not: null } },
        select: { title: true, videoUrl: true, module: { select: { course: { select: { title: true } } } } },
      }),
      prisma.enrollment.findMany({
        where: { receiptUrl: { not: null } },
        select: { receiptUrl: true, user: { select: { email: true } }, course: { select: { title: true } } },
      }),
      prisma.subscription.findMany({
        where: { receiptUrl: { not: null } },
        select: { receiptUrl: true, user: { select: { email: true } } },
      }),
      prisma.assignmentSubmission.findMany({
        where: { fileUrl: { not: null } },
        select: { fileUrl: true, user: { select: { email: true } }, assignment: { select: { title: true } } },
      }),
    ]);

  for (const m of mentors) {
    add({ group: 'Mentor rasmi', label: m.name, url: m.photoUrl, fix: '/admin/mentors' });
  }
  for (const p of partners) {
    add({ group: 'Hamkor logotipi', label: p.name, url: p.logoUrl, fix: '/admin/partners' });
  }
  for (const p of projects) {
    add({ group: 'Loyiha skrinshoti', label: text(p.title), url: p.screenshotUrl, fix: '/admin/projects' });
  }
  for (const t of testimonials) {
    add({ group: 'Sharh avatari', label: t.name, url: t.avatarUrl, fix: '/admin/testimonials' });
  }
  for (const u of users) {
    add({
      group: 'Foydalanuvchi avatari',
      label: u.email,
      url: u.avatarUrl,
      fix: "foydalanuvchi o'z profilidan qayta yuklaydi",
    });
  }
  for (const l of lessons) {
    add({
      group: 'Dars videosi',
      label: `${text(l.module.course.title)} → ${text(l.title)}`,
      url: l.videoUrl,
      fix: 'kurs dasturi (curriculum) tahriri',
      isVideo: true,
    });
  }
  for (const e of enrollments) {
    add({
      group: "To'lov cheki (kurs)",
      label: `${e.user.email} — ${text(e.course.title)}`,
      url: e.receiptUrl,
      fix: 'talaba kabinetidan chekni qayta yuboradi',
    });
  }
  for (const s of subscriptions) {
    add({
      group: "To'lov cheki (obuna)",
      label: s.user.email,
      url: s.receiptUrl,
      fix: 'talaba kabinetidan chekni qayta yuboradi',
    });
  }
  for (const s of submissions) {
    add({
      group: 'Topshiriq fayli',
      label: `${s.user.email} — ${text(s.assignment.title)}`,
      url: s.fileUrl,
      fix: 'talaba javobni qayta yuboradi',
    });
  }

  return items;
}

async function probe(url: string): Promise<Pick<Item, 'result' | 'status'>> {
  try {
    // Ba'zi CDN'lar HEAD'ni qo'llab-quvvatlamaydi — 405 kelsa GET bilan qayta uriniladi
    let res = await fetch(url, { method: 'HEAD', signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS) });
    if (res.status === 405 || res.status === 501) {
      res = await fetch(url, { method: 'GET', signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS) });
    }
    return { result: res.ok ? 'ok' : 'http-error', status: String(res.status) };
  } catch (err) {
    // Serverning o'zi javob bermadi — bu fayl yo'qligini ANGLATMAYDI (masalan
    // lokal dev server o'chiq yoki Render instansi uxlab qolgan).
    const name = (err as Error)?.name;
    return { result: 'unreachable', status: name === 'TimeoutError' ? 'vaqt tugadi' : "ulanib bo'lmadi" };
  }
}

async function probeAll(items: Item[]): Promise<void> {
  const queue = items.filter((i) => !i.skipReason && i.probeUrl);
  let cursor = 0;
  const workers = Array.from({ length: Math.min(CONCURRENCY, queue.length) }, async () => {
    while (cursor < queue.length) {
      const item = queue[cursor++];
      Object.assign(item, await probe(item.probeUrl!));
    }
  });
  await Promise.all(workers);
}

function shorten(url: string, max = 72): string {
  return url.length > max ? `${url.slice(0, max - 1)}…` : url;
}

async function main(): Promise<void> {
  const dbHost = /@([^/:]+)/.exec(process.env.DATABASE_URL ?? '')?.[1] ?? 'noma\'lum';
  const cloudinaryOn = Boolean(
    process.env.CLOUDINARY_CLOUD_NAME && process.env.CLOUDINARY_API_KEY && process.env.CLOUDINARY_API_SECRET
  );
  const supabaseOn = Boolean(process.env.SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY);
  const cloudOn = cloudinaryOn || supabaseOn;
  const cloudName = cloudinaryOn ? 'cloudinary' : supabaseOn ? 'supabase' : null;

  console.log('\nDATA LIFE — yuklangan fayllar auditi');
  console.log(`Baza:          ${dbHost}`);
  console.log(`Bulut xotira:  ${cloudName ? `${cloudName} (shu jarayon env'ida)` : "YO'Q (shu jarayon env'ida)"}`);
  console.log(`API_URL:       ${API_URL ?? '(berilmagan)'}`);
  console.log(`FRONTEND_URL:  ${FRONTEND_URL ?? '(berilmagan)'}`);

  const items = await collect();
  if (items.length === 0) {
    console.log('\nBazada birorta fayl havolasi topilmadi.\n');
    return;
  }

  if (!SKIP_HTTP) {
    const checkable = items.filter((i) => !i.skipReason && i.probeUrl).length;
    console.log(`\n${checkable} ta havola tekshirilmoqda…`);
    await probeAll(items);
  }

  const counts = {
    cloud: items.filter((i) => i.storage === 'cloud').length,
    local: items.filter((i) => i.storage === 'local').length,
    static: items.filter((i) => i.storage === 'static').length,
    external: items.filter((i) => i.storage === 'external').length,
  };

  console.log('\nXulosa');
  console.log(`  Bulutda (doimiy):        ${counts.cloud}`);
  console.log(`  Server diskida:          ${counts.local}   ← Render'da keyingi deployda yo'qoladi`);
  console.log(`  Frontend fayli:          ${counts.static}   (repo ichida — xavf yo'q)`);
  console.log(`  Tashqi havola:           ${counts.external}`);
  console.log(`  Jami:                    ${items.length}`);

  const broken = items.filter((i) => i.result === 'http-error');
  const unreachable = items.filter((i) => i.result === 'unreachable');
  const risky = items.filter((i) => i.storage === 'local' && i.result !== 'http-error');

  if (broken.length > 0) {
    console.log(`\n\nOCHILMAYAPTI — qayta yuklash kerak (${broken.length} ta)`);
    console.log('─'.repeat(78));
    for (const group of [...new Set(broken.map((i) => i.group))]) {
      console.log(`\n  ${group}`);
      for (const i of broken.filter((x) => x.group === group)) {
        console.log(`    • ${i.label}`);
        console.log(`      ${i.status}  ${shorten(i.url)}`);
        console.log(`      → ${i.fix}`);
      }
    }
  } else if (!SKIP_HTTP) {
    console.log('\n\nOchilmaydigan havola topilmadi.');
  }

  if (unreachable.length > 0) {
    // Bu fayl yo'qligini anglatmaydi — server javob bermadi (dev server o'chiq,
    // Render instansi uxlab qolgan yoki tarmoq bloklagan).
    const hosts = [...new Set(unreachable.map((i) => new URL(i.probeUrl!).host))];
    console.log(`\n\nJAVOB KELMADI (${unreachable.length} ta) — server ishlayotganini tekshiring:`);
    console.log(`  ${hosts.join(', ')}`);
    console.log('  Bu fayllar yo\'q degani EMAS; audit ular haqida hech narsa deya olmadi.');
  }

  if (risky.length > 0) {
    console.log(`\n\nSERVER DISKIDA (${risky.length} ta)`);
    console.log("Bulut xotira yoqilmasa, bular keyingi deployda yo'qoladi:");
    console.log('─'.repeat(78));
    for (const i of risky) {
      console.log(`    • [${i.group}] ${i.label}`);
      console.log(`      → ${i.fix}`);
    }
  }

  const skipped = items.filter((i) => i.skipReason);
  if (skipped.length > 0 && !SKIP_HTTP) {
    console.log(`\n\nTEKSHIRILMADI (${skipped.length} ta)`);
    console.log('─'.repeat(78));
    for (const reason of [...new Set(skipped.map((i) => i.skipReason))]) {
      const group = skipped.filter((i) => i.skipReason === reason);
      console.log(`  ${reason} — ${group.length} ta`);
      for (const i of group.slice(0, 5)) {
        console.log(`    · [${i.group}] ${i.label}`);
      }
      if (group.length > 5) console.log(`    · … va yana ${group.length - 5} ta`);
    }
  }

  if (counts.local > 0 && !cloudOn) {
    console.log("\n\nKEYINGI QADAM: bulut xotira sozlansin (README → \"Fayl xotirasi\" —");
    console.log("SUPABASE_URL + SUPABASE_SERVICE_ROLE_KEY), keyin yuqoridagi fayllar bir");
    console.log("marta qayta yuklansin — undan keyin ular doimiy bo'ladi.");
  }

  console.log('');
}

main()
  .catch((err) => {
    console.error('Audit xatosi:', err);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
