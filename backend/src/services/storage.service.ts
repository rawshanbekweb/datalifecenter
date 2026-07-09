import fs from 'fs/promises';
import path from 'path';
import { v2 as cloudinary, UploadApiResponse } from 'cloudinary';
import { env } from '../config/env';
import { IMAGES_DIR, VIDEOS_DIR } from '../config/uploads';
import { signLocalVideoUrl } from '../utils/videoAccess';

const VIDEO_URL_TTL_SECONDS = 6 * 3600;

// Render/Railway kabi ephemeral hostingda lokal disk deploy'da tozalanadi —
// CLOUDINARY_* sozlansa fayllar bulutga ko'chadi va URL'lar doimiy bo'ladi.
// Sozlanmasa avvalgidek lokal diskda qoladi (development uchun qulay).
export const cloudinaryEnabled = Boolean(
  env.CLOUDINARY_CLOUD_NAME && env.CLOUDINARY_API_KEY && env.CLOUDINARY_API_SECRET
);

if (cloudinaryEnabled) {
  cloudinary.config({
    cloud_name: env.CLOUDINARY_CLOUD_NAME,
    api_key: env.CLOUDINARY_API_KEY,
    api_secret: env.CLOUDINARY_API_SECRET,
    secure: true,
  });
}

// Lokal faylni Cloudinary'ga yuklab, doimiy URL qaytaradi.
// Video uchun upload_large — 100 MB dan katta fayllar bo'laklab yuboriladi.
export async function uploadToCloudinary(
  filePath: string,
  kind: 'images' | 'videos'
): Promise<{ url: string; bytes: number }> {
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

  return { url: result.secure_url, bytes: result.bytes };
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

// Dars videosining saqlangan (doimiy) URL'ini vaqtinchalik, imzoli havolaga aylantiradi —
// enrollment tekshiruvidan o'tgan foydalanuvchiga har safar YANGI havola beriladi, shuning
// uchun oshkor bo'lgan eski havola muddat (TTL) tugagach ishlamay qoladi.
// Cloudinary — "authenticated" turidagi asset uchun imzoli delivery URL generatsiya qilinadi
// (tarmoq so'rovisiz, faqat lokal hisoblash). Lokal disk — HMAC token qo'shiladi.
// YouTube/Vimeo va boshqa tashqi havolalar o'zgarishsiz qaytadi (biz tomondan himoya mumkin emas).
export function signVideoUrl(url: string | null | undefined): string | null {
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
}

// Cloudinary'dagi (yoki boshqa ochiq manba) rasmni server orqali o'tkazadi — asl URL
// clientga hech qachon chiqmaydi, faqat bizning autentifikatsiyalangan endpoint ko'rinadi.
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
