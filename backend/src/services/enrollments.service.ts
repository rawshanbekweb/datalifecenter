import { Prisma } from '@prisma/client';
import { prisma } from '../config/prisma';
import { env } from '../config/env';
import { SupportedLocale } from '../config/locale';
import { ApiError } from '../utils/ApiError';
import { resolveLocaleDeep, toUzText } from '../utils/localizedField';
import { notify, notifyAdmins } from './notifications.service';
import { sendPaymentConfirmedEmail, sendPaymentRejectedEmail } from './email.service';
import { deleteUploadByUrl } from './storage.service';

export async function createEnrollment(userId: string, courseId: string, locale: SupportedLocale) {
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

  return resolveLocaleDeep(enrollment, locale);
}

// Xom receiptUrl javobdan olib tashlanadi — chek endi faqat autentifikatsiyalangan
// GET /api/enrollments/:id/receipt orqali ko'riladi (getReceiptSource()).
function hideReceiptUrl<T extends { receiptUrl?: string | null }>(enrollment: T): Omit<T, 'receiptUrl'> & { hasReceipt: boolean } {
  const { receiptUrl, ...rest } = enrollment;
  return { ...rest, hasReceipt: Boolean(receiptUrl) };
}

export async function getMyEnrollments(userId: string, locale: SupportedLocale) {
  const enrollments = await prisma.enrollment.findMany({
    where: { userId },
    orderBy: { enrolledAt: 'desc' },
    include: { course: true },
  });

  const result = await Promise.all(
    enrollments.map(async (enrollment) => {
      const [totalLessons, completedLessons] = await Promise.all([
        prisma.lesson.count({ where: { module: { courseId: enrollment.courseId } } }),
        prisma.lessonProgress.count({ where: { userId, lesson: { module: { courseId: enrollment.courseId } } } }),
      ]);
      return { ...hideReceiptUrl(enrollment), progress: { totalLessons, completedLessons } };
    })
  );
  return resolveLocaleDeep(result, locale);
}

interface ListEnrollmentsAdminFilters {
  status?: 'PENDING' | 'ACTIVE' | 'COMPLETED' | 'CANCELLED';
  paymentStatus?: 'FREE' | 'UNPAID' | 'PENDING' | 'PAID' | 'REFUNDED';
  search?: string;
  page: number;
  limit: number;
}

