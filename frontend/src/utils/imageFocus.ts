/**
 * Rasmning fokus nuqtasi — doira yoki kvadrat kadrga kesilganda markazda
 * qoladigan joy (foizda).
 *
 * NEGA KERAK: `object-fit: cover` rasmni kadr o'lchamiga to'ldiradi va ortiqcha
 * qismini kesadi. Sukut bo'yicha o'rtadan kesadi (`50% 50%`), portret suratda
 * esa yuz yuqori qismda bo'ladi — natijada boshning yarmi kadrdan chiqib
 * ketadi. Fokus nuqtasi har bir rasm uchun alohida saqlanadi (baza ustunlari),
 * admin uni panelda rasm ustiga bosib belgilaydi.
 */
export interface ImageFocus {
  focusX?: number | null;
  focusY?: number | null;
}

export const DEFAULT_FOCUS = 50;

/** 0..100 oralig'iga qisadi — buzuq qiymat rasmni kadrdan surib yubormasin */
export function clampFocus(value: number): number {
  if (!Number.isFinite(value)) return DEFAULT_FOCUS;
  return Math.min(100, Math.max(0, Math.round(value)));
}

/**
 * CSS `object-position` qiymatini beradi.
 *
 * Fokus berilmagan (eski yozuvlar, tashqi manba) holatda markaz qaytadi —
 * ya'ni xatti-harakat avvalgidek qoladi.
 */
export function focusPosition(source: ImageFocus | null | undefined): string {
  const x = clampFocus(source?.focusX ?? DEFAULT_FOCUS);
  const y = clampFocus(source?.focusY ?? DEFAULT_FOCUS);
  return `${x}% ${y}%`;
}

/**
 * Kadr pastiga "tayangan" rasmning tayanch nuqtasi: gorizontal markaz,
 * vertikal past. Siljitish bu yerda EMAS — uni `focusPan()` beradi.
 *
 * NEGA: `object-fit: scale-down|contain` rasmni kadrga sig'diradi, ya'ni
 * ko'p holatda ortiqcha joy QOLMAYDI va `object-position` hech narsani
 * surmaydi (kvadrat va keng rasmlarda umuman, portretda bir necha piksel).
 * Shuning uchun fokus nuqtasi `object-position` orqali emas, `transform`
 * orqali qo'llanadi.
 */
export const FOCUS_BASE_POSITION = '50% 100%';

/**
 * Fokus nuqtasini kadr ichida siljitish uchun CSS `transform` qiymati.
 *
 * `object-position` dan farqi: bo'sh joy bor-yo'qligiga bog'liq emas —
 * rasm har doim suriladi. Shu sabab kesilmaydigan (`scale-down`) rasmni
 * ham chapga/o'ngga va tepaga/pastga surish mumkin bo'ladi.
 *
 * Fokus 50/50 (sukut) → siljish YO'Q, ya'ni eski yozuvlar va yangi
 * rasmlar avvalgidek ko'rinadi. Chegara ataylab ±MAX_PAN foiz: undan
 * ortig'i odamni kadrdan chiqarib yuborardi.
 */
const MAX_PAN = 15;

export function focusPan(source: ImageFocus | null | undefined): string {
  const dx = ((DEFAULT_FOCUS - clampFocus(source?.focusX ?? DEFAULT_FOCUS)) / 50) * MAX_PAN;
  const dy = ((DEFAULT_FOCUS - clampFocus(source?.focusY ?? DEFAULT_FOCUS)) / 50) * MAX_PAN;
  return `translate(${dx.toFixed(2)}%, ${dy.toFixed(2)}%)`;
}
