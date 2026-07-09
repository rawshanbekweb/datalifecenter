import crypto from 'crypto';
import { beforeAll, afterAll, describe, expect, it } from 'vitest';
import request from 'supertest';
import { app, prisma, resetDb, createUser, loginAgent } from './helpers';

const CLICK_SERVICE_ID = 'test-click-service';
const CLICK_SECRET_KEY = 'test-click-secret';
const PAYME_SECRET_KEY = 'test-payme-secret';

function orderId(enrollmentId: string): string {
  return `enr_${enrollmentId}`;
}

function clickSign(parts: (string | number)[]): string {
  return crypto.createHash('md5').update(parts.join('')).digest('hex');
}

function paymeAuthHeader(): string {
  return `Basic ${Buffer.from(`Paycom:${PAYME_SECRET_KEY}`).toString('base64')}`;
}

async function paymeRpc(method: string, params: Record<string, unknown>, id = 1, auth = paymeAuthHeader()) {
  return request(app).post('/api/payments/payme').set('Authorization', auth).send({ method, params, id });
}

let admin: Awaited<ReturnType<typeof loginAgent>>;
let student: Awaited<ReturnType<typeof loginAgent>>;
let studentId: string;
const PRICE = 500000;

async function createPendingEnrollment(): Promise<string> {
  const course = await admin
    .post('/api/courses')
    .send({ title: { uz: `To'lov testi ${Date.now()}-${Math.random()}` }, description: { uz: "To'lov shlyuzi testi uchun kurs" }, durationMonths: 1, price: PRICE, published: true })
    .expect(201);
  const enrollment = await student.post('/api/enrollments').send({ courseId: course.body.data.id }).expect(201);
  expect(enrollment.body.data.status).toBe('PENDING');
  expect(enrollment.body.data.paymentStatus).toBe('UNPAID');
  return enrollment.body.data.id;
}

beforeAll(async () => {
  await resetDb();
  await createUser('admin@test.uz', 'ADMIN');
  const studentUser = await createUser('student@test.uz', 'STUDENT');
  studentId = studentUser.id;
  admin = await loginAgent('admin@test.uz');
  student = await loginAgent('student@test.uz');
});

afterAll(async () => {
  await prisma.$disconnect();
});

describe('GET /api/payments/config', () => {
  it('test muhitida ikkalasi ham yoqilgan (test .env qiymatlari bilan)', async () => {
    const res = await request(app).get('/api/payments/config').expect(200);
    expect(res.body.data).toEqual({ click: true, payme: true });
  });
});

describe('Click to\'lov protokoli', () => {
  it("Prepare -> Complete baxtli yo'l: enrollment PAID/ACTIVE bo'ladi", async () => {
    const enrollmentId = await createPendingEnrollment();
    const clickTransId = String(Date.now());
    const signTime = '2026-01-01 10:00:00';
    const amount = PRICE.toFixed(2);

    const prepareSign = clickSign([clickTransId, CLICK_SERVICE_ID, CLICK_SECRET_KEY, orderId(enrollmentId), amount, '0', signTime]);
    const prepareRes = await request(app).post('/api/payments/click/prepare').type('form').send({
      click_trans_id: clickTransId,
      service_id: CLICK_SERVICE_ID,
      merchant_trans_id: orderId(enrollmentId),
      amount,
      action: '0',
      sign_time: signTime,
      sign_string: prepareSign,
    }).expect(200);
    expect(prepareRes.body.error).toBe(0);
    expect(prepareRes.body.merchant_prepare_id).toBe(Number(clickTransId));

    const completeSign = clickSign([clickTransId, CLICK_SERVICE_ID, CLICK_SECRET_KEY, orderId(enrollmentId), clickTransId, amount, '1', signTime]);
    const completeRes = await request(app).post('/api/payments/click/complete').type('form').send({
      click_trans_id: clickTransId,
      service_id: CLICK_SERVICE_ID,
      merchant_trans_id: orderId(enrollmentId),
      merchant_prepare_id: clickTransId,
      amount,
      action: '1',
      error: '0',
      sign_time: signTime,
      sign_string: completeSign,
    }).expect(200);
    expect(completeRes.body.error).toBe(0);

    const enrollment = await prisma.enrollment.findUnique({ where: { id: enrollmentId } });
    expect(enrollment?.status).toBe('ACTIVE');
    expect(enrollment?.paymentStatus).toBe('PAID');
    expect(enrollment?.provider).toBe('click');

    // Complete qayta yuborilsa (Click qayta so'rashi mumkin) — idempotent, hali ham error:0
    const completeAgain = await request(app).post('/api/payments/click/complete').type('form').send({
      click_trans_id: clickTransId,
      service_id: CLICK_SERVICE_ID,
      merchant_trans_id: orderId(enrollmentId),
      merchant_prepare_id: clickTransId,
      amount,
      action: '1',
      error: '0',
      sign_time: signTime,
      sign_string: completeSign,
    }).expect(200);
    expect(completeAgain.body.error).toBe(0);
  });

  it("noto'g'ri imzo bilan Prepare -1 qaytaradi", async () => {
    const enrollmentId = await createPendingEnrollment();
    const res = await request(app).post('/api/payments/click/prepare').type('form').send({
      click_trans_id: `click-${Date.now()}`,
      service_id: CLICK_SERVICE_ID,
      merchant_trans_id: orderId(enrollmentId),
      amount: PRICE.toFixed(2),
      action: '0',
      sign_time: '2026-01-01 10:00:00',
      sign_string: 'notogri-imzo',
    }).expect(200);
    expect(res.body.error).toBe(-1);
  });

  it("noto'g'ri summa bilan Prepare -2 qaytaradi", async () => {
    const enrollmentId = await createPendingEnrollment();
    const clickTransId = String(Date.now());
    const signTime = '2026-01-01 10:00:00';
    const wrongAmount = '1.00';
    const sign = clickSign([clickTransId, CLICK_SERVICE_ID, CLICK_SECRET_KEY, orderId(enrollmentId), wrongAmount, '0', signTime]);

    const res = await request(app).post('/api/payments/click/prepare').type('form').send({
      click_trans_id: clickTransId,
      service_id: CLICK_SERVICE_ID,
      merchant_trans_id: orderId(enrollmentId),
      amount: wrongAmount,
      action: '0',
      sign_time: signTime,
      sign_string: sign,
    }).expect(200);
    expect(res.body.error).toBe(-2);
  });
});

