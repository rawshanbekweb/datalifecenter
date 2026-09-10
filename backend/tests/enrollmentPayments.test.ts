import { beforeAll, afterAll, describe, expect, it } from 'vitest';
import { prisma, resetDb, createUser, loginAgent } from './helpers';

/**
 * To'lov daftari va qarz hisobi.
 *
 * Bu yerdagi tekshiruvlarning maqsadi bitta: yozilishning `amountPaid` va
 * `paymentStatus` ustunlari HAR DOIM daftardagi yig'indidan kelib chiqsin.
 * Ilgari ular bir necha joyda alohida yozilardi va asta-sekin ajralib
 * ketardi — shuning uchun har bir yo'l (qabul, qo'lda qo'shish, o'chirish,
 * "to'landi" deb belgilash) shu yerda alohida qamrab olingan.
 */

let admin: Awaited<ReturnType<typeof loginAgent>>;
let seq = 0;

async function createCourse(fields: Record<string, unknown>): Promise<{ id: string; slug: string }> {
  seq += 1;
  const res = await admin
    .post('/api/courses')
    .send({
      title: { uz: `To'lov testi ${seq}` },
      description: { uz: "To'lov daftari testi uchun kurs" },
      durationMonths: 3,
      published: true,
      ...fields,
    })
    .expect(201);
  return { id: res.body.data.id, slug: res.body.data.slug };
}

async function newStudent(name = 'Talaba'): Promise<Awaited<ReturnType<typeof loginAgent>>> {
  seq += 1;
  // Emaili tasdiqlangan: kurs so'rovi faqat shunday hisobdan qabul qilinadi
  const user = await createUser(`pay-${seq}@test.uz`, 'STUDENT', name, true);
  return loginAgent(user.email);
}

/** So'rov yuborib, uni admin tasdiqlaydi — kerak bo'lsa qisman to'lov bilan */
async function enroll(
  student: Awaited<ReturnType<typeof loginAgent>>,
  courseId: string,
  options: { format?: 'ONLINE' | 'OFFLINE'; paidAmount?: number } = {},
): Promise<string> {
  const format = options.format ?? 'OFFLINE';
  const created = await student
    .post('/api/course-requests')
    .send({ courseId, format, name: 'Talaba', phone: '+998901112233', email: 'talaba@test.uz' })
    .expect(201);
  await admin
    .post(`/api/course-requests/${created.body.data.id}/enroll`)
    .send(options.paidAmount === undefined ? {} : { paidAmount: options.paidAmount })
    .expect(200);
  // Bir kursda bir nechta o'quvchi bo'lishi mumkin — yozilish so'rov egasi
  // bo'yicha topiladi, aks holda test qo'shnining daftarini tekshirib qo'yardi
  const enrollment = await prisma.enrollment.findFirstOrThrow({
    where: { courseId, userId: created.body.data.userId },
    select: { id: true },
  });
  return enrollment.id;
}

async function summaryOf(enrollmentId: string): Promise<Record<string, string>> {
  const res = await admin.get(`/api/enrollments/${enrollmentId}/payments`).expect(200);
  return res.body.data.summary;
}

beforeAll(async () => {
  await resetDb();
  await createUser('admin@test.uz', 'ADMIN');
  admin = await loginAgent('admin@test.uz');
});

afterAll(async () => {
  await prisma.$disconnect();
});

