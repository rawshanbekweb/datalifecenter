import { prisma } from '../../config/prisma';
import { env } from '../../config/env';
import { ApiError } from '../../utils/ApiError';
import { clickEnabled, buildClickCheckoutUrl } from './click.service';
import { paymeEnabled, buildPaymeCheckoutUrl } from './payme.service';

export function getPaymentConfig() {
  return { click: clickEnabled, payme: paymeEnabled };
}

export async function createCheckout(userId: string, enrollmentId: string, provider: 'click' | 'payme'): Promise<string> {
  if (provider === 'click' && !clickEnabled) {
    throw ApiError.conflict("Click hozircha sozlanmagan", 'PROVIDER_NOT_CONFIGURED');
  }
  if (provider === 'payme' && !paymeEnabled) {
    throw ApiError.conflict("Payme hozircha sozlanmagan", 'PROVIDER_NOT_CONFIGURED');
  }

  const enrollment = await prisma.enrollment.findUnique({ where: { id: enrollmentId }, include: { course: true } });
  if (!enrollment || enrollment.userId !== userId) {
    throw ApiError.notFound('Yozilish topilmadi');
  }
  if (enrollment.paymentStatus === 'PAID' || enrollment.paymentStatus === 'FREE') {
    throw ApiError.conflict("Bu yozilish uchun to'lov talab qilinmaydi", 'PAYMENT_NOT_REQUIRED');
  }

  const amount = Number(enrollment.course.price ?? 0);
  const returnUrl = `${env.FRONTEND_URL.replace(/\/+$/, '')}/dashboard?payment=return`;

  return provider === 'click' ? buildClickCheckoutUrl(enrollment.id, amount, returnUrl) : buildPaymeCheckoutUrl(enrollment.id, amount);
}
