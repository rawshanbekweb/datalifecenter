import { Prisma } from '@prisma/client';
import { prisma } from '../config/prisma';
import { env } from '../config/env';
import { ApiError } from '../utils/ApiError';
import { notify, notifyAdmins } from './notifications.service';
import { sendPaymentConfirmedEmail } from './email.service';
import { deleteUploadByUrl } from './storage.service';

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

  const updated = await prisma.enrollment.update({
    where: { id: enrollmentId },
    data,
    include: {
      user: { select: { id: true, name: true, email: true } },
      course: { select: { id: true, title: true, slug: true, isFree: true, price: true, currency: true } },
    },
  });

  if (updated.status === 'ACTIVE' && enrollment.status !== 'ACTIVE') {
    await notify(updated.userId, {
      type: 'ENROLLMENT_ACTIVATED',
      title: `Kurs ochildi: ${updated.course.title}`,
      body: "To'lovingiz tasdiqlandi — darslarni boshlashingiz mumkin.",
      link: `/learn/${updated.course.slug}`,
    });
  }

  // To'lov endi tasdiqlangan bo'lsa talabaga email ham yuboriladi
  if (input.paymentStatus === 'PAID' && enrollment.paymentStatus !== 'PAID') {
    const courseUrl = `${env.FRONTEND_URL.replace(/\/+$/, '')}/learn/${updated.course.slug}`;
    await sendPaymentConfirmedEmail(updated.user.email, updated.user.name, updated.course.title, courseUrl);
  }

  return updated;
}

// Talaba to'lov chekini yuboradi — admin tasdiqlashini kutadi
export async function submitReceipt(userId: string, enrollmentId: string, receiptUrl: string) {
  const enrollment = await prisma.enrollment.findUnique({
    where: { id: enrollmentId },
    include: { course: true, user: { select: { name: true } } },
  });

  if (!enrollment || enrollment.userId !== userId) {
    throw ApiError.notFound('Yozilish topilmadi');
  }
  if (enrollment.paymentStatus === 'FREE') {
    throw ApiError.conflict("Bu kurs bepul — to'lov talab qilinmaydi", 'PAYMENT_NOT_REQUIRED');
  }
  if (enrollment.paymentStatus === 'PAID') {
    throw ApiError.conflict("Bu yozilish uchun to'lov allaqachon tasdiqlangan", 'ALREADY_PAID');
  }

  // Yangi chek yuklansa eskisi xotirada yetim qolmasin
  if (enrollment.receiptUrl && enrollment.receiptUrl !== receiptUrl) {
    await deleteUploadByUrl(enrollment.receiptUrl);
  }

  const updated = await prisma.enrollment.update({
    where: { id: enrollmentId },
    data: { receiptUrl, paymentStatus: 'PENDING', provider: 'receipt' },
    include: { course: true },
  });

  await notifyAdmins({
    type: 'RECEIPT_SUBMITTED',
    title: "Yangi to'lov cheki yuklandi",
    body: `${enrollment.user.name} — ${enrollment.course.title}`,
    link: '/admin/enrollments',
  });

  return updated;
}

// Sertifikat ma'lumotlari — faqat yakunlangan kurs uchun, egasi yoki admin
export async function getCertificateData(userId: string, role: string, enrollmentId: string) {
  const enrollment = await prisma.enrollment.findUnique({
    where: { id: enrollmentId },
    include: {
      user: { select: { name: true } },
      course: { select: { title: true, durationMonths: true } },
    },
  });

  if (!enrollment || (enrollment.userId !== userId && role !== 'ADMIN')) {
    throw ApiError.notFound('Yozilish topilmadi');
  }
  if (enrollment.status !== 'COMPLETED') {
    throw ApiError.conflict('Sertifikat faqat kurs yakunlangandan keyin beriladi', 'NOT_COMPLETED');
  }

  return {
    studentName: enrollment.user.name,
    courseTitle: enrollment.course.title,
    durationMonths: enrollment.course.durationMonths,
    completedAt: enrollment.completedAt ?? new Date(),
    certificateNo: `DL-${enrollment.id.slice(-8).toUpperCase()}`,
    verifyUrl: `${env.FRONTEND_URL.replace(/\/+$/, '')}/verify-certificate`,
  };
}

// Ochiq sertifikat tekshiruvi: raqam bo'yicha haqiqiyligini istalgan kishi
// (masalan, ish beruvchi) tekshira oladi. Raqam enrollment id'sining oxirgi
// 8 belgisidan yasaladi (getCertificateData bilan bir xil format).
export async function verifyCertificate(certificateNo: string) {
  const match = /^DL-([A-Za-z0-9]{8})$/.exec(certificateNo.trim());
  if (!match) {
    throw ApiError.notFound('Sertifikat topilmadi yoki raqam formati noto\'g\'ri', 'CERTIFICATE_NOT_FOUND');
  }

  const suffix = match[1].toLowerCase();
  const enrollment = await prisma.enrollment.findFirst({
    where: { id: { endsWith: suffix }, status: 'COMPLETED' },
    include: {
      user: { select: { name: true } },
      course: { select: { title: true, durationMonths: true } },
    },
  });

  if (!enrollment) {
    throw ApiError.notFound('Bunday raqamli haqiqiy sertifikat topilmadi', 'CERTIFICATE_NOT_FOUND');
  }

  return {
    certificateNo: `DL-${suffix.toUpperCase()}`,
    studentName: enrollment.user.name,
    courseTitle: enrollment.course.title,
    durationMonths: enrollment.course.durationMonths,
    completedAt: enrollment.completedAt,
  };
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
