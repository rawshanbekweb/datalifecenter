import crypto from 'crypto';
import { Prisma } from '@prisma/client';
import { prisma } from '../config/prisma';
import { ApiError } from '../utils/ApiError';
import { hashPassword } from '../utils/password';

const userSelect = {
  id: true,
  email: true,
  name: true,
  phone: true,
  role: true,
  isBlocked: true,
  avatarUrl: true,
  createdAt: true,
  _count: { select: { enrollments: true } },
} satisfies Prisma.UserSelect;

interface ListUsersFilters {
  role?: 'STUDENT' | 'MENTOR' | 'ADMIN';
  search?: string;
  page: number;
  limit: number;
}

export async function listUsers(filters: ListUsersFilters) {
  const where: Prisma.UserWhereInput = {
    ...(filters.role ? { role: filters.role } : {}),
    ...(filters.search
      ? {
          OR: [
            { name: { contains: filters.search, mode: 'insensitive' } },
            { email: { contains: filters.search, mode: 'insensitive' } },
          ],
        }
      : {}),
  };

  const [items, total] = await Promise.all([
    prisma.user.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      skip: (filters.page - 1) * filters.limit,
      take: filters.limit,
      select: userSelect,
    }),
    prisma.user.count({ where }),
  ]);

  return {
    items,
    pagination: { page: filters.page, limit: filters.limit, total, totalPages: Math.ceil(total / filters.limit) },
  };
}

export async function updateUserRole(id: string, role: 'STUDENT' | 'MENTOR' | 'ADMIN', actingUserId: string) {
  const user = await prisma.user.findUnique({ where: { id } });
  if (!user) {
    throw ApiError.notFound('Foydalanuvchi topilmadi');
  }
  if (id === actingUserId && role !== 'ADMIN') {
    throw ApiError.conflict("O'zingizning admin huquqingizni olib tashlay olmaysiz", 'CANNOT_DEMOTE_SELF');
  }

  return prisma.$transaction(async (tx) => {
    const updated = await tx.user.update({ where: { id }, data: { role }, select: userSelect });

    // MENTOR roli ishlashi uchun Mentor yozuvi userId orqali bog'langan bo'lishi
    // shart (aks holda kabinet MENTOR_NOT_LINKED beradi). Admin rolni almashtirishi
    // bilanoq kabinet ishlashi uchun avtomatik bog'laymiz:
    if (role === 'MENTOR') {
      const linked = await tx.mentor.findUnique({ where: { userId: id } });
      if (!linked) {
        // Admin oldindan xuddi shu ism bilan (hali bog'lanmagan) mentor profili
        // yaratgan bo'lsa — dublikat ochmasdan o'shani bog'laymiz
        const unlinkedSameName = await tx.mentor.findFirst({ where: { userId: null, name: user.name } });
        if (unlinkedSameName) {
          await tx.mentor.update({ where: { id: unlinkedSameName.id }, data: { userId: id } });
        } else {
          await tx.mentor.create({
            data: {
              userId: id,
              name: user.name,
              bio: { uz: `${user.name} — DATA LIFE mentori.` },
              specialty: { uz: 'Mentor' },
              featured: false,
            },
          });
        }
      }
    }

    return updated;
  });
}

export async function setUserBlocked(id: string, blocked: boolean, actingUserId: string) {
  const user = await prisma.user.findUnique({ where: { id } });
  if (!user) {
    throw ApiError.notFound('Foydalanuvchi topilmadi');
  }
  if (id === actingUserId) {
    throw ApiError.conflict("O'zingizni bloklay olmaysiz", 'CANNOT_BLOCK_SELF');
  }
  if (user.role === 'ADMIN' && blocked) {
    throw ApiError.conflict('Admin hisobini bloklab bo\'lmaydi, avval rolini o\'zgartiring', 'CANNOT_BLOCK_ADMIN');
  }

  return prisma.user.update({ where: { id }, data: { isBlocked: blocked }, select: userSelect });
}

export async function deleteUser(id: string, actingUserId: string) {
  const user = await prisma.user.findUnique({ where: { id } });
  if (!user) {
    throw ApiError.notFound('Foydalanuvchi topilmadi');
  }
  if (id === actingUserId) {
    throw ApiError.conflict("O'zingizni o'chira olmaysiz", 'CANNOT_DELETE_SELF');
  }
  if (user.role === 'ADMIN') {
    throw ApiError.conflict("Admin hisobini o'chirib bo'lmaydi, avval rolini o'zgartiring", 'CANNOT_DELETE_ADMIN');
  }

  await prisma.$transaction([
    prisma.mentor.updateMany({ where: { userId: id }, data: { userId: null } }),
    // To'lov tranzaksiyalari Enrollment/Subscription'ni RESTRICT bilan bog'laydi —
    // avval ular, keyin Enrollment/Subscription, keyin foydalanuvchi o'chiriladi.
    prisma.paymentTransaction.deleteMany({ where: { OR: [{ enrollment: { userId: id } }, { subscription: { userId: id } }] } }),
    prisma.subscription.deleteMany({ where: { userId: id } }),
    prisma.enrollment.deleteMany({ where: { userId: id } }),
    prisma.user.delete({ where: { id } }),
  ]);
}

export async function resetUserPassword(id: string) {
  const user = await prisma.user.findUnique({ where: { id } });
  if (!user) {
    throw ApiError.notFound('Foydalanuvchi topilmadi');
  }

  // O'qilishi oson vaqtinchalik parol (adashtiruvchi 0/O, 1/l belgilarisiz)
  const alphabet = 'ABCDEFGHJKMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789';
  const tempPassword = Array.from(crypto.randomBytes(10), (b) => alphabet[b % alphabet.length]).join('');

  const passwordHash = await hashPassword(tempPassword);
  // tokenVersion oshadi — foydalanuvchining barcha eski sessiyalari bekor bo'ladi
  await prisma.user.update({ where: { id }, data: { passwordHash, tokenVersion: { increment: 1 } } });

  return { tempPassword };
}
