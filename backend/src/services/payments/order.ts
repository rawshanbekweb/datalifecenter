import { Prisma } from '@prisma/client';
import { prisma } from '../../config/prisma';
import { confirmEnrollmentPayment, cancelEnrollmentPayment } from '../enrollments.service';
import { confirmSubscriptionPayment, cancelSubscriptionPayment, getSubscriptionPrice } from '../subscriptions.service';

export type OrderKind = 'enrollment' | 'subscription';

export interface Order {
  kind: OrderKind;
  id: string;
  price: Prisma.Decimal | number | string;
  alreadyPaid: boolean;
}

interface OrderRef {
  kind: OrderKind;
  id: string;
}

// Click/Payme'ga yuboriladigan buyurtma id'si — ikkala shlyuz ham bitta umumiy
// "order_id"/"merchant_trans_id" maydonidan foydalanadi, prefiks orqali qaysi
// jadvalga (Enrollment yoki Subscription) tegishli ekani ajratiladi.
export function encodeOrderId(kind: OrderKind, id: string): string {
  return kind === 'enrollment' ? `enr_${id}` : `sub_${id}`;
}

export async function resolveOrder(orderId: string | undefined | null): Promise<Order | null> {
  if (!orderId) return null;

  if (orderId.startsWith('enr_')) {
    const id = orderId.slice(4);
    const enrollment = await prisma.enrollment.findUnique({ where: { id }, include: { course: true } });
    if (!enrollment) return null;
    return { kind: 'enrollment', id, price: enrollment.course.price ?? 0, alreadyPaid: enrollment.paymentStatus === 'PAID' };
  }

  if (orderId.startsWith('sub_')) {
    const id = orderId.slice(4);
    const subscription = await prisma.subscription.findUnique({ where: { id } });
    if (!subscription) return null;
    const price = await getSubscriptionPrice();
    return {
      kind: 'subscription',
      id,
      price,
      alreadyPaid: subscription.status === 'ACTIVE' || subscription.status === 'EXPIRED',
    };
  }

  return null;
}

// PaymentTransaction'da qaysi FK to'ldirilganidan buyurtma turini tiklaydi —
// confirm/cancel uchun qayta bazadan resolveOrder() qilish shart emas.
export function orderRefFromTx(tx: { enrollmentId: string | null; subscriptionId: string | null }): OrderRef {
  return tx.enrollmentId ? { kind: 'enrollment', id: tx.enrollmentId } : { kind: 'subscription', id: tx.subscriptionId as string };
}

interface ConfirmInput {
  provider: string;
  providerRef: string;
  amount: Prisma.Decimal | number | string;
}

export async function confirmOrder(ref: OrderRef, input: ConfirmInput): Promise<void> {
  if (ref.kind === 'enrollment') {
    await confirmEnrollmentPayment(ref.id, input);
  } else {
    await confirmSubscriptionPayment(ref.id, input);
  }
}

export async function cancelOrder(ref: OrderRef): Promise<void> {
  if (ref.kind === 'enrollment') {
    await cancelEnrollmentPayment(ref.id);
  } else {
    await cancelSubscriptionPayment(ref.id);
  }
}
