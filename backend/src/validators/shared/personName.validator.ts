import { z } from 'zod';

/**
 * Odam ismi uchun umumiy qoida — ro'yxatdan o'tish ham, profil tahriri ham
 * shu yerdan o'tadi.
 *
 * NEGA KERAK: ilgari ism uchun faqat `min(2)` tekshirilardi. Shu ochiqlikdan
 * foydalanib register formasiga `admin' OR '1'='1` ko'rinishidagi skaner
 * payloadlari va 100 xonali raqamli "ism"lar bilan hisoblar ochilgan. SQL
 * tomonida xavf yo'q (Prisma har qanday qiymatni parametr sifatida yuboradi,
 * React esa matnni ekranlaydi), ammo bunday yozuvlar admin ro'yxatini,
 * xatlardagi murojaatni va analitikani buzadi.
 *
 * RUXSAT: harflar (lotin ham, kirill ham — `\p{L}`), diakritik belgilar
 * (`\p{M}`), bo'sh joy, apostrof (o'zbekcha `oʻ`/`gʻ` uchun ham), chiziqcha va
 * nuqta ("A. Karimov"). Raqam va boshqa tinish belgilari YO'Q — shuning uchun
 * sof raqamli ism ham, SQL/HTML payloadlari ham o'tmaydi.
 */
const PERSON_NAME_RE = /^\p{L}[\p{L}\p{M}\s'’ʻʼ.-]*$/u;

export const PERSON_NAME_MAX = 60;

export const personName = z
  .string()
  // Ketma-ket bo'sh joylar bittaga tushadi: "Ali   Valiyev" → "Ali Valiyev"
  .transform((v) => v.trim().replace(/\s+/g, ' '))
  .refine((v) => v.length >= 2, "Ism kamida 2 ta belgidan iborat bo'lishi kerak")
  .refine((v) => v.length <= PERSON_NAME_MAX, `Ism ${PERSON_NAME_MAX} belgidan oshmasligi kerak`)
  .refine(
    (v) => PERSON_NAME_RE.test(v),
    "Ism faqat harflardan iborat bo'lishi kerak (bo'sh joy, apostrof va chiziqcha mumkin)"
  );
