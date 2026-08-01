import { env } from '../../config/env';

// Supabase Storage adapteri — Cloudinary'ga muqobil (Cloudinary O'zbekistondan
// ro'yxatdan o'tishni bloklaydi). SDK (@supabase/supabase-js) ATAYIN qo'shilmadi:
// bizga uchta amal kerak (yuklash, imzolash, o'chirish) va ular oddiy REST
// so'rovlari — qo'shimcha bog'liqlik olib kelishga arzimaydi.
//
// Ikki bucket ishlatiladi:
//   images — OCHIQ (public). Sayt rasmlari to'g'ridan-to'g'ri shu URL'dan yuklanadi.
//   videos — YOPIQ (private). Xom URL ishlamaydi, faqat vaqtinchalik imzoli havola
//            ochadi — bu Cloudinary'dagi `type: authenticated` bilan bir xil model.
//
// ESLATMA: to'lov cheklari ham `images` bucketiga tushadi, ya'ni URL'ni bilgan
// odam ochib ko'ra oladi. Bu Cloudinary'dagi hozirgi xatti-harakat bilan AYNAN
// bir xil (u yerda ham rasmlar public): URL hech qachon mijozga berilmaydi,
// chek faqat `GET /api/enrollments/:id/receipt` orqali, huquq tekshirilgandan
// keyin proxy qilinadi.

const API = env.SUPABASE_URL ? `${env.SUPABASE_URL.replace(/\/$/, '')}/storage/v1` : '';
const KEY = env.SUPABASE_SERVICE_ROLE_KEY ?? '';

export const supabaseEnabled = Boolean(env.SUPABASE_URL && env.SUPABASE_SERVICE_ROLE_KEY);

export const BUCKETS = {
  images: env.SUPABASE_BUCKET_IMAGES,
  videos: env.SUPABASE_BUCKET_VIDEOS,
} as const;

type Kind = keyof typeof BUCKETS;

function authHeaders(extra: Record<string, string> = {}): Record<string, string> {
  return { Authorization: `Bearer ${KEY}`, apikey: KEY, ...extra };
}

// Yo'lni bo'g'inma-bo'g'in kodlaymiz — butunicha kodlansa papka ajratuvchi "/"
// ham kodlanib ketadi va Supabase boshqa faylni izlaydi.
const encodePath = (p: string) => p.split('/').map(encodeURIComponent).join('/');
const decodePath = (p: string) => p.split('/').map(decodeURIComponent).join('/');

async function ensureBucket(kind: Kind): Promise<void> {
  // Bucket qo'lda yaratilmagan bo'lsa o'zimiz yaratamiz — sozlash uchun
  // Supabase panelida hech narsa qilish shart bo'lmasin (faqat 2 ta env).
  const res = await fetch(`${API}/bucket`, {
    method: 'POST',
    headers: authHeaders({ 'Content-Type': 'application/json' }),
    body: JSON.stringify({
      id: BUCKETS[kind],
      name: BUCKETS[kind],
      public: kind === 'images',
    }),
  });
  // 409 = allaqachon mavjud (poygada boshqa so'rov yaratib ulgurgan) — bu xato emas
  if (!res.ok && res.status !== 409) {
    throw new Error(`Supabase bucket yaratilmadi (${res.status}): ${await res.text()}`);
  }
}

/** Faylni yuklaydi va bazaga saqlanadigan URL qaytaradi. */
export async function upload(
  body: Buffer,
  kind: Kind,
  objectName: string,
  contentType: string
): Promise<string> {
  const path = objectName;
  const url = `${API}/object/${BUCKETS[kind]}/${encodePath(path)}`;
  const send = () =>
    fetch(url, {
      method: 'POST',
      headers: authHeaders({
        'Content-Type': contentType,
        'cache-control': 'max-age=31536000',
        'x-upsert': 'true',
      }),
      body: new Uint8Array(body),
    });

  let res = await send();
  if (res.status === 404) {
    // "Bucket not found" — birinchi yuklashda yaratamiz va qayta uramiz
    await ensureBucket(kind);
    res = await send();
  }
  if (!res.ok) {
    throw new Error(`Supabase yuklash xatosi (${res.status}): ${await res.text()}`);
  }

  // Ochiq bucket — doimiy public URL; yopiq bucket — imzosiz kanonik URL
  // (u holicha ochilmaydi, signUrls() orqali vaqtinchalik havolaga aylanadi).
  return kind === 'images'
    ? `${API}/object/public/${BUCKETS[kind]}/${encodePath(path)}`
    : `${API}/object/${BUCKETS[kind]}/${encodePath(path)}`;
}

export type SupabaseObject = { bucket: string; path: string };

/** Supabase URL'idan bucket va yo'lni ajratadi; boshqa manzillar uchun null. */
export function parseUrl(url: string): SupabaseObject | null {
  if (!API || !url.startsWith(`${API}/object/`)) return null;
  const rest = url.slice(`${API}/object/`.length).replace(/^public\//, '').split('?')[0];
  const slash = rest.indexOf('/');
  if (slash <= 0) return null;
  return { bucket: rest.slice(0, slash), path: decodePath(rest.slice(slash + 1)) };
}

/**
 * Yopiq bucketdagi fayllarga vaqtinchalik imzoli havola oladi.
 *
 * ATAYIN TO'PLAMLI: Cloudinary imzoni lokal hisoblaydi, Supabase esa HTTP
 * so'rov talab qiladi. Bir kursda 30 ta dars bo'lishi mumkin — har biri uchun
 * alohida so'rov yuborilsa sahifa ochilishi sekinlashadi, shuning uchun
 * bitta so'rovda hammasi imzolanadi.
 */
export async function signUrls(objects: SupabaseObject[], expiresIn: number): Promise<Map<string, string>> {
  const signed = new Map<string, string>();
  if (objects.length === 0) return signed;

  // Bucketlar bo'yicha guruhlaymiz — endpoint bucketga bog'liq
  const byBucket = new Map<string, string[]>();
  for (const o of objects) {
    const list = byBucket.get(o.bucket) ?? [];
    list.push(o.path);
    byBucket.set(o.bucket, list);
  }

  for (const [bucket, paths] of byBucket) {
    const res = await fetch(`${API}/object/sign/${bucket}`, {
      method: 'POST',
      headers: authHeaders({ 'Content-Type': 'application/json' }),
      body: JSON.stringify({ expiresIn, paths }),
    });
    if (!res.ok) {
      // Imzolash uzilsa video ochilmaydi, lekin butun sahifa yiqilmasin
      console.error(`Supabase imzolash xatosi (${res.status}):`, await res.text());
      continue;
    }
    const rows = (await res.json()) as { path: string; signedURL: string | null; error: string | null }[];
    for (const row of rows) {
      if (row.signedURL) signed.set(`${bucket}/${row.path}`, `${API}${row.signedURL}`);
    }
  }

  return signed;
}

export async function remove(object: SupabaseObject): Promise<void> {
  const res = await fetch(`${API}/object/${object.bucket}/${encodePath(object.path)}`, {
    method: 'DELETE',
    headers: authHeaders(),
  });
  // 404 — fayl allaqachon yo'q, bu xato emas
  if (!res.ok && res.status !== 404) {
    throw new Error(`Supabase o'chirish xatosi (${res.status}): ${await res.text()}`);
  }
}