export async function listEnrollmentsAdmin(filters: ListEnrollmentsAdminFilters, locale: SupportedLocale) {
  const where: Prisma.EnrollmentWhereInput = {
    ...(filters.status ? { status: filters.status } : {}),
    ...(filters.paymentStatus ? { paymentStatus: filters.paymentStatus } : {}),
    ...(filters.search
      ? {
          OR: [
            { user: { name: { contains: filters.search, mode: 'insensitive' } } },
            { user: { email: { contains: filters.search, mode: 'insensitive' } } },
            { course: { title: { path: ['uz'], string_contains: filters.search, mode: 'insensitive' } } },
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
    items: resolveLocaleDeep(items.map(hideReceiptUrl), locale),
    pagination: { page: filters.page, limit: filters.limit, total, totalPages: Math.ceil(total / filters.limit) },
  };
}

interface UpdateEnrollmentAdminInput {
  status?: 'PENDING' | 'ACTIVE' | 'COMPLETED' | 'CANCELLED';
  paymentStatus?: 'FREE' | 'UNPAID' | 'PENDING' | 'PAID' | 'REJECTED' | 'REFUNDED';
  rejectionReason?: string;
}

export async function updateEnrollmentAdmin(enrollmentId: string, input: UpdateEnrollmentAdminInput, locale: SupportedLocale) {
  const enrollment = await prisma.enrollment.findUnique({
    where: { id: enrollmentId },
    include: { course: true },
  });
  if (!enrollment) {
    throw ApiError.notFound('Yozilish topilmadi');
  }

  // Admin qo'lda "To'lovni tasdiqlash" bosganda ham, Click/Payme webhook'i ham
  // bir xil yadrodan (confirmEnrollmentPayment) o'tadi — ikkalasida ham bir xil
  // status/bildirishnoma/email natijasi bo'lishi uchun.
  if (input.paymentStatus === 'PAID' && enrollment.paymentStatus !== 'PAID') {
    return confirmEnrollmentPayment(enrollmentId, {
      provider: enrollment.provider ?? 'manual',
      providerRef: enrollment.providerRef ?? `manual_${Date.now()}`,
      amount: enrollment.amountPaid ?? enrollment.course.price ?? 0,
    }, locale);
  }

  const data: Prisma.EnrollmentUpdateInput = {
    status: input.status,
    paymentStatus: input.paymentStatus,
  };

  if (input.paymentStatus === 'REJECTED') {
    data.rejectionReason = input.rejectionReason;
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
      title: `Kurs ochildi: ${toUzText(updated.course.title)}`,
      body: "To'lovingiz tasdiqlandi — darslarni boshlashingiz mumkin.",
      link: `/learn/${updated.course.slug}`,
    });
  }

  // To'lov rad etilsa talabaga sabab bilan bildirishnoma va email yuboriladi
  if (input.paymentStatus === 'REJECTED' && enrollment.paymentStatus !== 'REJECTED') {
    await notify(updated.userId, {
      type: 'PAYMENT_REJECTED',
      title: `To'lov rad etildi: ${toUzText(updated.course.title)}`,
      body: updated.rejectionReason ?? undefined,
      link: '/dashboard',
    });
    await sendPaymentRejectedEmail(updated.user.email, updated.user.name, toUzText(updated.course.title), updated.rejectionReason ?? '');
  }

  return resolveLocaleDeep(updated, locale);
}

interface ConfirmPaymentInput {
  provider: string;
  providerRef: string;
  amount: Prisma.Decimal | number | string;
}

// To'lov manbasidan qat'iy nazar (admin qo'lda tasdiqlashi, Click/Payme webhook'i)
// yozilishni faollashtiradigan yagona yadro — status/bildirishnoma/email bir xil bo'lishi uchun.
export async function confirmEnrollmentPayment(enrollmentId: string, input: ConfirmPaymentInput, locale: SupportedLocale = 'uz') {
  const enrollment = await prisma.enrollment.findUnique({ where: { id: enrollmentId }, include: { course: true } });
  if (!enrollment) {
    throw ApiError.notFound('Yozilish topilmadi');
  }
  // Idempotent — allaqachon to'langan bo'lsa qayta ishlov berilmaydi (webhook'lar qayta so'ralishi mumkin)
  if (enrollment.paymentStatus === 'PAID') {
    const existing = await prisma.enrollment.findUniqueOrThrow({
      where: { id: enrollmentId },
      include: {
        user: { select: { id: true, name: true, email: true } },
        course: { select: { id: true, title: true, slug: true, isFree: true, price: true, currency: true } },
      },
    });
    return resolveLocaleDeep(existing, locale);
  }

  const wasActive = enrollment.status === 'ACTIVE' || enrollment.status === 'COMPLETED';
  const updated = await prisma.enrollment.update({
    where: { id: enrollmentId },
    data: {
      paymentStatus: 'PAID',
      status: wasActive ? undefined : 'ACTIVE',
      provider: input.provider,
      providerRef: input.providerRef,
      amountPaid: input.amount,
      rejectionReason: null,
    },
    include: {
      user: { select: { id: true, name: true, email: true } },
      course: { select: { id: true, title: true, slug: true, isFree: true, price: true, currency: true } },
    },
  });

  if (!wasActive) {
    await notify(updated.userId, {
      type: 'ENROLLMENT_ACTIVATED',
      title: `Kurs ochildi: ${toUzText(updated.course.title)}`,
      body: "To'lovingiz tasdiqlandi — darslarni boshlashingiz mumkin.",
      link: `/learn/${updated.course.slug}`,
    });
  }
  const courseUrl = `${env.FRONTEND_URL.replace(/\/+$/, '')}/learn/${updated.course.slug}`;
  await sendPaymentConfirmedEmail(updated.user.email, updated.user.name, toUzText(updated.course.title), courseUrl);

  return resolveLocaleDeep(updated, locale);
}

// To'lov shlyuzi tranzaksiyani bekor qilsa (checkout tugallanmasdan) yoki qaytarsa
// (to'langandan keyin bekor qilinsa — dispute/chargeback) chaqiriladi.
// To'lanmasdan bekor qilingan holatda yozilishga tegilmaydi (hali hech narsa o'zgarmagan).
export async function cancelEnrollmentPayment(enrollmentId: string, locale: SupportedLocale = 'uz') {
  const enrollment = await prisma.enrollment.findUnique({ where: { id: enrollmentId }, include: { course: true } });
  if (!enrollment || enrollment.paymentStatus !== 'PAID') {
    return resolveLocaleDeep(enrollment, locale);
  }

  const updated = await prisma.enrollment.update({
    where: { id: enrollmentId },
    data: { paymentStatus: 'REFUNDED', status: 'CANCELLED' },
    include: {
      user: { select: { id: true, name: true, email: true } },
      course: { select: { id: true, title: true, slug: true, isFree: true, price: true, currency: true } },
    },
  });

  await notify(updated.userId, {
    type: 'PAYMENT_REJECTED',
    title: `To'lov qaytarildi: ${toUzText(updated.course.title)}`,
    body: "To'lov shlyuzi tomonidan qaytarildi, kursga kirish vaqtincha yopildi.",
    link: '/dashboard',
  });

  return resolveLocaleDeep(updated, locale);
}

// Talaba to'lov chekini yuboradi — admin tasdiqlashini kutadi
export async function submitReceipt(userId: string, enrollmentId: string, receiptUrl: string, locale: SupportedLocale) {
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
    data: { receiptUrl, paymentStatus: 'PENDING', provider: 'receipt', rejectionReason: null },
    include: { course: true },
  });

  await notifyAdmins({
    type: 'RECEIPT_SUBMITTED',
    title: "Yangi to'lov cheki yuklandi",
    body: `${enrollment.user.name} — ${toUzText(enrollment.course.title)}`,
    link: '/admin/enrollments',
  });

  return resolveLocaleDeep(updated, locale);
}

