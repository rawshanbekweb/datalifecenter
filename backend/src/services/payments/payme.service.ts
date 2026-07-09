import { PaymentTxState } from '@prisma/client';
import { prisma } from '../../config/prisma';
import { env } from '../../config/env';
import { confirmEnrollmentPayment, cancelEnrollmentPayment } from '../enrollments.service';

// PAYME_MERCHANT_ID/PAYME_SECRET_KEY sozlanmasa checkout tugmasi frontendda ko'rinmaydi.
export const paymeEnabled = Boolean(env.PAYME_MERCHANT_ID && env.PAYME_SECRET_KEY);

// Payme rasmiy JSON-RPC xato kodlari
const PAYME_ERROR = {
  PARSE_ERROR: -32700,
  INVALID_REQUEST: -32600,
  METHOD_NOT_FOUND: -32601,
  INSUFFICIENT_PRIVILEGE: -32504,
  SYSTEM_ERROR: -31099,
  INCORRECT_AMOUNT: -31001,
  TRANSACTION_NOT_FOUND: -31003,
  UNABLE_TO_PERFORM: -31008,
  ORDER_NOT_FOUND: -31050,
} as const;

class PaymeError extends Error {
  code: number;
  data?: string;
  constructor(code: number, message: string, data?: string) {
    super(message);
    this.code = code;
    this.data = data;
  }
}

// Payme'da holat: 1=yaratilgan, 2=bajarilgan, -1=bekor (bajarilmasdan), -2=bekor (bajarilgandan keyin)
const STATE_TO_PAYME: Record<PaymentTxState, number> = {
  CREATED: 1,
  PERFORMED: 2,
  CANCELLED: -1,
  CANCELLED_AFTER_PERFORM: -2,
};

const TRANSACTION_TIMEOUT_MS = 12 * 60 * 60 * 1000; // Payme spec: 12 soatdan keyin CREATED tranzaksiya avtomatik bekor

function ms(d: Date | null | undefined): number {
  return d ? d.getTime() : 0;
}

export function verifyPaymeAuth(authHeader: string | undefined): boolean {
  if (!authHeader?.startsWith('Basic ')) return false;
  const decoded = Buffer.from(authHeader.slice(6), 'base64').toString('utf8');
  const [login, key] = decoded.split(':');
  return login === 'Paycom' && key === env.PAYME_SECRET_KEY;
}

export function buildPaymeCheckoutUrl(enrollmentId: string, amount: number): string {
  const params = `m=${env.PAYME_MERCHANT_ID};ac.order_id=${enrollmentId};a=${Math.round(amount * 100)}`;
  const encoded = Buffer.from(params).toString('base64');
  return `https://checkout.paycom.uz/${encoded}`;
}

async function findEnrollmentForOrder(orderId: string | undefined) {
  if (!orderId) throw new PaymeError(PAYME_ERROR.ORDER_NOT_FOUND, 'order_id kerak', 'order_id');
  const enrollment = await prisma.enrollment.findUnique({ where: { id: orderId }, include: { course: true } });
  if (!enrollment) throw new PaymeError(PAYME_ERROR.ORDER_NOT_FOUND, 'Buyurtma topilmadi', 'order_id');
  return enrollment;
}

function assertAmount(amountTiyin: number, price: unknown): void {
  const expected = Math.round(Number(price ?? 0) * 100);
  if (amountTiyin !== expected) {
    throw new PaymeError(PAYME_ERROR.INCORRECT_AMOUNT, "Summa mos kelmadi", 'amount');
  }
}

async function checkPerformTransaction(params: { amount: number; account?: { order_id?: string } }) {
  const enrollment = await findEnrollmentForOrder(params.account?.order_id);
  if (enrollment.paymentStatus === 'PAID') {
    throw new PaymeError(PAYME_ERROR.UNABLE_TO_PERFORM, "Buyurtma allaqachon to'langan");
  }
  assertAmount(params.amount, enrollment.course.price);
  return { allow: true };
}

async function createTransaction(params: { id: string; time: number; amount: number; account?: { order_id?: string } }) {
  const existing = await prisma.paymentTransaction.findUnique({
    where: { provider_providerTxId: { provider: 'PAYME', providerTxId: params.id } },
  });
  if (existing) {
    if (existing.state !== 'CREATED') {
      throw new PaymeError(PAYME_ERROR.UNABLE_TO_PERFORM, 'Tranzaksiya holati boshqa');
    }
    return { create_time: ms(existing.createTime), transaction: existing.id, state: STATE_TO_PAYME[existing.state] };
  }

  const enrollment = await findEnrollmentForOrder(params.account?.order_id);
  if (enrollment.paymentStatus === 'PAID') {
    throw new PaymeError(PAYME_ERROR.UNABLE_TO_PERFORM, "Buyurtma allaqachon to'langan");
  }
  assertAmount(params.amount, enrollment.course.price);

  // Shu buyurtma uchun boshqa faol (bekor qilinmagan) tranzaksiya bo'lmasligi kerak
  const otherActive = await prisma.paymentTransaction.findFirst({
    where: { enrollmentId: enrollment.id, provider: 'PAYME', state: { in: ['CREATED', 'PERFORMED'] }, providerTxId: { not: params.id } },
  });
  if (otherActive) {
    throw new PaymeError(PAYME_ERROR.UNABLE_TO_PERFORM, "Bu buyurtma uchun boshqa tranzaksiya faol");
  }

  const tx = await prisma.paymentTransaction.create({
    data: {
      provider: 'PAYME',
      providerTxId: params.id,
      enrollmentId: enrollment.id,
      amount: enrollment.course.price ?? 0,
      state: 'CREATED',
    },
  });
  return { create_time: ms(tx.createTime), transaction: tx.id, state: STATE_TO_PAYME.CREATED };
}

