/**
 * Rasmni serverga yuborishdan OLDIN brauzerda kichraytirish.
 *
 * NEGA KERAK: telefon yoki fotoapparatdan kelgan surat odatda 3000+ px va
 * bir necha megabayt bo'ladi, saytda esa u 40–130 px doiraga yoki karta
 * ichiga kesib ko'rsatiladi. Ya'ni har bir tashrifchi ekranda 72 px joy
 * egallaydigan rasm uchun 7 MB fayl yuklab oladi. Kichraytirish uchta
 * muammoni birdan yechadi: sahifa tez ochiladi, yuklashning o'zi tez tugaydi
 * va hajm chegarasiga deyarli hech qachon urilmaydi.
 *
 * Server tomonida siqish (sharp) ATAYIN tanlanmadi: u native paket va
 * platformaga bog'liq optional bog'liqliklari lockfile orqali CI'ni sindirishi
 * mumkin. Canvas esa hech qanday bog'liqliksiz, brauzerning o'zida ishlaydi.
 */

/** Eng uzun tomon uchun chegara — 4K ekranda ham yetarli, katta kartalar uchun ham */
const MAX_DIMENSION = 2000;

/** Qayta kodlash sifati (0..1). 0.85 — ko'z ilg'amaydigan yo'qotish, hajm esa bir necha barobar kichik */
const QUALITY = 0.85;

/**
 * Shu hajmdan kichik va o'lchami chegaradan oshmagan rasmlarga TEGILMAYDI.
 * Sabab: kichik rasmni qayta kodlash foyda bermaydi, faqat sifat yo'qotadi
 * (masalan allaqachon siqilgan logotip yoki avatar).
 */
const REENCODE_ABOVE_BYTES = 1024 * 1024;

/**
 * GIF o'tkazib yuboriladi: canvas faqat birinchi kadrni oladi, ya'ni
 * animatsiya jimgina yo'qolib ketardi.
 */
const SKIP_TYPES = new Set(['image/gif']);

interface Decoded {
  width: number;
  height: number;
  draw: (ctx: CanvasRenderingContext2D, w: number, h: number) => void;
  close: () => void;
}

async function decode(file: File): Promise<Decoded | null> {
  // createImageBitmap — tezroq va asosiy oqimni bloklamaydi.
  // `imageOrientation: 'from-image'` — telefon suratlaridagi EXIF burilishi
  // hisobga olinsin, aks holda kichraytirilgan rasm yonboshlab qolardi.
  if (typeof createImageBitmap === 'function') {
    try {
      const bitmap = await createImageBitmap(file, { imageOrientation: 'from-image' });
      return {
        width: bitmap.width,
        height: bitmap.height,
        draw: (ctx, w, h) => ctx.drawImage(bitmap, 0, 0, w, h),
        close: () => bitmap.close(),
      };
    } catch {
      /* quyidagi zaxira yo'l bilan urinamiz */
    }
  }

  // Zaxira yo'l — eski brauzerlar uchun
  const url = URL.createObjectURL(file);
  try {
    const img = await new Promise<HTMLImageElement>((resolve, reject) => {
      const el = new Image();
      el.onload = () => resolve(el);
      el.onerror = () => reject(new Error('decode failed'));
      el.src = url;
    });
    return {
      width: img.naturalWidth,
      height: img.naturalHeight,
      draw: (ctx, w, h) => ctx.drawImage(img, 0, 0, w, h),
      close: () => URL.revokeObjectURL(url),
    };
  } catch {
    URL.revokeObjectURL(url);
    return null;
  }
}

function toBlob(canvas: HTMLCanvasElement, type: string): Promise<Blob | null> {
  return new Promise((resolve) => canvas.toBlob(resolve, type, QUALITY));
}

function renamed(name: string, type: string): string {
  const base = name.replace(/\.[^.]+$/, '') || 'image';
  return `${base}.${type === 'image/webp' ? 'webp' : 'jpg'}`;
}

/**
 * Kerak bo'lsa kichraytirilgan yangi fayl, aks holda ASL faylning o'zi qaytadi.
 *
 * Hech qachon xato tashlamaydi: kichraytirib bo'lmasa (brauzer qo'llamadi,
 * fayl buzuq) asl fayl qaytadi va yuklash avvalgidek davom etadi.
 */
export async function downscaleImage(file: File): Promise<File> {
  if (!file.type.startsWith('image/') || SKIP_TYPES.has(file.type)) return file;

  const decoded = await decode(file);
  if (!decoded) return file;

  try {
    const { width, height } = decoded;
    if (!width || !height) return file;

    const scale = Math.min(1, MAX_DIMENSION / Math.max(width, height));
    // O'lchami ham, hajmi ham me'yorida — tegmaymiz
    if (scale === 1 && file.size <= REENCODE_ABOVE_BYTES) return file;

    const targetW = Math.max(1, Math.round(width * scale));
    const targetH = Math.max(1, Math.round(height * scale));

    const canvas = document.createElement('canvas');
    canvas.width = targetW;
    canvas.height = targetH;
    const ctx = canvas.getContext('2d');
    if (!ctx) return file;
    ctx.imageSmoothingQuality = 'high';
    decoded.draw(ctx, targetW, targetH);

    // WebP birinchi navbatda: JPEG'dan kichikroq va PNG'dagi shaffoflikni
    // saqlaydi (JPEG'ga o'tkazilsa shaffof joylar qora bo'lib qolardi).
    const blob = (await toBlob(canvas, 'image/webp')) ?? (await toBlob(canvas, 'image/jpeg'));
    if (!blob) return file;

    // Qayta kodlash foyda bermadi (masalan allaqachon yaxshi siqilgan rasm) —
    // aslini yuboramiz, sifatni bekorga yo'qotmaymiz
    if (blob.size >= file.size) return file;

    return new File([blob], renamed(file.name, blob.type), {
      type: blob.type,
      lastModified: Date.now(),
    });
  } catch {
    return file;
  } finally {
    decoded.close();
  }
}
