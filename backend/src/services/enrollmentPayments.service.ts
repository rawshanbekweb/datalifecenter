import { PaymentMethod, PaymentStatus, Prisma } from '@prisma/client';
import { prisma } from '../config/prisma';
import { SupportedLocale } from '../config/locale';
import { ApiError } from '../utils/ApiError';
import { Actor } from '../utils/mentorAccess';
import { resolveLocaleDeep, toUzText } from '../utils/localizedField';
import { notify } from './notifications.service';

/**
 * To'lov daftari va undan kelib chiqadigan qarz hisobi.
 *
 * QOIDA: `Enrollment.amountPaid` va `paymentStatus` ni HECH QAYERDA qo'lda
 * yozmang — daftarga yozuv qo'shib, `recalcEnrollmentPayment` ni chaqiring.
 * Ilgari bu ikkisi bir necha joyda alohida yozilardi (admin tasdig'i, Click
 * webhook'i, mock to'lov) va ular bir-biridan asta-sekin uzoqlashib ketardi.
 */

const paymentInclude = {
  recordedBy: { select: { id: true, name: true } },
} satisfies Prisma.EnrollmentPaymentInclude;

/** Kelishilgan summa: alohida kelishuv bo'lmasa kursning joriy narxi. */
function agreedPriceOf(enrollment: {
  priceAgreed: Prisma.Decimal | null;
  format: 'ONLINE' | 'OFFLINE';
  course: { isFree: boolean; price: Prisma.Decimal | null; offlinePrice: Prisma.Decimal | null };
}): Prisma.Decimal {
  if (enrollment.course.isFree) return new Prisma.Decimal(0);
  if (enrollment.priceAgreed !== null) return enrollment.priceAgreed;
  const fallback = enrollment.format === 'OFFLINE'
    ? enrollment.course.offlinePrice ?? enrollment.course.price
    : enrollment.course.price;
  return fallback ?? new Prisma.Decimal(0);
}

export interface PaymentSummary {
  agreed: string;
  paid: string;
  debt: string;
  paymentStatus: PaymentStatus;
}

/**
 * Daftardagi yig'indini qayta sanaydi va yozilishning pul holatini yangilaydi.
 *
 * PENDING/REJECTED (chek ko'rib chiqilmoqda) holatiga hech narsa to'lanmagan
 * bo'lsa TEGILMAYDI: bu daftardan tashqaridagi oqim va uni UNPAID ga
 * aylantirish chekni "yo'qotib" qo'yardi.
 */
export async function recalcEnrollmentPayment(
  enrollmentId: string,
  tx: Prisma.TransactionClient = prisma,
): Promise<PaymentSummary> {
  const enrollment = await tx.enrollment.findUniqueOrThrow({
    where: { id: enrollmentId },
    select: {
      id: true,
      format: true,
      priceAgreed: true,
      paymentStatus: true,
      course: { select: { isFree: true, price: true, offlinePrice: true } },
    },
  });

  const sum = await tx.enrollmentPayment.aggregate({
    where: { enrollmentId },
    _sum: { amount: true },
  });
  const paid = sum._sum.amount ?? new Prisma.Decimal(0);
  const agreed = agreedPriceOf(enrollment);
  const debt = Prisma.Decimal.max(agreed.minus(paid), new Prisma.Decimal(0));

  let paymentStatus: PaymentStatus;
  if (enrollment.course.isFree || agreed.lessThanOrEqualTo(0)) {
    paymentStatus = 'FREE';
  } else if (paid.greaterThanOrEqualTo(agreed)) {
    paymentStatus = 'PAID';
  } else if (paid.greaterThan(0)) {
    paymentStatus = 'PARTIAL';
  } else if (enrollment.paymentStatus === 'PENDING' || enrollment.paymentStatus === 'REJECTED') {
    paymentStatus = enrollment.paymentStatus;
  } else {
    paymentStatus = 'UNPAID';
  }

  await tx.enrollment.update({
    where: { id: enrollmentId },
    data: { amountPaid: paid, paymentStatus },
  });

  return { agreed: agreed.toString(), paid: paid.toString(), debt: debt.toString(), paymentStatus };
}