describe("To'lov daftari", () => {
  it("offline yozilishda kelishilgan summa offline narx bo'ladi", async () => {
    const course = await createCourse({ format: 'OFFLINE', price: 1000000, offlinePrice: 1200000, offlineSeats: 10 });
    const student = await newStudent();
    const enrollmentId = await enroll(student, course.id, { paidAmount: 400000 });

    const summary = await summaryOf(enrollmentId);
    expect(Number(summary.agreed)).toBe(1200000);
    expect(Number(summary.paid)).toBe(400000);
    expect(Number(summary.debt)).toBe(800000);
    expect(summary.paymentStatus).toBe('PARTIAL');
  });

  it("qo'shilgan to'lov qarzni kamaytiradi, o'chirilgani qaytaradi", async () => {
    const course = await createCourse({ format: 'OFFLINE', price: 1000000, offlineSeats: 10 });
    const student = await newStudent();
    const enrollmentId = await enroll(student, course.id, { paidAmount: 0 });

    expect(Number((await summaryOf(enrollmentId)).paid)).toBe(0);
    expect((await summaryOf(enrollmentId)).paymentStatus).toBe('UNPAID');

    const added = await admin
      .post(`/api/enrollments/${enrollmentId}/payments`)
      .send({ amount: 300000, method: 'CASH', note: 'Birinchi bo\'lib' })
      .expect(201);
    expect(Number(added.body.data.summary.debt)).toBe(700000);
    expect(added.body.data.summary.paymentStatus).toBe('PARTIAL');

    const del = await admin
      .delete(`/api/enrollments/${enrollmentId}/payments/${added.body.data.payment.id}`)
      .expect(200);
    expect(Number(del.body.data.paid)).toBe(0);
    expect(del.body.data.paymentStatus).toBe('UNPAID');
  });

  it("to'liq to'langanda holat PAID bo'ladi", async () => {
    const course = await createCourse({ format: 'OFFLINE', price: 500000, offlineSeats: 10 });
    const student = await newStudent();
    const enrollmentId = await enroll(student, course.id, { paidAmount: 200000 });

    await admin.post(`/api/enrollments/${enrollmentId}/payments`).send({ amount: 300000 }).expect(201);
    const summary = await summaryOf(enrollmentId);
    expect(Number(summary.debt)).toBe(0);
    expect(summary.paymentStatus).toBe('PAID');
  });

  it("'to'landi' deb belgilash faqat QOLGAN qarzni yozadi", async () => {
    const course = await createCourse({ format: 'OFFLINE', price: 900000, offlineSeats: 10 });
    const student = await newStudent();
    const enrollmentId = await enroll(student, course.id, { paidAmount: 400000 });

    await admin.patch(`/api/enrollments/${enrollmentId}`).send({ paymentStatus: 'PAID' }).expect(200);

    const res = await admin.get(`/api/enrollments/${enrollmentId}/payments`).expect(200);
    // 400 000 ikkinchi marta qo'shilib ketmasligi kerak
    expect(Number(res.body.data.summary.paid)).toBe(900000);
    expect(res.body.data.summary.paymentStatus).toBe('PAID');
    expect(res.body.data.payments).toHaveLength(2);
  });

  it('noldan katta bo\'lmagan summa qabul qilinmaydi', async () => {
    const course = await createCourse({ format: 'OFFLINE', price: 500000, offlineSeats: 10 });
    const student = await newStudent();
    const enrollmentId = await enroll(student, course.id, { paidAmount: 0 });

    await admin.post(`/api/enrollments/${enrollmentId}/payments`).send({ amount: 0 }).expect(400);
    await admin.post(`/api/enrollments/${enrollmentId}/payments`).send({ amount: -5000 }).expect(400);
  });

  it("boshqa yozilishning to'lovi shu manzil orqali o'chirilmaydi", async () => {
    const course = await createCourse({ format: 'OFFLINE', price: 500000, offlineSeats: 10 });
    const other = await createCourse({ format: 'OFFLINE', price: 500000, offlineSeats: 10 });
    const enrollmentId = await enroll(await newStudent(), course.id, { paidAmount: 100000 });
    const otherId = await enroll(await newStudent(), other.id, { paidAmount: 0 });

    const payment = await prisma.enrollmentPayment.findFirstOrThrow({ where: { enrollmentId } });
    await admin.delete(`/api/enrollments/${otherId}/payments/${payment.id}`).expect(404);
    expect(Number((await summaryOf(enrollmentId)).paid)).toBe(100000);
  });
});

