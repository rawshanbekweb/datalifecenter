import { Prisma } from '@prisma/client';
import { DEFAULT_LOCALE, SupportedLocale } from '../config/locale';

// {uz: string, ru?: string, kaa?: string, en?: string} — barcha tarjima
// qilinadigan matn maydonlari shu shaklda saqlanadi (Course.title, BlogPost.content va h.k.)
export type LocalizedString = { uz: string } & Partial<Record<Exclude<SupportedLocale, 'uz'>, string>>;

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value) && value.constructor === Object;
}

function isLocalizedField(value: unknown): value is LocalizedString {
  return isPlainObject(value) && typeof value.uz === 'string';
}

// Tanlangan til bo'sh/mavjud bo'lmasa o'zbekchaga tushadi — shu sababli yangi til
// hali tarjima qilinmagan qatorlarda ham sayt hech qachon bo'sh ko'rinmaydi.
export function pickLocale(field: LocalizedString | null | undefined, locale: SupportedLocale): string | null {
  if (!field) return null;
  if (locale === DEFAULT_LOCALE) return field.uz;
  const value = field[locale];
  return typeof value === 'string' && value.trim() !== '' ? value : field.uz;
}

// Prisma nullable Json ustunlarga JS `null` emas, `Prisma.JsonNull` sentinel'i
// yozilishi shart (DB NULL bilan JSON "null" qiymatini farqlash uchun) — nullable
// LocalizedString maydonlarini create/update `data`ga uzatishdan oldin shu orqali o'tkaziladi.
export function toJsonInput(
  value: LocalizedString | null | undefined
): Prisma.InputJsonValue | typeof Prisma.JsonNull | undefined {
  if (value === undefined) return undefined;
  if (value === null) return Prisma.JsonNull;
  return value;
}

// Email/bildirishnoma/sertifikat kabi hozircha faqat o'zbekcha bo'lgan matnlar
// uchun — LocalizedString (yoki xom Prisma JsonValue)'dan har doim `uz` qiymatini
// oladi. Bular ataylab boshqa tilga tarjima qilinmaydi (roadmap'da alohida ish).
export function toUzText(field: unknown): string {
  if (!isPlainObject(field)) return '';
  const value = field.uz;
  return typeof value === 'string' ? value : '';
}

// Prisma'dan kelgan obyekt/massivni rekursiv aylanib, {uz,ru,kaa,en} shaklidagi
// har bir tugunni bitta satrga "tekislaydi". Decimal/Date kabi klass instansiyalari
// (constructor !== Object) ichiga kirmaydi — shuning uchun price/vaqt maydonlari
// buzilmaydi.
export function resolveLocaleDeep<T>(value: T, locale: SupportedLocale): T {
  if (Array.isArray(value)) {
    return value.map((item) => resolveLocaleDeep(item, locale)) as unknown as T;
  }
  if (!isPlainObject(value)) {
    return value;
  }
  if (isLocalizedField(value)) {
    return pickLocale(value, locale) as unknown as T;
  }
  const result: Record<string, unknown> = {};
  for (const [key, val] of Object.entries(value)) {
    result[key] = resolveLocaleDeep(val, locale);
  }
  return result as T;
}
