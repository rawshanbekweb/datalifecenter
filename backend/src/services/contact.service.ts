import { MessageStatus } from '@prisma/client';
import { prisma } from '../config/prisma';
import { ApiError } from '../utils/ApiError';

interface ContactInput {
  name: string;
  email: string;
  phone?: string;
  subject?: string;
  message: string;
}

export async function createContactMessage(input: ContactInput) {
  return prisma.contactMessage.create({ data: input });
}

interface ListMessagesFilters {
  status?: MessageStatus;
  page: number;
  limit: number;
}

// Ochiq formadan kelgani uchun xabarlar cheksiz o'sadi — pagination majburiy
export async function listContactMessages(filters: ListMessagesFilters) {
  const where = filters.status ? { status: filters.status } : {};
  const [items, total] = await Promise.all([
    prisma.contactMessage.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      skip: (filters.page - 1) * filters.limit,
      take: filters.limit,
    }),
    prisma.contactMessage.count({ where }),
  ]);
  return {
    items,
    pagination: { page: filters.page, limit: filters.limit, total, totalPages: Math.ceil(total / filters.limit) },
  };
}

export async function updateContactMessageStatus(id: string, status: MessageStatus) {
  const message = await prisma.contactMessage.findUnique({ where: { id } });
  if (!message) {
    throw ApiError.notFound('Xabar topilmadi');
  }
  return prisma.contactMessage.update({ where: { id }, data: { status } });
}

export async function deleteContactMessage(id: string): Promise<void> {
  const message = await prisma.contactMessage.findUnique({ where: { id } });
  if (!message) {
    throw ApiError.notFound('Xabar topilmadi');
  }
  await prisma.contactMessage.delete({ where: { id } });
}

/**
 * Bir nechta xabarni birdan o'chirish — spam to'lqinini bittalab tozalash
 * amalda imkonsiz bo'lgani uchun.
 *
 * ATAYIN faqat aniq ID'lar bo'yicha ishlaydi: "shu statusdagi hammasini
 * o'chir" degan variant qulayroq ko'rinadi, lekin bitta noto'g'ri bosishda
 * haqiqiy murojaatlarni ham olib ketardi va uni qaytarib bo'lmasdi.
 *
 * Qaytadi: haqiqatda o'chirilgan yozuvlar soni. U so'ralganidan kam
 * bo'lishi mumkin (boshqa admin allaqachon o'chirgan bo'lsa) — chaqiruvchi
 * shuni foydalanuvchiga ko'rsatadi.
 */
export async function deleteContactMessages(ids: string[]): Promise<number> {
  const { count } = await prisma.contactMessage.deleteMany({ where: { id: { in: ids } } });
  return count;
}
