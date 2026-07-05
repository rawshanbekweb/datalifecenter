import { Prisma } from '@prisma/client';
import { prisma } from '../config/prisma';
import { ApiError } from '../utils/ApiError';

export async function createEnrollment(userId: string, courseId: string) {
  const course = await prisma.course.findFirst({ where: { id: courseId, published: true } });
  if (!course) {
    throw ApiError.notFound('Kurs topilmadi');
  }

  const existing = await prisma.enrollment.findUnique({
    where: { userId_courseId: { userId, courseId } },
  });
  if (existing) {
    throw ApiError.conflict("Siz bu kursga allaqachon yozilgansiz", 'ALREADY_ENROLLED');
  }

  const [enrollment] = await prisma.$transaction([
    prisma.enrollment.create({
      data: {
        userId,
        courseId,
        status: course.isFree ? 'ACTIVE' : 'PENDING',
        paymentStatus: course.isFree ? 'FREE' : 'UNPAID',
      },
      include: { course: true },
    }),
    prisma.course.update({ where: { id: courseId }, data: { studentsCount: { increment: 1 } } }),
  ]);

  return enrollment;
}

export async function getMyEnrollments(userId: string) {
  const enrollments = await prisma.enrollment.findMany({
    where: { userId },
    orderBy: { enrolledAt: 'desc' },
    include: { course: true },
  });

  return Promise.all(
    enrollments.map(async (enrollment) => {
      const [totalLessons, completedLessons] = await Promise.all([
        prisma.lesson.count({ where: { module: { courseId: enrollment.courseId } } }),
        prisma.lessonProgress.count({ where: { userId, lesson: { module: { courseId: enrollment.courseId } } } }),
      ]);
      return { ...enrollment, progress: { totalLessons, completedLessons } };
    })
  );
}

interface ListEnrollmentsAdminFilters {
  status?: 'PENDING' | 'ACTIVE' | 'COMPLETED' | 'CANCELLED';
  paymentStatus?: 'FREE' | 'UNPAID' | 'PENDING' | 'PAID' | 'REFUNDED';
  search?: string;
  page: number;
  limit: number;
}

export async function listEnrollmentsAdmin(filters: ListEnrollmentsAdminFilters) {
  const where: Prisma.EnrollmentWhereInput = {
    ...(filters.status ? { status: filters.status } : {}),
    ...(filters.paymentStatus ? { paymentStatus: filters.paymentStatus } : {}),
    ...(filters.search
      ? {
          OR: [
            { user: { name: { contains: filters.search, mode: 'insensitive' } } },
            { user: { email: { contains: filters.search, mode: 'insensitive' } } },
            { course: { title: { contains: filters.search, mode: 'insensitive' } } },
          ],
        }
      : {}),
  };

  const [items, total] = await Promise.all([
    prisma.enrollment.findMany({
      where,
      orderBy: { enrolledAt: 'desc' },
      skip: (filters.page - 1) * filters.limit,
      take: filters.limit,
      include: {
        user: { select: { id: true, name: true, email: true } },
        course: { select: { id: true, title: true, slug: true, isFree: true, price: true, currency: true } },
      },
    }),
    prisma.enrollment.count({ where }),
  ]);

  return {
    items,
    pagination: { page: filters.page, limit: filters.limit, total, totalPages: Math.ceil(total / filters.limit) },
  };
}

interface UpdateEnrollmentAdminInput {
  status?: 'PENDING' | 'ACTIVE' | 'COMPLETED' | 'CANCELLED';
  paymentStatus?: 'FREE' | 'UNPAID' | 'PENDING' | 'PAID' | 'REFUNDED';
}

export async function updateEnrollmentAdmin(enrollmentId: string, input: UpdateEnrollmentAdminInput) {
  const enrollment = await prisma.enrollment.findUnique({
    where: { id: enrollmentId },
    include: { course: true },
  });
  if (!enrollment) {
    throw ApiError.notFound('Yozilish topilmadi');
  }

  const data: Prisma.EnrollmentUpdateInput = { ...input };

  // To'lov tasdiqlansa kurs avtomatik faollashadi
  if (input.paymentStatus === 'PAID' && enrollment.paymentStatus !== 'PAID') {
    data.provider = enrollment.provider ?? 'manual';
    data.providerRef = enrollment.providerRef ?? `manual_${Date.now()}`;
    data.amountPaid = enrollment.amountPaid ?? enrollment.course.price;
    if (!input.status && enrollment.status === 'PENDING') {
      data.status = 'ACTIVE';
    }
  }
  if (input.status === 'COMPLETED') {
    data.completedAt = enrollment.completedAt ?? new Date();
  }

  return prisma.enrollment.update({
    where: { id: enrollmentId },
    data,
    include: {
      user: { select: { id: true, name: true, email: true } },
      course: { select: { id: true, title: true, slug: true, isFree: true, price: true, currency: true } },
    },
  });
}

export async function mockPayEnrollment(userId: string, enrollmentId: string) {
  const enrollment = await prisma.enrollment.findUnique({
    where: { id: enrollmentId },
    include: { course: true },
  });

  if (!enrollment || enrollment.userId !== userId) {
    throw ApiError.notFound('Yozilish topilmadi');
  }
  if (enrollment.paymentStatus === 'PAID') {
    throw ApiError.conflict("Bu yozilish uchun to'lov allaqachon amalga oshirilgan", 'ALREADY_PAID');
  }

  return prisma.enrollment.update({
    where: { id: enrollmentId },
    data: {
      status: 'ACTIVE',
      paymentStatus: 'PAID',
      provider: 'mock',
      providerRef: `mock_${Date.now()}`,
      amountPaid: enrollment.course.price,
    },
    include: { course: true },
  });
}
