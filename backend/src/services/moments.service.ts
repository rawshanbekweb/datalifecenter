import { prisma } from '../config/prisma';
import { SupportedLocale } from '../config/locale';
import { ApiError } from '../utils/ApiError';
import { LocalizedString, resolveLocaleDeep, toJsonInput } from '../utils/localizedField';

// "DATA LIFE'da bir kun" — bosh sahifadagi story ko'rinishidagi galereya.
// Tartib: `order` o'sish bo'yicha, keyin eng yangi voqea oldinda.
const ORDER = [{ order: 'asc' as const }, { happenedAt: 'desc' as const }, { createdAt: 'desc' as const }];

export async function listMoments(locale: SupportedLocale) {
  const moments = await prisma.moment.findMany({ where: { published: true }, orderBy: ORDER });
  return resolveLocaleDeep(moments, locale);
}

// Admin tahrirlash paneli uchun — xom {uz,ru,kaa,en} obyektini qaytaradi
export async function listMomentsAdmin() {
  return prisma.moment.findMany({ orderBy: ORDER });
}

interface MomentInput {
  imageUrl: string;
  // Berilmasa bazadagi default (50 = markaz) qoladi
  focusX?: number;
  focusY?: number;
  title: LocalizedString;
  caption?: LocalizedString | null;
  happenedAt?: Date | null;
  order: number;
  published: boolean;
}

// `caption` nullable Json — JS `null` emas, Prisma.JsonNull sentinel'i kerak
export async function createMoment(input: MomentInput) {
  return prisma.moment.create({ data: { ...input, caption: toJsonInput(input.caption) } });
}

export async function updateMoment(id: string, input: Partial<MomentInput>) {
  const moment = await prisma.moment.findUnique({ where: { id } });
  if (!moment) {
    throw ApiError.notFound('Voqea topilmadi');
  }
  return prisma.moment.update({ where: { id }, data: { ...input, caption: toJsonInput(input.caption) } });
}

export async function deleteMoment(id: string) {
  const moment = await prisma.moment.findUnique({ where: { id } });
  if (!moment) {
    throw ApiError.notFound('Voqea topilmadi');
  }
  await prisma.moment.delete({ where: { id } });
}
