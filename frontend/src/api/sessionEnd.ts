/**
 * Server seansni yopganda ("boshqa qurilmadan chiqarildi" yoki "uzoq
 * harakatsizlik") foydalanuvchiga SABABINI aytish uchun kichik ko'prik.
 *
 * NEGA KERAK: sababsiz chiqarish foydalanuvchiga nosozlikdek ko'rinadi —
 * "hozirgina kirgan edim, nega yana login sahifasi?" degan savol qoladi.
 *
 * NEGA sessionStorage: sabab `apiFetch` ichida (React'dan tashqarida) tug'iladi,
 * o'qiydigan joy esa qayta render bo'lgandan keyingi LoginPage. Oddiy modul
 * o'zgaruvchisi ham yetardi, lekin sahifa to'liq yangilansa yo'qolardi.
 */

export type SessionEndReason = 'idle' | 'revoked';

const KEY = 'datalife_session_end';

/** Seans yopilganini bildiradi — AuthProvider shu hodisani tinglaydi. */
export const SESSION_END_EVENT = 'datalife:session-ended';

export function markSessionEnded(code: string | undefined): void {
  const reason: SessionEndReason = code === 'SESSION_IDLE' ? 'idle' : 'revoked';
  try {
    sessionStorage.setItem(KEY, reason);
  } catch {
    // sessionStorage o'chiq — sababsiz bo'lsa ham chiqarish davom etadi
  }
  window.dispatchEvent(new CustomEvent(SESSION_END_EVENT));
}

/**
 * Sababni o'qiydi. O'CHIRMAYDI — o'chirish alohida `clearSessionEndReason`da.
 *
 * NEGA ajratilgan: o'qish joyi — komponentning `useState` boshlang'ich qiymati,
 * StrictMode esa uni ataylab IKKI MARTA chaqiradi. O'qish bilan birga o'chirsak,
 * ikkinchi chaqiruv bo'sh qaytarib xabarni yo'q qilardi.
 */
export function readSessionEndReason(): SessionEndReason | null {
  try {
    const value = sessionStorage.getItem(KEY);
    return value === 'idle' || value === 'revoked' ? value : null;
  } catch {
    return null;
  }
}

/** Xabar ko'rsatilgach chaqiriladi — u faqat bir marta chiqsin. */
export function clearSessionEndReason(): void {
  try {
    sessionStorage.removeItem(KEY);
  } catch {
    // e'tiborsiz
  }
}
