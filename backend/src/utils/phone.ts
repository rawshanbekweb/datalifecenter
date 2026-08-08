/**
 * Telefon raqamini solishtirish mumkin bo'lgan bitta ko'rinishga keltiradi:
 * raqamlardan boshqa hamma belgi tushadi, oldiga `+` qo'yiladi.
 *
 * NEGA KERAK: bitta raqam bilan ochilgan hisoblar sonini cheklash uchun ular
 * bir xil satr bo'lib saqlanishi shart. Aks holda "+998 88 356-21-02",
 * "(88) 3562102" va "998883562102" — baza uchun uch xil raqam bo'lib,
 * cheklovni chetlab o'tish uchun bo'sh joy qo'shish yetardi.
 *
 * O'zbek raqamlari ko'pincha kod tashlab yoziladi ("883562102"), shuning uchun
 * 9 xonali qiymat +998 bilan to'ldiriladi. Boshqa uzunliklarga tegilmaydi —
 * chet el raqamini "tuzatish" xato natija berardi.
 */
export function normalizePhone(raw: string): string {
  const digits = raw.replace(/\D/g, '');
  if (!digits) return '';
  if (digits.length === 9) return `+998${digits}`;
  return `+${digits}`;
}

/** Normalizatsiyadan keyingi ko'rinish: `+` va 9..15 raqam */
export const NORMALIZED_PHONE_RE = /^\+\d{9,15}$/;
