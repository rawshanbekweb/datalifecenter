import { beforeAll, afterAll, describe, expect, it } from 'vitest';
import request from 'supertest';
import { app, prisma, resetDb, createUser, loginAgent } from './helpers';

let admin: Awaited<ReturnType<typeof loginAgent>>;
let student: Awaited<ReturnType<typeof loginAgent>>;
let courseId: string;

beforeAll(async () => {
  await resetDb();
  await createUser('admin@test.uz', 'ADMIN');
  await createUser('student@test.uz', 'STUDENT');
  admin = await loginAgent('admin@test.uz');
  student = await loginAgent('student@test.uz');
});

afterAll(async () => {
  await prisma.$disconnect();
});

describe('Kurs CRUD', () => {
  it('admin kurs yaratadi (slug avtomatik)', async () => {
    const res = await admin
      .post('/api/courses')
      .send({ title: 'Test Kursi', description: 'Test tavsifi kamida besh belgi', durationMonths: 3, price: 0 })
      .expect(201);
    courseId = res.body.data.id;
    expect(res.body.data.slug).toBe('test-kursi');
    expect(res.body.data.isFree).toBe(true);
    expect(res.body.data.published).toBe(false);
  });

  it('student kurs yarata olmaydi (403)', async () => {
    await student
      .post('/api/courses')
      .send({ title: 'Ruxsatsiz', description: 'Bu yaratilmasligi kerak', durationMonths: 1 })
      .expect(403);
  });

  it('anonim foydalanuvchi kurs yarata olmaydi (401)', async () => {
    await request(app)
      .post('/api/courses')
      .send({ title: 'Anonim', description: 'Bu ham yaratilmasligi kerak', durationMonths: 1 })
      .expect(401);
  });

  it("published bo'lmagan kurs ochiq ro'yxatda ko'rinmaydi", async () => {
    const res = await request(app).get('/api/courses').expect(200);
    expect(res.body.data.items).toHaveLength(0);
  });

  it('admin kursni qisman yangilaydi — boshqa maydonlar buzilmaydi', async () => {
    await admin.put(`/api/courses/${courseId}`).send({ published: true }).expect(200);
    const res = await admin.put(`/api/courses/${courseId}`).send({ price: 500000 }).expect(200);
    // published qisman so'rovda false'ga qaytib ketmasligi kerak
    expect(res.body.data.published).toBe(true);
    expect(res.body.data.isFree).toBe(false);
  });

  it("published kurs ochiq ro'yxatda ko'rinadi va slug bilan ochiladi", async () => {
    const list = await request(app).get('/api/courses').expect(200);
    expect(list.body.data.items).toHaveLength(1);

    const detail = await request(app).get('/api/courses/test-kursi').expect(200);
    expect(detail.body.data.title).toBe('Test Kursi');
  });

  it('admin modul va dars yaratadi', async () => {
    const mod = await admin.post('/api/modules').send({ courseId, title: '1-modul' }).expect(201);
    const lesson = await admin
      .post(`/api/modules/${mod.body.data.id}/lessons`)
      .send({ title: '1-dars', contentType: 'TEXT', content: 'Dars matni' })
      .expect(201);
    expect(lesson.body.data.order).toBe(1);
  });

  it('student modul yarata olmaydi (403)', async () => {
    await student.post('/api/modules').send({ courseId, title: 'Ruxsatsiz modul' }).expect(403);
  });

  it("kursni o'chirish — talabalar yozilgan bo'lsa 409", async () => {
    const user = await prisma.user.findUnique({ where: { email: 'student@test.uz' } });
    await prisma.enrollment.create({ data: { userId: user!.id, courseId, status: 'ACTIVE', paymentStatus: 'PAID' } });

    const res = await admin.delete(`/api/courses/${courseId}`).expect(409);
    expect(res.body.error.code).toBe('COURSE_HAS_ENROLLMENTS');

    await prisma.enrollment.deleteMany({ where: { courseId } });
    await admin.delete(`/api/courses/${courseId}`).expect(200);
    await request(app).get('/api/courses/test-kursi').expect(404);
  });
});
