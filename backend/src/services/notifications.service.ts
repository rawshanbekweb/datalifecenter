import { NotificationType } from '@prisma/client';
import { prisma } from '../config/prisma';

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
