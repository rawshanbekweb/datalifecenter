import crypto from 'crypto';
import { prisma } from '../../config/prisma';
import { env } from '../../config/env';
import { confirmEnrollmentPayment, cancelEnrollmentPayment } from '../enrollments.service';

// CLICK_SERVICE_ID/CLICK_MERCHANT_ID/CLICK_SECRET_KEY sozlanmasa checkout tugmasi
// frontendda ko'rinmaydi — qo'lda-chek-yuklash oqimi ishlab turaveradi.
export const clickEnabled = Boolean(env.CLICK_SERVICE_ID && env.CLICK_MERCHANT_ID && env.CLICK_SECRET_KEY);

// Click rasmiy xato kodlari (merchant -> Click javobidagi "error" maydoni)
const CLICK_ERROR = {
  SUCCESS: 0,
  SIGN_FAILED: -1,
  WRONG_AMOUNT: -2,
  ACTION_NOT_FOUND: -3,
  ALREADY_PAID: -4,
  ORDER_NOT_FOUND: -5,
  TRANSACTION_NOT_FOUND: -6,
  FAILED_TO_UPDATE: -7,
  BAD_REQUEST: -8,
  TRANSACTION_CANCELLED: -9,
} as const;

interface ClickParams {
  click_trans_id: string;
  service_id: string;
  click_paydoc_id?: string;
  merchant_trans_id: string;
  merchant_prepare_id?: string;
  amount: string;
  action: string;
  error?: string;
  error_note?: string;
  sign_time: string;
  sign_string: string;
}

function buildCheckoutUrl(enrollmentId: string, amount: number, returnUrl: string): string {
  const params = new URLSearchParams({
    service_id: env.CLICK_SERVICE_ID as string,
    merchant_id: env.CLICK_MERCHANT_ID as string,
    amount: amount.toFixed(2),
    transaction_param: enrollmentId,
    return_url: returnUrl,
  });
  return `https://my.click.uz/services/pay?${params.toString()}`;
}

function verifySign(p: ClickParams, isComplete: boolean): boolean {
  const parts = isComplete
    ? [p.click_trans_id, p.service_id, env.CLICK_SECRET_KEY, p.merchant_trans_id, p.merchant_prepare_id ?? '', p.amount, p.action, p.sign_time]
    : [p.click_trans_id, p.service_id, env.CLICK_SECRET_KEY, p.merchant_trans_id, p.amount, p.action, p.sign_time];
  const expected = crypto.createHash('md5').update(parts.join('')).digest('hex');
  return expected === p.sign_string;
}

function amountsMatch(a: string, b: unknown): boolean {
  return Math.abs(Number(a) - Number(b)) < 0.01;
}

interface ClickResponse {
  click_trans_id: number;
  merchant_trans_id: string;
  merchant_prepare_id?: number;
  merchant_confirm_id?: number;
  error: number;
  error_note: string;
}

export async function handlePrepare(p: ClickParams): Promise<ClickResponse> {
  const base = { click_trans_id: Number(p.click_trans_id), merchant_trans_id: p.merchant_trans_id };

  if (p.service_id !== env.CLICK_SERVICE_ID) {
    return { ...base, error: CLICK_ERROR.BAD_REQUEST, error_note: "Noto'g'ri service_id" };
  }
  if (!verifySign(p, false)) {
    return { ...base, error: CLICK_ERROR.SIGN_FAILED, error_note: "Imzo mos kelmadi" };
  }

  const enrollment = await prisma.enrollment.findUnique({ where: { id: p.merchant_trans_id }, include: { course: true } });
  if (!enrollment) {
    return { ...base, error: CLICK_ERROR.ORDER_NOT_FOUND, error_note: 'Buyurtma topilmadi' };
  }
  if (enrollment.paymentStatus === 'PAID') {
    return { ...base, error: CLICK_ERROR.ALREADY_PAID, error_note: 'Allaqachon to\'langan' };
  }
  if (!amountsMatch(p.amount, enrollment.course.price)) {
    return { ...base, error: CLICK_ERROR.WRONG_AMOUNT, error_note: "Summa mos kelmadi" };
  }

  // Idempotent: Click Prepare'ni qayta yuborishi mumkin — mavjud bo'lsa qayta yaratilmaydi
  const existing = await prisma.paymentTransaction.findUnique({
    where: { provider_providerTxId: { provider: 'CLICK', providerTxId: p.click_trans_id } },
  });
  if (!existing) {
    await prisma.paymentTransaction.create({
      data: {
        provider: 'CLICK',
        providerTxId: p.click_trans_id,
        enrollmentId: enrollment.id,
        amount: enrollment.course.price ?? 0,
        state: 'CREATED',
      },
    });
  }

  return { ...base, merchant_prepare_id: Number(p.click_trans_id), error: CLICK_ERROR.SUCCESS, error_note: 'Success' };
}

export async function handleComplete(p: ClickParams): Promise<ClickResponse> {
  const base = { click_trans_id: Number(p.click_trans_id), merchant_trans_id: p.merchant_trans_id };

  if (p.service_id !== env.CLICK_SERVICE_ID) {
    return { ...base, error: CLICK_ERROR.BAD_REQUEST, error_note: "Noto'g'ri service_id" };
  }
  if (!verifySign(p, true)) {
    return { ...base, error: CLICK_ERROR.SIGN_FAILED, error_note: "Imzo mos kelmadi" };
  }

  const tx = await prisma.paymentTransaction.findUnique({
    where: { provider_providerTxId: { provider: 'CLICK', providerTxId: p.click_trans_id } },
  });
  if (!tx || tx.enrollmentId !== p.merchant_trans_id) {
    return { ...base, error: CLICK_ERROR.TRANSACTION_NOT_FOUND, error_note: 'Tranzaksiya topilmadi' };
  }

  // Click o'zi xato/bekor qilinganini bildirsa — bizda ham bekor qilamiz
  if (Number(p.error ?? 0) < 0) {
    if (tx.state !== 'CANCELLED' && tx.state !== 'CANCELLED_AFTER_PERFORM') {
      await prisma.paymentTransaction.update({
        where: { id: tx.id },
        data: { state: tx.state === 'PERFORMED' ? 'CANCELLED_AFTER_PERFORM' : 'CANCELLED', cancelTime: new Date() },
      });
      await cancelEnrollmentPayment(tx.enrollmentId);
    }
    return { ...base, merchant_confirm_id: Number(p.click_trans_id), error: CLICK_ERROR.TRANSACTION_CANCELLED, error_note: 'Tranzaksiya bekor qilingan' };
  }

  if (tx.state === 'PERFORMED') {
    // Idempotent — Complete qayta yuborilishi mumkin
    return { ...base, merchant_confirm_id: Number(p.click_trans_id), error: CLICK_ERROR.SUCCESS, error_note: 'Success' };
  }

  if (!amountsMatch(p.amount, tx.amount)) {
    return { ...base, error: CLICK_ERROR.WRONG_AMOUNT, error_note: "Summa mos kelmadi" };
  }

  await prisma.paymentTransaction.update({ where: { id: tx.id }, data: { state: 'PERFORMED', performTime: new Date() } });
  await confirmEnrollmentPayment(tx.enrollmentId, {
    provider: 'click',
    providerRef: p.click_trans_id,
    amount: tx.amount,
  });

  return { ...base, merchant_confirm_id: Number(p.click_trans_id), error: CLICK_ERROR.SUCCESS, error_note: 'Success' };
}

export { buildCheckoutUrl as buildClickCheckoutUrl };
export type { ClickParams };
