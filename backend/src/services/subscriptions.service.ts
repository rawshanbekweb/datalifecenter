import { Prisma } from '@prisma/client';
import { prisma } from '../config/prisma';
import { ApiError } from '../utils/ApiError';
import { notify } from './notifications.service';
import { deleteUploadByUrl } from './storage.service';

const SUBSCRIPTION_DAYS = 30;
const DEFAULT_SUBSCRIPTION_PRICE = 99000;
const DEFAULT_SUBSCRIPTION_CURRENCY = 'UZS';

// Narx admin panelidan (SiteSetting "subscription_plan" bo'limi) o'qiladi —
// yangi model shart emas, mavjud umumiy JSON-ombor qayta ishlatiladi.
export async function getSubscriptionPlan(): Promise<{ price: number; currency: string }> {
  const setting = await prisma.siteSetting.findUnique({ where: { section: 'subscription_plan' } });
  const data = setting?.data as { price?: number; currency?: string } | undefined;
  return {
    price: data?.price ?? DEFAULT_SUBSCRIPTION_PRICE,
    currency: data?.currency ?? DEFAULT_SUBSCRIPTION_CURRENCY,
  };
}

export async function getSubscriptionPrice(): Promise<number> {
  return (await getSubscriptionPlan()).price;
}

export async function hasActiveSubscription(userId: string): Promise<boolean> {
  const active = await prisma.subscription.findFirst({
    where: { userId, status: 'ACTIVE', expiresAt: { gt: new Date() } },
    select: { id: true },
  });
  return Boolean(active);
}

export async function createSubscription(userId: string) {
  const existing = await prisma.subscription.findFirst({
    where: {
      userId,
      OR: [{ status: 'PENDING' }, { status: 'ACTIVE', expiresAt: { gt: new Date() } }],
    },
  });
  if (existing) {
    throw ApiError.conflict('Sizda allaqachon faol yoki kutilayotgan obuna bor', 'ALREADY_SUBSCRIBED');
  }

  return prisma.subscription.create({ data: { userId, status: 'PENDING' } });
}

function hideReceiptUrl<T extends { receiptUrl?: string | null }>(sub: T): Omit<T, 'receiptUrl'> & { hasReceipt: boolean } {
  const { receiptUrl, ...rest } = sub;
  return { ...rest, hasReceipt: Boolean(receiptUrl) };
}

export async function getMySubscription(userId: string) {
  const subscription = await prisma.subscription.findFirst({
    where: { userId },
    orderBy: { createdAt: 'desc' },
  });
  if (!subscription) return null;
  return hideReceiptUrl(subscription);
}

interface ListSubscriptionsAdminFilters {
  status?: 'PENDING' | 'ACTIVE' | 'EXPIRED' | 'CANCELLED' | 'REJECTED';
  search?: string;
  page: number;
  limit: number;
}

export async function listSubscriptionsAdmin(filters: ListSubscriptionsAdminFilters) {
  const where: Prisma.SubscriptionWhereInput = {
    ...(filters.status ? { status: filters.status } : {}),
    ...(filters.search
      ? {
          user: {
            OR: [
              { name: { contains: filters.search, mode: 'insensitive' } },
              { email: { contains: filters.search, mode: 'insensitive' } },
            ],
          },
        }
      : {}),
  };

  const [items, total] = await Promise.all([
    prisma.subscription.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      skip: (filters.page - 1) * filters.limit,
      take: filters.limit,
      include: { user: { select: { id: true, name: true, email: true } } },
    }),
    prisma.subscription.count({ where }),
  ]);

  return {
    items: items.map(hideReceiptUrl),
    pagination: { page: filters.page, limit: filters.limit, total, totalPages: Math.ceil(total / filters.limit) },
  };
}

interface UpdateSubscriptionAdminInput {
  status?: 'ACTIVE' | 'REJECTED' | 'CANCELLED';
  rejectionReason?: string;
}

export async function updateSubscriptionAdmin(subscriptionId: string, input: UpdateSubscriptionAdminInput) {
  const subscription = await prisma.subscription.findUnique({ where: { id: subscriptionId } });
  if (!subscription) {
    throw ApiError.notFound('Obuna topilmadi');
  }

  if (input.status === 'ACTIVE') {
    const { price } = await getSubscriptionPlan();
    return confirmSubscriptionPayment(subscriptionId, {
      provider: subscription.provider ?? 'manual',
      providerRef: subscription.providerRef ?? `manual_${Date.now()}`,
      amount: subscription.amountPaid ?? price,
    });
  }

  if (input.status === 'REJECTED') {
    const updated = await prisma.subscription.update({
      where: { id: subscriptionId },
      data: { status: 'REJECTED', rejectionReason: input.rejectionReason },
      include: { user: { select: { id: true, name: true, email: true } } },
    });
    await notify(updated.userId, {
      type: 'PAYMENT_REJECTED',
      title: 'Obuna to\'lovi rad etildi',
      body: updated.rejectionReason ?? undefined,
      link: '/student/subscription',
    });
    return hideReceiptUrl(updated);
  }

  const updated = await prisma.subscription.update({
    where: { id: subscriptionId },
    data: { status: input.status },
    include: { user: { select: { id: true, name: true, email: true } } },
  });
  return hideReceiptUrl(updated);
}

