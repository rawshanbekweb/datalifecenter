import { NotificationType } from '@prisma/client';
import { prisma } from '../config/prisma';
import { pushNotifyEvent } from './notificationStream';

export interface NotifyInput {
  type: NotificationType;
  title: string;
  body?: string | null;
  link?: string | null;
}

// Uzun matnlarni bildirishnoma tanasiga sig'diradi
export function excerpt(text: string, max = 160): string {
  return text.length > max ? `${text.slice(0, max - 1)}…` : text;
}

// Bildirishnoma yozilmasa ham asosiy oqim yiqilmasligi kerak — xatolar yutiladi
export async function notify(userIds: string | string[], input: NotifyInput): Promise<void> {
  const ids = (Array.isArray(userIds) ? userIds : [userIds]).filter(Boolean);
  if (!ids.length) return;
  try {
    await prisma.notification.createMany({
      data: ids.map((userId) => ({ userId, ...input })),
    });
    // Ochiq SSE ulanishlarga xabar — mijoz ro'yxatni qayta yuklaydi
    pushNotifyEvent(ids);
  } catch (err) {
    console.error('Bildirishnoma yozilmadi:', err);
  }
}

/**
 * Bir xil havolaga o'qilmagan bildirishnoma bo'lsa YANGISINI yaratmaydi —
 * mavjudini yangilaydi (matn va vaqt).
 *
 * Yozishma uchun: har bir xabar alohida bildirishnoma yozsa, 20 xabarlik
 * suhbat qo'ng'iroqdagi 30 ta yozuvning hammasini bitta odam bilan to'ldirib
 * qo'yardi va qolgan barcha bildirishnomalar ko'rinmay ketardi. Endi bitta
 * suhbat — bitta o'qilmagan yozuv, oxirgi xabar matni bilan.
 *
 * SSE hodisasi HAR DOIM yuboriladi: yangi yozuv yozilmagan bo'lsa ham ochiq
 * yozishma oynasi va o'qilmaganlar hisobi yangilanishi kerak.
 */
export async function notifyMerged(userIds: string | string[], input: NotifyInput): Promise<void> {
  const ids = (Array.isArray(userIds) ? userIds : [userIds]).filter(Boolean);
  if (!ids.length) return;
  try {
    const existing = await prisma.notification.findMany({
      where: { userId: { in: ids }, type: input.type, link: input.link, readAt: null },
      select: { id: true, userId: true },
    });
    const merged = new Set(existing.map((n) => n.userId));
    const fresh = ids.filter((id) => !merged.has(id));

    await prisma.$transaction([
      ...(existing.length
        ? [prisma.notification.updateMany({
          where: { id: { in: existing.map((n) => n.id) } },
          // createdAt yangilanadi — yozuv ro'yxatning tepasiga qaytadi
          data: { title: input.title, body: input.body ?? null, createdAt: new Date() },
        })]
        : []),
      ...(fresh.length
        ? [prisma.notification.createMany({ data: fresh.map((userId) => ({ userId, ...input })) })]
        : []),
    ]);
    pushNotifyEvent(ids);
  } catch (err) {
    console.error('Bildirishnoma yozilmadi:', err);
  }
}

export async function notifyAdmins(input: NotifyInput): Promise<void> {
  try {
    const admins = await prisma.user.findMany({
      where: { role: 'ADMIN', isBlocked: false },
      select: { id: true },
    });
    await notify(admins.map((a) => a.id), input);
  } catch (err) {
    console.error('Adminlarga bildirishnoma yozilmadi:', err);
  }
}

export async function listMine(userId: string) {
  const [items, unreadCount] = await Promise.all([
    prisma.notification.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      take: 30,
    }),
    prisma.notification.count({ where: { userId, readAt: null } }),
  ]);
  return { items, unreadCount };
}

export async function markRead(userId: string, id: string) {
  await prisma.notification.updateMany({
    where: { id, userId, readAt: null },
    data: { readAt: new Date() },
  });
}

export async function markAllRead(userId: string) {
  await prisma.notification.updateMany({
    where: { userId, readAt: null },
    data: { readAt: new Date() },
  });
}