describe("To'lov daftariga kirish huquqi", () => {
  it("o'quvchi o'z daftarini ko'radi, lekin kim qabul qilganini emas", async () => {
    const course = await createCourse({ format: 'OFFLINE', price: 500000, offlineSeats: 10 });
    const student = await newStudent();
    const enrollmentId = await enroll(student, course.id, { paidAmount: 0 });
    await admin.post(`/api/enrollments/${enrollmentId}/payments`).send({ amount: 150000 }).expect(201);

    const res = await student.get(`/api/enrollments/${enrollmentId}/payments`).expect(200);
    expect(Number(res.body.data.summary.debt)).toBe(350000);
    expect(res.body.data.payments).toHaveLength(1);
    expect(res.body.data.payments[0].recordedBy).toBeUndefined();
  });

  it("begona o'quvchiga daftar ko'rinmaydi", async () => {
    const course = await createCourse({ format: 'OFFLINE', price: 500000, offlineSeats: 10 });
    const enrollmentId = await enroll(await newStudent(), course.id, { paidAmount: 0 });

    const stranger = await newStudent('Begona');
    await stranger.get(`/api/enrollments/${enrollmentId}/payments`).expect(404);
  });

  it("o'quvchi daftarga o'zi yoza olmaydi", async () => {
    const course = await createCourse({ format: 'OFFLINE', price: 500000, offlineSeats: 10 });
    const student = await newStudent();
    const enrollmentId = await enroll(student, course.id, { paidAmount: 0 });

    await student.post(`/api/enrollments/${enrollmentId}/payments`).send({ amount: 500000 }).expect(403);
    expect(Number((await summaryOf(enrollmentId)).paid)).toBe(0);
  });
});

describe('Qarzdorlar', () => {
  it("faqat qarzi borlar chiqadi va jami qarz to'g'ri yig'iladi", async () => {
    const course = await createCourse({ format: 'OFFLINE', price: 1000000, offlineSeats: 10 });
    const debtor = await newStudent('Qarzdor Talaba');
    const payer = await newStudent("To'lagan Talaba");

    await enroll(debtor, course.id, { paidAmount: 300000 });
    // Ikkinchi o'quvchi to'liq to'laydi — ro'yxatda bo'lmasligi kerak
    await enroll(payer, course.id, { paidAmount: 1000000 });

    const res = await admin.get(`/api/enrollments/debtors?courseId=${course.id}`).expect(200);
    expect(res.body.data.count).toBe(1);
    expect(res.body.data.items[0].user.name).toBe('Qarzdor Talaba');
    expect(Number(res.body.data.items[0].debt)).toBe(700000);
    expect(Number(res.body.data.totalDebt)).toBe(700000);
  });

  it('bepul kurs qarzdorlar ro\'yxatiga tushmaydi', async () => {
    const course = await createCourse({ format: 'OFFLINE', isFree: true, price: 0, offlineSeats: 10 });
    await enroll(await newStudent(), course.id);

    const res = await admin.get(`/api/enrollments/debtors?courseId=${course.id}`).expect(200);
    expect(res.body.data.count).toBe(0);
    expect(Number(res.body.data.totalDebt)).toBe(0);
  });

  it('ism bo\'yicha qidiriladi', async () => {
    const course = await createCourse({ format: 'OFFLINE', price: 800000, offlineSeats: 10 });
    await enroll(await newStudent('Aziz Qarzdor'), course.id, { paidAmount: 100000 });

    const hit = await admin.get(`/api/enrollments/debtors?courseId=${course.id}&search=aziz`).expect(200);
    expect(hit.body.data.count).toBe(1);

    const miss = await admin.get(`/api/enrollments/debtors?courseId=${course.id}&search=zzz`).expect(200);
    expect(miss.body.data.count).toBe(0);
  });

  it("o'quvchi qarzdorlar ro'yxatini ko'ra olmaydi", async () => {
    const student = await newStudent();
    await student.get('/api/enrollments/debtors').expect(403);
  });
});
