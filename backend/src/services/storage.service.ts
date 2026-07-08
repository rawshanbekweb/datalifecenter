import fs from 'fs/promises';
import path from 'path';
import { v2 as cloudinary, UploadApiResponse } from 'cloudinary';
import { env } from '../config/env';
import { IMAGES_DIR, VIDEOS_DIR } from '../config/uploads';

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
//   → { publicId: 'datalife/videos/abc', resourceType: 'video' }
function parseCloudinaryUrl(url: string): { publicId: string; resourceType: 'image' | 'video' } | null {
  const match = /res\.cloudinary\.com\/[^/]+\/(image|video)\/upload\/(?:v\d+\/)?(.+?)(?:\.\w+)?$/.exec(url);
  if (!match) return null;
  return { publicId: match[2], resourceType: match[1] as 'image' | 'video' };
}

// Endi kerak bo'lmagan faylni (o'chirilgan dars videosi, almashtirilgan chek)
// xotiradan olib tashlaydi. Best-effort: xato asosiy oqimni yiqitmaydi.
export async function deleteUploadByUrl(url: string | null | undefined): Promise<void> {
  if (!url) return;
  try {
    const cloud = parseCloudinaryUrl(url);
    if (cloud) {
      if (cloudinaryEnabled) {
        await cloudinary.uploader.destroy(cloud.publicId, { resource_type: cloud.resourceType });
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
