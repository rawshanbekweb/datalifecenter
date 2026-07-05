import { Prisma } from '@prisma/client';
import { prisma } from '../config/prisma';
import { ApiError } from '../utils/ApiError';

const userSelect = {
  id: true,
  email: true,
  name: true,
  phone: true,
  role: true,
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
