import { beforeAll, afterAll, describe, expect, it } from 'vitest';
import request from 'supertest';
import { app, prisma, resetDb, createUser, loginAgent } from './helpers';

let admin: Awaited<ReturnType<typeof loginAgent>>;
let student: Awaited<ReturnType<typeof loginAgent>>;
let studentId: string;

async function publishCourse(title: string): Promise<string> {
  const res = await admin
    .post('/api/courses')
    .send({ title: `${title} ${Date.now()}-${Math.random()}`, description: "Obuna testi uchun kurs", durationMonths: 1, price: 100000, published: true })
    .expect(201);
  return res.body.data.id;
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

describe('Obuna (subscription) tizimi', () => {
  it("obuna yaratish -> admin tasdiqlashi -> barcha nashr qilingan kurslarga Enrollment avtomatik yaratiladi", async () => {
    const courseA = await publishCourse('Obuna kurs A');
    const courseB = await publishCourse('Obuna kurs B');

    const created = await student.post('/api/subscriptions').expect(201);
    expect(created.body.data.status).toBe('PENDING');
    const subscriptionId = created.body.data.id;

    const activated = await admin.patch(`/api/subscriptions/${subscriptionId}`).send({ status: 'ACTIVE' }).expect(200);
    expect(activated.body.data.status).toBe('ACTIVE');
    expect(activated.body.data.expiresAt).toBeTruthy();

    const enrollmentA = await prisma.enrollment.findUnique({ where: { userId_courseId: { userId: studentId, courseId: courseA } } });
    const enrollmentB = await prisma.enrollment.findUnique({ where: { userId_courseId: { userId: studentId, courseId: courseB } } });
    expect(enrollmentA?.status).toBe('ACTIVE');
    expect(enrollmentA?.provider).toBe('subscription');
    expect(enrollmentB?.status).toBe('ACTIVE');
    expect(enrollmentB?.provider).toBe('subscription');
  });

  it("obuna faolligida yangi nashr qilingan kursga birinchi kirishda lazy-provision qilinadi", async () => {
    // Yuqoridagi testdan keyin student'ning obunasi hali faol
    const newCourse = await admin
      .post('/api/courses')
      .send({ title: `Keyin nashr qilingan ${Date.now()}`, description: 'Lazy provisioning testi', durationMonths: 1, price: 50000, published: true })
      .expect(201);
    const slug = newCourse.body.data.slug;

    const res = await student.get(`/api/courses/${slug}/learn`).expect(200);
    expect(res.body.data.enrollment.status).toBe('ACTIVE');
    expect(res.body.data.enrollment.provider).toBe('subscription');
  });

  it("obuna muddati tugagan bo'lsa tugallanmagan kursga kirish 403 SUBSCRIPTION_EXPIRED qaytaradi, tugallangan kursga esa hamon kirish bor", async () => {
    const expiredStudent = await createUser(`expired-${Date.now()}@test.uz`, 'STUDENT');
    const expiredAgent = await loginAgent(expiredStudent.email);

    const activeCourse = await publishCourse('Muddati tugagan obuna - faol kurs');
    const completedCourse = await publishCourse('Muddati tugagan obuna - tugallangan kurs');

    const sub = await prisma.subscription.create({
      data: { userId: expiredStudent.id, status: 'ACTIVE', startsAt: new Date(Date.now() - 60 * 24 * 3600 * 1000), expiresAt: new Date(Date.now() - 24 * 3600 * 1000) },
    });
    expect(sub.status).toBe('ACTIVE');

    await prisma.enrollment.create({
      data: { userId: expiredStudent.id, courseId: activeCourse, status: 'ACTIVE', paymentStatus: 'FREE', provider: 'subscription' },
    });
    await prisma.enrollment.create({
      data: { userId: expiredStudent.id, courseId: completedCourse, status: 'COMPLETED', paymentStatus: 'FREE', provider: 'subscription', completedAt: new Date() },
    });

    const activeCourseSlug = (await prisma.course.findUniqueOrThrow({ where: { id: activeCourse } })).slug;
    const completedCourseSlug = (await prisma.course.findUniqueOrThrow({ where: { id: completedCourse } })).slug;

    const blocked = await expiredAgent.get(`/api/courses/${activeCourseSlug}/learn`).expect(403);
    expect(blocked.body.error.code).toBe('SUBSCRIPTION_EXPIRED');

    await expiredAgent.get(`/api/courses/${completedCourseSlug}/learn`).expect(200);
  });

  it("faol yoki kutilayotgan obuna bor bo'lsa yangi obuna yaratib bo'lmaydi (ALREADY_SUBSCRIBED)", async () => {
    const res = await student.post('/api/subscriptions').expect(409);
    expect(res.body.error.code).toBe('ALREADY_SUBSCRIBED');
  });

  it("obunasi (va to'lov tranzaksiyasi) bor foydalanuvchini admin o'chira oladi (FK RESTRICT'ga qaramay)", async () => {
    const doomedStudent = await createUser(`doomed-${Date.now()}@test.uz`, 'STUDENT');
    const doomedAgent = await loginAgent(doomedStudent.email);

    const created = await doomedAgent.post('/api/subscriptions').expect(201);
    await admin.patch(`/api/subscriptions/${created.body.data.id}`).send({ status: 'ACTIVE' }).expect(200);

    await admin.delete(`/api/users/${doomedStudent.id}`).expect(200);
    expect(await prisma.user.findUnique({ where: { id: doomedStudent.id } })).toBeNull();
  });
});

describe('Click/Payme orqali obuna to\'lovi', () => {
  it("Payme CreateTransaction+PerformTransaction 'sub_' buyurtmasi bilan obunani faollashtiradi", async () => {
    const freshStudent = await createUser(`sub-payme-${Date.now()}@test.uz`, 'STUDENT');
    const freshAgent = await loginAgent(freshStudent.email);

    const created = await freshAgent.post('/api/subscriptions').expect(201);
    const subscriptionId = created.body.data.id;

    const PAYME_SECRET_KEY = 'test-payme-secret';
    const authHeader = `Basic ${Buffer.from(`Paycom:${PAYME_SECRET_KEY}`).toString('base64')}`;
    const paymeTxId = `sub-payme-${Date.now()}`;

    const plan = await request(app).get('/api/site-settings').expect(200);
    const price = (plan.body.data.subscription_plan?.price as number | undefined) ?? 99000;

    const createRes = await request(app)
      .post('/api/payments/payme')
      .set('Authorization', authHeader)
      .send({ method: 'CreateTransaction', params: { id: paymeTxId, time: Date.now(), amount: Math.round(price * 100), account: { order_id: `sub_${subscriptionId}` } }, id: 1 });
    expect(createRes.body.result.state).toBe(1);

    const performRes = await request(app)
      .post('/api/payments/payme')
      .set('Authorization', authHeader)
      .send({ method: 'PerformTransaction', params: { id: paymeTxId }, id: 2 });
    expect(performRes.body.result.state).toBe(2);

    const subscription = await prisma.subscription.findUnique({ where: { id: subscriptionId } });
    expect(subscription?.status).toBe('ACTIVE');
    expect(subscription?.provider).toBe('payme');
  });
});