async function getTx(id: string) {
  const tx = await prisma.paymentTransaction.findUnique({
    where: { provider_providerTxId: { provider: 'PAYME', providerTxId: id } },
  });
  if (!tx) throw new PaymeError(PAYME_ERROR.TRANSACTION_NOT_FOUND, 'Tranzaksiya topilmadi');
  return tx;
}

async function performTransaction(params: { id: string }) {
  const tx = await getTx(params.id);

  if (tx.state === 'PERFORMED') {
    return { transaction: tx.id, perform_time: ms(tx.performTime), state: STATE_TO_PAYME.PERFORMED };
  }
  if (tx.state === 'CANCELLED' || tx.state === 'CANCELLED_AFTER_PERFORM') {
    throw new PaymeError(PAYME_ERROR.UNABLE_TO_PERFORM, 'Tranzaksiya bekor qilingan');
  }

  if (Date.now() - tx.createTime.getTime() > TRANSACTION_TIMEOUT_MS) {
    await prisma.paymentTransaction.update({ where: { id: tx.id }, data: { state: 'CANCELLED', cancelTime: new Date(), reason: 4 } });
    throw new PaymeError(PAYME_ERROR.UNABLE_TO_PERFORM, 'Tranzaksiya muddati tugagan');
  }

  const performTime = new Date();
  await prisma.paymentTransaction.update({ where: { id: tx.id }, data: { state: 'PERFORMED', performTime } });
  await confirmEnrollmentPayment(tx.enrollmentId, { provider: 'payme', providerRef: tx.providerTxId, amount: tx.amount });

  return { transaction: tx.id, perform_time: ms(performTime), state: STATE_TO_PAYME.PERFORMED };
}

async function cancelTransaction(params: { id: string; reason?: number }) {
  const tx = await getTx(params.id);

  if (tx.state === 'CANCELLED' || tx.state === 'CANCELLED_AFTER_PERFORM') {
    return { transaction: tx.id, cancel_time: ms(tx.cancelTime), state: STATE_TO_PAYME[tx.state] };
  }

  const wasPerformed = tx.state === 'PERFORMED';
  const cancelTime = new Date();
  const nextState: PaymentTxState = wasPerformed ? 'CANCELLED_AFTER_PERFORM' : 'CANCELLED';
  await prisma.paymentTransaction.update({
    where: { id: tx.id },
    data: { state: nextState, cancelTime, reason: params.reason ?? null },
  });
  if (wasPerformed) {
    await cancelEnrollmentPayment(tx.enrollmentId);
  }

  return { transaction: tx.id, cancel_time: ms(cancelTime), state: STATE_TO_PAYME[nextState] };
}

async function checkTransaction(params: { id: string }) {
  const tx = await getTx(params.id);
  return {
    create_time: ms(tx.createTime),
    perform_time: ms(tx.performTime),
    cancel_time: ms(tx.cancelTime),
    transaction: tx.id,
    state: STATE_TO_PAYME[tx.state],
    reason: tx.reason ?? null,
  };
}

async function getStatement(params: { from: number; to: number }) {
  const txs = await prisma.paymentTransaction.findMany({
    where: { provider: 'PAYME', createTime: { gte: new Date(params.from), lte: new Date(params.to) } },
    orderBy: { createTime: 'asc' },
  });
  return {
    transactions: txs.map((tx) => ({
      id: tx.providerTxId,
      time: ms(tx.createTime),
      amount: Math.round(Number(tx.amount) * 100),
      account: { order_id: tx.enrollmentId },
      create_time: ms(tx.createTime),
      perform_time: ms(tx.performTime),
      cancel_time: ms(tx.cancelTime),
      transaction: tx.id,
      state: STATE_TO_PAYME[tx.state],
      reason: tx.reason ?? null,
    })),
  };
}

const METHODS: Record<string, (params: any) => Promise<unknown>> = {
  CheckPerformTransaction: checkPerformTransaction,
  CreateTransaction: createTransaction,
  PerformTransaction: performTransaction,
  CancelTransaction: cancelTransaction,
  CheckTransaction: checkTransaction,
  GetStatement: getStatement,
};

export interface JsonRpcRequest {
  method: string;
  params: Record<string, unknown>;
  id: number | string | null;
}

export async function handleRpc(req: JsonRpcRequest): Promise<{ result?: unknown; error?: { code: number; message: string; data?: string }; id: number | string | null }> {
  const handler = METHODS[req.method];
  if (!handler) {
    return { error: { code: PAYME_ERROR.METHOD_NOT_FOUND, message: 'Metod topilmadi' }, id: req.id };
  }
  try {
    const result = await handler(req.params ?? {});
    return { result, id: req.id };
  } catch (err) {
    if (err instanceof PaymeError) {
      return { error: { code: err.code, message: err.message, data: err.data }, id: req.id };
    }
    console.error('Payme RPC xatosi:', err);
    return { error: { code: PAYME_ERROR.SYSTEM_ERROR, message: 'Tizim xatosi' }, id: req.id };
  }
}

export const PAYME_AUTH_ERROR = { code: PAYME_ERROR.INSUFFICIENT_PRIVILEGE, message: "Autentifikatsiya xatosi" };
