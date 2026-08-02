import fs from 'fs/promises';
import { createReadStream } from 'fs';
import path from 'path';
import { v2 as cloudinary, UploadApiResponse } from 'cloudinary';
import { env } from '../config/env';
import { IMAGES_DIR, VIDEOS_DIR } from '../config/uploads';
import { signLocalVideoUrl } from '../utils/videoAccess';
import * as supabase from './storage/supabase';

const VIDEO_URL_TTL_SECONDS = 6 * 3600;

// Render/Railway kabi ephemeral hostingda lokal disk deploy'da tozalanadi —
// bulut xotira sozlansa fayllar u yerga ko'chadi va URL'lar doimiy bo'ladi.
// Sozlanmasa avvalgidek lokal diskda qoladi (development uchun qulay).
//
// Ikki provayder qo'llab-quvvatlanadi. Cloudinary ba'zi mamlakatlarda (jumladan
// O'zbekistonda) ro'yxatdan o'tishni bloklaydi — o'sha holat uchun Supabase
// Storage bor. Ikkalasi sozlangan bo'lsa Cloudinary ustun turadi, chunki
// avvaldan ishlab turgan o'rnatmalar xatti-harakatini o'zgartirmaslik kerak.
export const cloudinaryEnabled = Boolean(
  env.CLOUDINARY_CLOUD_NAME && env.CLOUDINARY_API_KEY && env.CLOUDINARY_API_SECRET
);

export const storageProvider: 'cloudinary' | 'supabase' | 'local' = cloudinaryEnabled
  ? 'cloudinary'
  : supabase.supabaseEnabled
    ? 'supabase'
    : 'local';

export const cloudStorageEnabled = storageProvider !== 'local';

if (cloudinaryEnabled) {
  cloudinary.config({
    cloud_name: env.CLOUDINARY_CLOUD_NAME,
    api_key: env.CLOUDINARY_API_KEY,
    api_secret: env.CLOUDINARY_API_SECRET,
    secure: true,
  });
}

// Lokal faylni bulut xotiraga yuklab, doimiy URL qaytaradi.
//
// Ikkala provayder ham faylni DISKDAN OQIM bilan oladi, xotiraga to'liq
// o'qimaydi: Cloudinary — upload_large (bo'laklab), Supabase — HTTP so'rov
// tanasi oqim sifatida. 500 MB video Buffer'ga o'qilsa kichik instansiya
// (Render 512 MB) OOM bilan o'lardi.
export async function uploadToCloud(
  filePath: string,
  kind: 'images' | 'videos',
  contentType = 'application/octet-stream'
): Promise<{ url: string }> {
  if (storageProvider === 'supabase') {
    const { size } = await fs.stat(filePath);
    const url = await supabase.upload(
      { open: () => createReadStream(filePath), size },
      kind,
      path.basename(filePath),
      contentType
    );
    return { url };
  }

  const options = {
    folder: `datalife/${kind}`,
    resource_type: (kind === 'videos' ? 'video' : 'image') as 'video' | 'image',
    // Video "authenticated" turida yuklanadi — xom secure_url imzosiz ishlamaydi,
    // faqat signVideoUrl() bilan generatsiya qilingan vaqtinchalik havola ochadi.
    // Rasm oldingidek public (type: 'upload') qoladi.
    ...(kind === 'videos' ? { type: 'authenticated' as const } : {}),
  };

  const result: UploadApiResponse =
    kind === 'videos'
      ? await new Promise((resolve, reject) => {
          cloudinary.uploader.upload_large(filePath, { ...options, chunk_size: 20 * 1024 * 1024 }, (err, res) =>
            err || !res ? reject(err ?? new Error('Cloudinary javob qaytarmadi')) : resolve(res)
          );
        })
      : await cloudinary.uploader.upload(filePath, options);

  return { url: result.secure_url };
}

// Cloudinary URL'idan public_id ni ajratadi:
// https://res.cloudinary.com/<cloud>/video/upload/v123/datalife/videos/abc.mp4
//   → { publicId: 'datalife/videos/abc', resourceType: 'video', deliveryType: 'upload' }
// "authenticated" turidagi video URL'lar /video/authenticated/... ko'rinishida keladi.
function parseCloudinaryUrl(
  url: string
): { publicId: string; resourceType: 'image' | 'video'; deliveryType: 'upload' | 'authenticated' } | null {
  const match = /res\.cloudinary\.com\/[^/]+\/(image|video)\/(upload|authenticated)\/(?:s--[\w-]+--\/)?(?:v\d+\/)?(.+?)(?:\.\w+)?$/.exec(
    url
  );
  if (!match) return null;
  return {
    publicId: match[3],
    resourceType: match[1] as 'image' | 'video',
    deliveryType: match[2] as 'upload' | 'authenticated',
  };
}