interface ConfirmSubscriptionInput {
  provider: string;
  providerRef: string;
  amount: Prisma.Decimal | number | string;
}

// Admin qo'lda tasdiqlashi VA Click/Payme webhook'i bir xil yadrodan o'tadi.
export async function confirmSubscriptionPayment(subscriptionId: string, input: ConfirmSubscriptionInput) {
  const subscription = await prisma.subscription.findUnique({ where: { id: subscriptionId } });
  if (!subscription) {
    throw ApiError.notFound('Obuna topilmadi');
  }
  // Idempotent — webhook qayta so'ralishi mumkin
  if (subscription.status === 'ACTIVE' && subscription.expiresAt && subscription.expiresAt > new Date()) {
    return subscription;
  }

  const now = new Date();
  const base = subscription.expiresAt && subscription.expiresAt > now ? subscription.expiresAt : now;
  const expiresAt = new Date(base.getTime() + SUBSCRIPTION_DAYS * 24 * 60 * 60 * 1000);

  const updated = await prisma.subscription.update({
    where: { id: subscriptionId },
    data: {
      status: 'ACTIVE',
      startsAt: subscription.startsAt ?? now,
      expiresAt,
      provider: input.provider,
      providerRef: input.providerRef,
      amountPaid: input.amount,
      rejectionReason: null,
    },
  });

  await provisionCoursesForSubscriber(subscription.userId);

  await notify(subscription.userId, {
    type: 'SUBSCRIPTION_ACTIVATED',
    title: 'Obuna faollashtirildi',
    body: `Barcha kurslarga kirish ochildi — ${expiresAt.toLocaleDateString('uz-UZ')} sanagacha amal qiladi.`,
    link: '/student',
  });

  return updated;
}

// Obuna faollashganda (yoki har safar talaba yangi, hali Enrollment'i bo'lmagan
// kursga kirmoqchi bo'lganda — courses.service.ts) nashr qilingan barcha
// kurslar uchun Enrollment avtomatik yaratiladi. Mavjud infratuzilma
// (progress/sertifikat/jonli-dars/sharh) o'zgarishsiz ishlashda davom etadi.
export async function provisionCoursesForSubscriber(userId: string): Promise<void> {
  const [courses, existing] = await Promise.all([
    prisma.course.findMany({ where: { published: true }, select: { id: true } }),
    prisma.enrollment.findMany({ where: { userId }, select: { courseId: true } }),
  ]);
  const existingIds = new Set(existing.map((e) => e.courseId));
  const missing = courses.filter((c) => !existingIds.has(c.id));
  if (missing.length === 0) return;

  await prisma.enrollment.createMany({
    data: missing.map((c) => ({
      userId,
      courseId: c.id,
      status: 'ACTIVE' as const,
      paymentStatus: 'FREE' as const,
      provider: 'subscription',
    })),
    skipDuplicates: true,
  });
}

export async function cancelSubscriptionPayment(subscriptionId: string) {
  const subscription = await prisma.subscription.findUnique({ where: { id: subscriptionId } });
  if (!subscription || subscription.status !== 'ACTIVE') {
    return subscription;
  }

  const updated = await prisma.subscription.update({ where: { id: subscriptionId }, data: { status: 'CANCELLED' } });

  await notify(subscription.userId, {
    type: 'PAYMENT_REJECTED',
    title: "Obuna to'lovi qaytarildi",
    body: "To'lov shlyuzi tomonidan qaytarildi, obuna bekor qilindi.",
    link: '/student/subscription',
  });

  return updated;
}

export async function submitSubscriptionReceipt(userId: string, subscriptionId: string, receiptUrl: string) {
  const subscription = await prisma.subscription.findUnique({ where: { id: subscriptionId } });
  if (!subscription || subscription.userId !== userId) {
    throw ApiError.notFound('Obuna topilmadi');
  }
  if (subscription.status !== 'PENDING') {
    throw ApiError.conflict('Bu obuna uchun chek yuklab bo\'lmaydi', 'INVALID_STATE');
  }

  if (subscription.receiptUrl && subscription.receiptUrl !== receiptUrl) {
    await deleteUploadByUrl(subscription.receiptUrl);
  }

  return prisma.subscription.update({ where: { id: subscriptionId }, data: { receiptUrl, rejectionReason: null } });
}

export type ReceiptSource = { kind: 'local'; filename: string } | { kind: 'remote'; url: string };

export async function getSubscriptionReceiptSource(userId: string, role: string, subscriptionId: string): Promise<ReceiptSource> {
  const subscription = await prisma.subscription.findUnique({ where: { id: subscriptionId }, select: { userId: true, receiptUrl: true } });
  if (!subscription || (subscription.userId !== userId && role !== 'ADMIN')) {
    throw ApiError.notFound('Obuna topilmadi');
  }
  if (!subscription.receiptUrl) {
    throw ApiError.notFound('Chek yuklanmagan');
  }

  const local = /\/uploads\/images\/([^/?#]+)/.exec(subscription.receiptUrl);
  if (local) {
    return { kind: 'local', filename: local[1] };
  }
  return { kind: 'remote', url: subscription.receiptUrl };
}
