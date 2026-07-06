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

  return prisma.user.update({ where: { id }, data: { role }, select: userSelect });
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
  await prisma.user.update({ where: { id }, data: { passwordHash } });

  return { tempPassword };
}
