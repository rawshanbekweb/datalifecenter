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
  return prisma.enrollment.findMany({
    where: { userId },
    orderBy: { enrolledAt: 'desc' },
    include: { course: true },
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