describe('Payme to\'lov protokoli (JSON-RPC)', () => {
  it("noto'g'ri Basic Auth bilan -32504 qaytaradi", async () => {
    const res = await paymeRpc('CheckPerformTransaction', { amount: 1, account: { order_id: 'x' } }, 1, 'Basic bm90b2ci');
    expect(res.body.error.code).toBe(-32504);
  });

  it('CheckPerformTransaction baxtli yo\'l', async () => {
    const enrollmentId = await createPendingEnrollment();
    const res = await paymeRpc('CheckPerformTransaction', { amount: PRICE * 100, account: { order_id: orderId(enrollmentId) } });
    expect(res.body.result).toEqual({ allow: true });
  });

  it("CreateTransaction -> PerformTransaction baxtli yo'l: enrollment PAID/ACTIVE bo'ladi", async () => {
    const enrollmentId = await createPendingEnrollment();
    const paymeTxId = `payme-${Date.now()}`;

    const created = await paymeRpc('CreateTransaction', {
      id: paymeTxId,
      time: Date.now(),
      amount: PRICE * 100,
      account: { order_id: orderId(enrollmentId) },
    });
    expect(created.body.result.state).toBe(1);

    const performed = await paymeRpc('PerformTransaction', { id: paymeTxId });
    expect(performed.body.result.state).toBe(2);

    const enrollment = await prisma.enrollment.findUnique({ where: { id: enrollmentId } });
    expect(enrollment?.status).toBe('ACTIVE');
    expect(enrollment?.paymentStatus).toBe('PAID');
    expect(enrollment?.provider).toBe('payme');

    const tx = await prisma.paymentTransaction.findUnique({
      where: { provider_providerTxId: { provider: 'PAYME', providerTxId: paymeTxId } },
    });
    expect(tx?.state).toBe('PERFORMED');
  });

  it("to'langan tranzaksiyani CancelTransaction qilish REFUNDED holatiga o'tkazadi", async () => {
    const enrollmentId = await createPendingEnrollment();
    const paymeTxId = `payme-${Date.now()}`;
    await paymeRpc('CreateTransaction', { id: paymeTxId, time: Date.now(), amount: PRICE * 100, account: { order_id: orderId(enrollmentId) } });
    await paymeRpc('PerformTransaction', { id: paymeTxId });

    const cancelled = await paymeRpc('CancelTransaction', { id: paymeTxId, reason: 5 });
    expect(cancelled.body.result.state).toBe(-2);

    const enrollment = await prisma.enrollment.findUnique({ where: { id: enrollmentId } });
    expect(enrollment?.paymentStatus).toBe('REFUNDED');
    expect(enrollment?.status).toBe('CANCELLED');
  });
});

describe('GET /api/enrollments/:id/receipt', () => {
  it('chek yuklamagan holatda 404', async () => {
    const enrollmentId = await createPendingEnrollment();
    await student.get(`/api/enrollments/${enrollmentId}/receipt`).expect(404);
  });

  it('boshqa talaba chek ko\'ra olmaydi (404 — mavjudligini ham oshkor qilmaslik uchun)', async () => {
    const enrollmentId = await createPendingEnrollment();
    // studentId egasi — receiptUrl'ni to'g'ridan-to'g'ri bazaga yozib qo'yamiz (fayl mavjudligi shart emas, faqat ruxsat tekshiruvi)
    await prisma.enrollment.update({ where: { id: enrollmentId }, data: { receiptUrl: 'https://example.com/fake-receipt.jpg' } });

    const otherUser = await createUser(`other-${Date.now()}@test.uz`, 'STUDENT');
    const other = await loginAgent(otherUser.email);
    await other.get(`/api/enrollments/${enrollmentId}/receipt`).expect(404);
  });

  it('anonim so\'rov 401 qaytaradi', async () => {
    const enrollmentId = await createPendingEnrollment();
    await request(app).get(`/api/enrollments/${enrollmentId}/receipt`).expect(401);
  });
});