export type ReceiptSource = { kind: 'local'; filename: string } | { kind: 'remote'; url: string };

// Chekni faqat egasi yoki admin ko'ra oladi — xom receiptUrl clientga hech qachon
// chiqmaydi (contoller shu natijaga qarab lokal fayl yoki tashqi URL'ni oqim qiladi).
export async function getReceiptSource(userId: string, role: string, enrollmentId: string): Promise<ReceiptSource> {
  const enrollment = await prisma.enrollment.findUnique({ where: { id: enrollmentId }, select: { userId: true, receiptUrl: true } });
  if (!enrollment || (enrollment.userId !== userId && role !== 'ADMIN')) {
    throw ApiError.notFound('Yozilish topilmadi');
  }
  if (!enrollment.receiptUrl) {
    throw ApiError.notFound('Chek yuklanmagan');
  }

  const local = /\/uploads\/images\/([^/?#]+)/.exec(enrollment.receiptUrl);
  if (local) {
    return { kind: 'local', filename: local[1] };
  }
  return { kind: 'remote', url: enrollment.receiptUrl };
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
    courseTitle: toUzText(enrollment.course.title),
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
    courseTitle: toUzText(enrollment.course.title),
    durationMonths: enrollment.course.durationMonths,
    completedAt: enrollment.completedAt,
  };
}

export async function mockPayEnrollment(userId: string, enrollmentId: string, locale: SupportedLocale) {
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

  const updated = await prisma.enrollment.update({
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
  return resolveLocaleDeep(updated, locale);
}