/**
 * Qolgan qarz. "To'lovni tasdiqlash" tugmasi aynan shu summani daftarga
 * yozadi: qisman to'lagan o'quvchida qoldiq yopiladi, to'lagan summasi
 * ikkinchi marta qo'shilmaydi.
 */
export async function enrollmentDebt(enrollmentId: string): Promise<Prisma.Decimal> {
  const enrollment = await prisma.enrollment.findUniqueOrThrow({
    where: { id: enrollmentId },
    select: {
      format: true,
      priceAgreed: true,
      amountPaid: true,
      course: { select: { isFree: true, price: true, offlinePrice: true } },
    },
  });
  const paid = enrollment.amountPaid ?? new Prisma.Decimal(0);
  return Prisma.Decimal.max(agreedPriceOf(enrollment).minus(paid), new Prisma.Decimal(0));
}

export interface AddPaymentInput {
  amount: number | string;
  method?: PaymentMethod;
  paidAt?: Date;
  note?: string | null;
}

/**
 * Daftarga to'lov yozadi (naqd, karta, o'tkazma yoki shlyuz to'lovi).
 * `notifyStudent` false bo'ladi faqat ichki chaqiruvlarda — o'sha yerda
 * o'quvchiga alohida, to'liqroq xabar boradi (masalan qabul xati).
 */
export async function addEnrollmentPayment(
  enrollmentId: string,
  input: AddPaymentInput,
  recordedById: string | null,
  locale: SupportedLocale,
  options: { notifyStudent?: boolean } = {},
) {
  const enrollment = await prisma.enrollment.findUnique({
    where: { id: enrollmentId },
    select: { id: true, userId: true, course: { select: { title: true, currency: true } } },
  });
  if (!enrollment) {
    throw ApiError.notFound('Yozilish topilmadi');
  }

  const amount = new Prisma.Decimal(input.amount);
  if (amount.lessThanOrEqualTo(0)) {
    throw ApiError.badRequest("To'lov summasi noldan katta bo'lishi kerak", 'INVALID_PAYMENT_AMOUNT');
  }

  const [payment, summary] = await prisma.$transaction(async (tx) => {
    const created = await tx.enrollmentPayment.create({
      data: {
        enrollmentId,
        amount,
        method: input.method ?? 'CASH',
        paidAt: input.paidAt ?? new Date(),
        note: input.note ?? null,
        recordedById,
      },
      include: paymentInclude,
    });
    return [created, await recalcEnrollmentPayment(enrollmentId, tx)] as const;
  });

  // O'quvchi to'laganini va qancha qolganini bilib tursin — markazda
  // qog'oz kvitansiya beriladi, lekin qoldiq hisobi faqat shu yerda
  if (options.notifyStudent !== false) {
    const paidText = `${amount.toString()} ${enrollment.course.currency}`;
    await notify(enrollment.userId, {
      type: 'ANNOUNCEMENT',
      title: `To'lov qabul qilindi: ${toUzText(enrollment.course.title)}`,
      body: summary.paymentStatus === 'PAID'
        ? `${paidText} qabul qilindi. To'lov to'liq yakunlandi.`
        : `${paidText} qabul qilindi. Qolgan summa: ${summary.debt} ${enrollment.course.currency}.`,
      link: '/dashboard',
    });
  }

  return resolveLocaleDeep({ payment, summary }, locale);
}

/**
 * Xato kiritilgan yozuvni olib tashlaydi va qarzni qayta sanaydi.
 * Yozuv manzildagi yozilishga tegishli bo'lishi shart — aks holda bir
 * o'quvchining to'lovini boshqasining manzili orqali o'chirish mumkin bo'lardi.
 */
export async function deleteEnrollmentPayment(enrollmentId: string, paymentId: string): Promise<PaymentSummary> {
  const payment = await prisma.enrollmentPayment.findUnique({
    where: { id: paymentId },
    select: { id: true, enrollmentId: true },
  });
  if (!payment || payment.enrollmentId !== enrollmentId) {
    throw ApiError.notFound("To'lov yozuvi topilmadi");
  }
  return prisma.$transaction(async (tx) => {
    await tx.enrollmentPayment.delete({ where: { id: paymentId } });
    return recalcEnrollmentPayment(payment.enrollmentId, tx);
  });
}

