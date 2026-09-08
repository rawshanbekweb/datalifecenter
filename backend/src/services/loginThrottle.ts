import { ApiError } from '../utils/ApiError';

/**
 * HISOB bo'yicha muvaffaqiyatsiz kirish urinishlarini cheklash.
 *
 * NEGA KERAK: auth.routes.ts dagi `authLimiter` chegarani IP bo'yicha
 * hisoblaydi. Botnet yoki proksi ro'yxatidan foydalanadigan hujumchi har
 * urinishni boshqa IP'dan yuboradi va u chegara umuman ishlamaydi — bitta
 * admin emailiga qarshi cheksiz parol tanlash mumkin bo'lib qoladi. Bu yerdagi
 * hisoblagich esa kalit sifatida EMAIL'ni oladi, ya'ni urinish qayerdan
 * kelishidan qat'i nazar sanaladi.
 *
 * MUVOZANAT: emailni bilgan begona odam ataylab xato parol yuborib haqiqiy
 * egasini vaqtincha kirita olmay qo'yishi mumkin. Shuning uchun qulf QISQA
 * (15 daqiqa) va chegara yuqori (10 urinish): haqiqiy foydalanuvchi bunchalik
 * xato qilmaydi, hujumchi uchun esa parol tanlash amalda imkonsiz sekinlashadi.
 * Hisob butunlay yopilmaydi — parolni tiklash oqimi ishlab turaveradi.
 *
 * Xotirada saqlanadi (express-rate-limit ham shunday ishlaydi). Render'da
 * bitta instans bor; qayta deploy'da hisoblagich nolga tushadi — bu hujumchiga
 * beriladigan imtiyoz emas, chunki deploy'ni u boshqarmaydi.
 */

const MAX_FAILURES = 10;
const WINDOW_MS = 15 * 60 * 1000;
const LOCK_MS = 15 * 60 * 1000;

// Hujumchi har safar YANGI email yuborib xotirani shishirmasligi uchun yozuvlar
// soni cheklangan: to'lganda eng eski yozuv chiqarib tashlanadi. Map JS'da
// qo'shilish tartibini saqlaydi, shuning uchun birinchi kalit eng eskisi.
const MAX_ENTRIES = 10_000;

interface Attempt {
  failures: number;
  // Oyna boshlangan payt — undan keyin hisoblagich noldan boshlanadi
  windowStart: number;
  lockedUntil?: number;
}

const attempts = new Map<string, Attempt>();

const keyOf = (email: string) => email.trim().toLowerCase();

/**
 * Kirishga urinishdan OLDIN chaqiriladi. Hisob qulflangan bo'lsa xato otadi.
 * Xato matni "email yoki parol" xatosidan farq qiladi, lekin hisob BOR-yo'qligini
 * oshkor qilmaydi: mavjud bo'lmagan email ham xuddi shunday qulflanadi.
 */
export function assertNotLocked(email: string): void {
  const entry = attempts.get(keyOf(email));
  if (!entry?.lockedUntil) return;

  if (entry.lockedUntil > Date.now()) {
    throw ApiError.tooManyRequests(
      "Juda ko'p muvaffaqiyatsiz urinish. 15 daqiqadan keyin qayta urinib ko'ring.",
      'ACCOUNT_LOCKED'
    );
  }
  // Qulf muddati tugagan — yozuv tozalanadi
  attempts.delete(keyOf(email));
}

/** Parol xato bo'lganda chaqiriladi. */
export function recordFailure(email: string): void {
  const key = keyOf(email);
  const now = Date.now();
  const entry = attempts.get(key);

  if (!entry || now - entry.windowStart > WINDOW_MS) {
    if (attempts.size >= MAX_ENTRIES) {
      const oldest = attempts.keys().next().value;
      if (oldest !== undefined) attempts.delete(oldest);
    }
    attempts.set(key, { failures: 1, windowStart: now });
    return;
  }

  entry.failures += 1;
  if (entry.failures >= MAX_FAILURES) {
    entry.lockedUntil = now + LOCK_MS;
  }
}

/** Muvaffaqiyatli kirishda hisoblagich tozalanadi. */
export function clearFailures(email: string): void {
  attempts.delete(keyOf(email));
}

// Testlar orasida holat oqib ketmasligi uchun
export function __resetLoginThrottle(): void {
  attempts.clear();
}
