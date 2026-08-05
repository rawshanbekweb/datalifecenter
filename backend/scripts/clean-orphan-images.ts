import 'dotenv/config';
import fs from 'node:fs';
import path from 'node:path';
import { Client } from 'pg';

/**
 * Supabase Storage'da qolib ketgan, bazada HECH QAYERDA ishlatilmayotgan
 * rasmlarni topadi va o'chiradi.
 *
 * NEGA KERAK: admin rasmni almashtirganda eskisi bazadan uziladi, lekin
 * xotirada qolaveradi. Vaqt o'tib bucket ishlatilmaydigan fayllar bilan
 * to'lib boradi va qaysi biri kerakligini ajratib bo'lmay qoladi.
 *
 * XAVFSIZLIK QOIDALARI:
 *   1. Bazadagi HAR BIR rasm ustuni tekshiriladi. Yangi ustun qo'shilsa
 *      quyidagi ro'yxatga ham qo'shish SHART — aks holda ishlatilayotgan
 *      fayl "yetim" deb hisoblanib o'chib ketadi.
 *   2. O'chirishdan OLDIN har bir fayl diskka nusxalanadi (--backup-dir).
 *      Xatoni qaytarib bo'ladigan qilish uchun.
 *   3. Standart holatda FAQAT ro'yxatni ko'rsatadi. O'chirish uchun
 *      ataylab `--delete` kerak.
 *
 * Ishga tushirish:
 *   $env:DATABASE_URL='...'; $env:SB_KEY='...'; npm run clean:images
 *   ... npm run clean:images -- --delete
 */

const SUPABASE_URL = (process.env.SUPABASE_URL || 'https://htwvvuwkrajazwsymycg.supabase.co').replace(/\/+$/, '');
const KEY = process.env.SB_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY || '';
const BUCKET = process.env.SUPABASE_BUCKET_IMAGES || 'datalife-images';
const DELETE = process.argv.includes('--delete');

const BACKUP_DIR =
  process.argv.find((a) => a.startsWith('--backup-dir='))?.split('=')[1] ??
  path.join(process.env.USERPROFILE || process.env.HOME || '.', 'Desktop', 'datalife-ochirilgan-rasmlar');

/**
 * Bazadagi rasm havolasi bo'lgan BARCHA ustunlar.
 * Yangi ustun qo'shilsa shu yerga ham qo'shing (yuqoridagi 1-qoida).
 */
const IMAGE_COLUMNS: [table: string, column: string][] = [
  ['User', 'avatarUrl'],
  ['Mentor', 'photoUrl'],
  ['TeamMember', 'photoUrl'],
  ['Partner', 'logoUrl'],
  ['Project', 'screenshotUrl'],
  ['Moment', 'imageUrl'],
  ['Testimonial', 'avatarUrl'],
  ['Announcement', 'fileUrl'],
];

interface StorageFile {
  name: string;
  created_at: string;
  metadata?: { size?: number };
}

async function listBucket(): Promise<StorageFile[]> {
  const res = await fetch(`${SUPABASE_URL}/storage/v1/object/list/${BUCKET}`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${KEY}`, apikey: KEY, 'Content-Type': 'application/json' },
    body: JSON.stringify({ prefix: '', limit: 1000, offset: 0, sortBy: { column: 'created_at', order: 'desc' } }),
  });
  if (!res.ok) throw new Error(`Bucket o'qilmadi (${res.status}): ${(await res.text()).slice(0, 200)}`);
  return res.json();
}

async function main(): Promise<void> {
  if (!KEY) throw new Error("SB_KEY (yoki SUPABASE_SERVICE_ROLE_KEY) berilmagan");
  if (!process.env.DATABASE_URL) throw new Error('DATABASE_URL berilmagan');

  const client = new Client({ connectionString: process.env.DATABASE_URL, connectionTimeoutMillis: 30_000 });
  await client.connect();

  try {
    const used = new Set<string>();
    for (const [table, column] of IMAGE_COLUMNS) {
      const exists = await client.query(
        `SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name=$1 AND column_name=$2`,
        [table, column]
      );
      if (exists.rowCount === 0) {
        console.log(`  DIQQAT: ${table}.${column} bazada yo'q — o'tkazib yuborildi`);
        continue;
      }
      const rows = await client.query(
        `SELECT "${column}" AS url FROM "${table}" WHERE "${column}" IS NOT NULL AND "${column}" <> ''`
      );
      for (const { url } of rows.rows) {
        const name = String(url).split('?')[0].split('/').pop();
        if (name) used.add(decodeURIComponent(name));
      }
    }

    // Sayt sozlamalari JSON ichidagi havolalar ham hisobga olinadi
    const settings = await client.query(`SELECT data::text AS raw FROM "SiteSetting"`);
    const settingsText = settings.rows.map((r: { raw: string }) => r.raw).join(' ');

    const files = await listBucket();
    const orphans = files.filter((f) => !used.has(f.name) && !settingsText.includes(f.name));

    console.log(`\nBucket "${BUCKET}": ${files.length} ta fayl`);
    console.log(`Bazada ishlatilyapti: ${used.size} ta havola`);
    console.log(`Yetim (hech qayerda ishlatilmaydi): ${orphans.length} ta\n`);

    if (orphans.length === 0) {
      console.log('Tozalanadigan narsa yo\'q.');
      return;
    }

    for (const f of orphans) {
      const kb = f.metadata?.size ? Math.round(f.metadata.size / 1024) : '?';
      console.log(`  ${f.created_at.slice(0, 19)}  ${String(kb).padStart(5)} KB  ${f.name}`);
    }

    if (!DELETE) {
      console.log(`\nHech narsa o'chirilmadi. O'chirish uchun: npm run clean:images -- --delete`);
      return;
    }

    // 2-qoida: avval nusxa, keyin o'chirish
    fs.mkdirSync(BACKUP_DIR, { recursive: true });
    console.log(`\nZaxira nusxa: ${BACKUP_DIR}`);

    for (const f of orphans) {
      const res = await fetch(`${SUPABASE_URL}/storage/v1/object/public/${BUCKET}/${encodeURIComponent(f.name)}`);
      if (!res.ok) {
        throw new Error(`"${f.name}" yuklab olinmadi (HTTP ${res.status}) — o'chirish TO'XTATILDI`);
      }
      fs.writeFileSync(path.join(BACKUP_DIR, f.name), Buffer.from(await res.arrayBuffer()));
    }
    console.log(`  ${orphans.length} ta fayl nusxalandi`);

    const del = await fetch(`${SUPABASE_URL}/storage/v1/object/${BUCKET}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${KEY}`, apikey: KEY, 'Content-Type': 'application/json' },
      body: JSON.stringify({ prefixes: orphans.map((f) => f.name) }),
    });
    if (!del.ok) throw new Error(`O'chirilmadi (${del.status}): ${(await del.text()).slice(0, 300)}`);

    const left = await listBucket();
    console.log(`\nO'chirildi: ${orphans.length} ta. Bucketda qoldi: ${left.length} ta fayl.`);
  } finally {
    await client.end().catch(() => {});
  }
}

main().catch((err) => {
  console.error(`\nXATO: ${err instanceof Error ? err.message : err}`);
  process.exitCode = 1;
});
