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
 * Kadr pastiga "tayangan" rasm uchun `object-position`.
 *
 * `object-fit: contain` bilan ishlatiladi: vertikal joylashuv doim past
 * (odam kadr tagida turadi), gorizontalni esa fokus nuqtasi belgilaydi —
 * kesib olingan portret kadr o'rtasida bo'lmasa admin uni surib qo'ya oladi.
 * `focusY` bu holatda ATAYIN e'tiborga olinmaydi: `contain` hech narsani
 * kesmaydi, ya'ni vertikal siljitishning ma'nosi yo'q.
 */
export function focusPositionBottom(source: ImageFocus | null | undefined): string {
  return `${clampFocus(source?.focusX ?? DEFAULT_FOCUS)}% 100%`;
}