/**
 * Dars videolarining saqlangan (doimiy) URL'larini vaqtinchalik, imzoli havolaga
 * aylantiradi — enrollment tekshiruvidan o'tgan foydalanuvchiga har safar YANGI
 * havola beriladi, shuning uchun oshkor bo'lgan eski havola muddat tugagach
 * ishlamay qoladi.
 *
 *   Cloudinary — "authenticated" asset uchun imzoli delivery URL (lokal hisoblash).
 *   Supabase   — yopiq bucketdagi fayllar uchun imzoli havola (HTTP so'rov).
 *   Lokal disk — HMAC token qo'shiladi.
 *   YouTube/Vimeo va boshqa tashqi havolalar o'zgarishsiz qaytadi.
 *
 * ATAYIN TO'PLAMLI (massiv qabul qiladi): Supabase imzolash tarmoq so'rovi talab
 * qiladi, kursda esa o'nlab dars bo'lishi mumkin — bittalab imzolansa sahifa
 * ochilishi shuncha marta sekinlashardi. Tartib saqlanadi: natija massivi
 * kirish massivi bilan bir xil indekslarda keladi.
 */
export async function signVideoUrls(urls: (string | null | undefined)[]): Promise<(string | null)[]> {
  const result: (string | null)[] = urls.map((url) => {
    if (!url) return null;

    const cloud = parseCloudinaryUrl(url);
    if (cloud) {
      return cloudinary.url(cloud.publicId, {
        resource_type: cloud.resourceType,
        type: 'authenticated',
        sign_url: true,
        secure: true,
        expires_at: Math.floor(Date.now() / 1000) + VIDEO_URL_TTL_SECONDS,
      });
    }

    if (url.includes('/uploads/videos/')) {
      return signLocalVideoUrl(url, VIDEO_URL_TTL_SECONDS);
    }

    return url;
  });

  // Supabase — bitta so'rovda hammasini imzolaymiz
  const pending = new Map<number, supabase.SupabaseObject>();
  urls.forEach((url, i) => {
    const object = url ? supabase.parseUrl(url) : null;
    if (object) pending.set(i, object);
  });

  if (pending.size > 0) {
    const signed = await supabase.signUrls([...pending.values()], VIDEO_URL_TTL_SECONDS);
    for (const [i, object] of pending) {
      // Imzolab bo'lmasa null — xom (ochilmaydigan) havolani mijozga bermaymiz
      result[i] = signed.get(`${object.bucket}/${object.path}`) ?? null;
    }
  }

  return result;
}

/** Bitta havola uchun qulaylik o'ramchisi — ko'p havola bo'lsa signVideoUrls() ishlatilsin. */
export async function signVideoUrl(url: string | null | undefined): Promise<string | null> {
  const [signed] = await signVideoUrls([url]);
  return signed;
}

// Cloudinary/Supabase'dagi (yoki boshqa ochiq manba) rasmni server orqali o'tkazadi —
// asl URL clientga hech qachon chiqmaydi, faqat bizning autentifikatsiyalangan
// endpoint ko'rinadi.
export async function fetchRemoteImage(url: string): Promise<{ buffer: Buffer; contentType: string }> {
  const res = await fetch(url);
  if (!res.ok) {
    throw new Error(`Rasmni olib bo'lmadi: ${res.status}`);
  }
  const buffer = Buffer.from(await res.arrayBuffer());
  return { buffer, contentType: res.headers.get('content-type') ?? 'image/jpeg' };
}

// Endi kerak bo'lmagan faylni (o'chirilgan dars videosi, almashtirilgan chek)
// xotiradan olib tashlaydi. Best-effort: xato asosiy oqimni yiqitmaydi.
export async function deleteUploadByUrl(url: string | null | undefined): Promise<void> {
  if (!url) return;
  try {
    const cloud = parseCloudinaryUrl(url);
    if (cloud) {
      if (cloudinaryEnabled) {
        await cloudinary.uploader.destroy(cloud.publicId, {
          resource_type: cloud.resourceType,
          type: cloud.deliveryType,
        });
      }
      return;
    }

    const object = supabase.parseUrl(url);
    if (object) {
      if (supabase.supabaseEnabled) {
        await supabase.remove(object);
      }
      return;
    }

    // Lokal /uploads fayli — faqat basename ishlatiladi (path traversal'ga qarshi)
    const local = /\/uploads\/(images|videos)\/([^/?#]+)/.exec(url);
    if (local) {
      const dir = local[1] === 'images' ? IMAGES_DIR : VIDEOS_DIR;
      await fs.unlink(path.join(dir, path.basename(local[2])));
    }
  } catch (err) {
    // Fayl allaqachon yo'q bo'lishi mumkin — jimgina o'tamiz, lekin log qoldiramiz
    if ((err as NodeJS.ErrnoException)?.code !== 'ENOENT') {
      console.error('Faylni o\'chirib bo\'lmadi:', url, err);
    }
  }
}
