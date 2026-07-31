/**
 * Anonim qurilma identifikatori — yoqtirish va ko'rishlar hisobida
 * "bu qurilma allaqachon qildimi?" savoliga javob berish uchun.
 *
 * NEGA COOKIE EMAS: frontend va backend turli domenlarda (datalife.uz /
 * vercel.app ↔ onrender.com) va Safari krossdomen cookie'ni bloklaydi.
 * Loyihada autentifikatsiya ham aynan shu sabab localStorage + header
 * yo'liga o'tkazilgan — bu ham xuddi shunday ishlaydi.
 *
 * Identifikator brauzerda generatsiya qilinadi va hech qanday shaxsiy
 * ma'lumot saqlamaydi: bu shunchaki tasodifiy satr.
 */

const STORAGE_KEY = 'datalife_device_id';

// Backend shu shaklni kutadi (middleware/deviceId.ts): 8-64 ta belgi
const FALLBACK_ALPHABET = 'abcdefghijklmnopqrstuvwxyz0123456789';

function randomId(): string {
  // randomUUID ishonchli va hamma zamonaviy brauzerda bor, lekin u faqat
  // xavfsiz kontekstda (https/localhost) mavjud — aks holda zaxira yo'l
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }
  let out = '';
  for (let i = 0; i < 32; i += 1) {
    out += FALLBACK_ALPHABET[Math.floor(Math.random() * FALLBACK_ALPHABET.length)];
  }
  return out;
}

let cached: string | null = null;

/**
 * Joriy qurilma identifikatorini qaytaradi, kerak bo'lsa yaratadi.
 * localStorage ishlamasa (private rejim, o'chirilgan xotira) sessiya
 * davomida amal qiladigan vaqtinchalik identifikator qaytadi.
 */
export function getDeviceId(): string {
  if (cached) return cached;

  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      cached = stored;
      return stored;
    }
    const created = randomId();
    localStorage.setItem(STORAGE_KEY, created);
    cached = created;
    return created;
  } catch {
    // localStorage yopiq — hech bo'lmasa shu sahifa ochiq turgan vaqtda
    // takroriy hisoblanmasligi uchun xotirada saqlaymiz
    cached = randomId();
    return cached;
  }
}
