import { prisma } from '../../config/prisma';
import { env } from '../../config/env';
import { ApiError } from '../../utils/ApiError';
import { clickEnabled, buildClickCheckoutUrl } from './click.service';
import { paymeEnabled, buildPaymeCheckoutUrl } from './payme.service';
import { encodeOrderId } from './order';
import { getSubscriptionPrice } from '../subscriptions.service';

export function getPaymentConfig() {
  return { click: clickEnabled, payme: paymeEnabled };
}

export type CheckoutTarget = { kind: 'enrollment'; enrollmentId: string } | { kind: 'subscription'; subscriptionId: string };

export async function createCheckout(userId: string, target: CheckoutTarget, provider: 'click' | 'payme'): Promise<string> {
  if (provider === 'click' && !clickEnabled) {
    throw ApiError.conflict("Click hozircha sozlanmagan", 'PROVIDER_NOT_CONFIGURED');
  }
  if (provider === 'payme' && !paymeEnabled) {
    throw ApiError.conflict("Payme hozircha sozlanmagan", 'PROVIDER_NOT_CONFIGURED');
  }

  let orderId: string;
  let amount: number;
  let returnPath: string;

  if (target.kind === 'enrollment') {
    const enrollment = await prisma.enrollment.findUnique({ where: { id: target.enrollmentId }, include: { course: true } });
    if (!enrollment || enrollment.userId !== userId) {
      throw ApiError.notFound('Yozilish topilmadi');
    }
    if (enrollment.paymentStatus === 'PAID' || enrollment.paymentStatus === 'FREE') {
      throw ApiError.conflict("Bu yozilish uchun to'lov talab qilinmaydi", 'PAYMENT_NOT_REQUIRED');
    }
    orderId = encodeOrderId('enrollment', enrollment.id);
    amount = Number(enrollment.course.price ?? 0);
    returnPath = '/dashboard?payment=return';
  } else {
    const subscription = await prisma.subscription.findUnique({ where: { id: target.subscriptionId } });
    if (!subscription || subscription.userId !== userId) {
      throw ApiError.notFound('Obuna topilmadi');
    }
    if (subscription.status === 'ACTIVE' && subscription.expiresAt && subscription.expiresAt > new Date()) {
      throw ApiError.conflict("Bu obuna uchun to'lov talab qilinmaydi", 'PAYMENT_NOT_REQUIRED');
    }
    orderId = encodeOrderId('subscription', subscription.id);
    amount = await getSubscriptionPrice();
    returnPath = '/student/subscription?payment=return';
  }

  const returnUrl = `${env.FRONTEND_URL.replace(/\/+$/, '')}${returnPath}`;
  return provider === 'click' ? buildClickCheckoutUrl(orderId, amount, returnUrl) : buildPaymeCheckoutUrl(orderId, amount);
}