/** Bitta yozilishning to'lovlari — admin uchun yoki o'quvchining o'ziga. */
export async function listEnrollmentPayments(enrollmentId: string, actor: Actor) {
  const enrollment = await prisma.enrollment.findUnique({
    where: { id: enrollmentId },
    select: {
      id: true,
      userId: true,
      format: true,
      priceAgreed: true,
      paymentStatus: true,
      amountPaid: true,
      course: { select: { isFree: true, price: true, offlinePrice: true, currency: true } },
    },
  });
  if (!enrollment || (actor.role !== 'ADMIN' && enrollment.userId !== actor.userId)) {
    throw ApiError.notFound('Yozilish topilmadi');
  }

  const payments = await prisma.enrollmentPayment.findMany({
    where: { enrollmentId },
    orderBy: { paidAt: 'desc' },
    include: paymentInclude,
  });

  const agreed = agreedPriceOf(enrollment);
  const paid = enrollment.amountPaid ?? new Prisma.Decimal(0);
  return {
    currency: enrollment.course.currency,
    summary: {
      agreed: agreed.toString(),
      paid: paid.toString(),
      debt: Prisma.Decimal.max(agreed.minus(paid), new Prisma.Decimal(0)).toString(),
      paymentStatus: enrollment.paymentStatus,
    },
    // Admin kim qabul qilganini ko'radi; o'quvchiga bu ma'lumot keraksiz
    payments: actor.role === 'ADMIN' ? payments : payments.map(({ recordedBy: _r, ...rest }) => rest),
  };
}

interface DebtorFilters {
  courseId?: string;
  groupId?: string;
  search?: string;
}

/**
 * Qarzdorlar — pulini to'liq to'lamagan FAOL o'quvchilar.
 *
 * Bepul kurslar va tugatilgan/bekor qilingan yozilishlar hisobga olinmaydi.
 * Jami qarz JS tomonida yig'iladi: ro'yxat markaz o'lchamida (yuzlab qator)
 * bo'lgani uchun bu SQL'da ustunlar ayirmasini hisoblashdan sodda va
 * o'qilishi oson, sahifalash esa bu yerda ataylab yo'q — qarzdorlar
 * ro'yxati to'liq ko'rinishi kerak.
 */
export async function listDebtors(filters: DebtorFilters, locale: SupportedLocale) {
  const rows = await prisma.enrollment.findMany({
    where: {
      paymentStatus: { in: ['UNPAID', 'PARTIAL', 'PENDING'] },
      status: { in: ['PENDING', 'ACTIVE'] },
      course: { isFree: false },
      ...(filters.courseId ? { courseId: filters.courseId } : {}),
      ...(filters.groupId ? { groupId: filters.groupId } : {}),
      ...(filters.search
        ? {
          OR: [
            { user: { name: { contains: filters.search, mode: 'insensitive' as const } } },
            { user: { email: { contains: filters.search, mode: 'insensitive' as const } } },
          ],
        }
        : {}),
    },
    orderBy: { enrolledAt: 'asc' },
    select: {
      id: true,
      format: true,
      status: true,
      paymentStatus: true,
      priceAgreed: true,
      amountPaid: true,
      enrolledAt: true,
      user: { select: { id: true, name: true, email: true } },
      group: { select: { id: true, name: true } },
      course: { select: { id: true, title: true, slug: true, isFree: true, price: true, offlinePrice: true, currency: true } },
    },
  });

  const withDebt = rows
    .map((row) => {
      const agreed = agreedPriceOf(row);
      const paid = row.amountPaid ?? new Prisma.Decimal(0);
      return { row, agreed, debt: agreed.minus(paid) };
    })
    // Kelishilgan summasi 0 bo'lgan (amalda bepul) yozilishlar qarzdor emas
    .filter((entry) => entry.debt.greaterThan(0));

  const totalDebt = withDebt.reduce((sum, entry) => sum.plus(entry.debt), new Prisma.Decimal(0));
  const items = withDebt.map((entry) => ({
    ...entry.row,
    agreed: entry.agreed.toString(),
    debt: entry.debt.toString(),
  }));

  return resolveLocaleDeep({ items, totalDebt: totalDebt.toString(), count: items.length }, locale);
}
