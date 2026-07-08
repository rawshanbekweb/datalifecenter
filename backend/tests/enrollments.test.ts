import { beforeAll, afterAll, describe, expect, it } from 'vitest';
import { app, prisma, resetDb, createUser, loginAgent } from './helpers';
import request from 'supertest';

let admin: Awaited<ReturnType<typeof loginAgent>>;
let student: Awaited<ReturnType<typeof loginAgent>>;
let courseId: string;
let courseSlug: string;
let lessonIds: string[] = [];
let enrollmentId: string;

beforeAll(async () => {
  await resetDb();
  await createUser('admin@test.uz', 'ADMIN');
  await createUser('student@test.uz', 'STUDENT');
  admin = await loginAgent('admin@test.uz');
  student = await loginAgent('student@test.uz');

  // Pullik, published kurs + 2 darsli dastur
  const course = await admin
    .post('/api/courses')
    .send({ title: 'Pullik Kurs', description: 'Enrollment oqimi testi uchun', durationMonths: 2, price: 1000000, published: true })
    .expect(201);
  courseId = course.body.data.id;
  courseSlug = course.body.data.slug;

  const mod = await admin.post('/api/modules').send({ courseId, title: 'Modul' }).expect(201);
  for (const title of ['1-dars', '2-dars']) {
    const lesson = await admin
      .post(`/api/modules/${mod.body.data.id}/lessons`)
      .send({ title, contentType: 'TEXT', content: 'Matn' })
      .expect(201);
    lessonIds.push(lesson.body.data.id);
  }
});

afterAll(async () => {
  await prisma.$disconnect();
});

describe("Enrollment oqimi: yozilish → chek → tasdiqlash → progress → sertifikat", () => {
  it("student pullik kursga yoziladi — PENDING/UNPAID bo'ladi", async () => {
    const res = await student.post('/api/enrollments').send({ courseId }).expect(201);
    enrollmentId = res.body.data.id;
    expect(res.body.data.status).toBe('PENDING');
    expect(res.body.data.paymentStatus).toBe('UNPAID');
  });

  it('qayta yozilish 409', async () => {
    const res = await student.post('/api/enrollments').send({ courseId }).expect(409);
    expect(res.body.error.code).toBe('ALREADY_ENROLLED');
  });

  it("PENDING holatda learn yopiq (403)", async () => {
    const res = await student.get(`/api/courses/${courseSlug}/learn`).expect(403);
    expect(res.body.error.code).toBe('ENROLLMENT_PENDING');
  });

  it('student chek yuklaydi — paymentStatus PENDING', async () => {
    const res = await student
      .post(`/api/enrollments/${enrollmentId}/receipt`)
      .send({ receiptUrl: 'https://example.com/receipt.jpg' })
      .expect(200);
    expect(res.body.data.paymentStatus).toBe('PENDING');
  });

  it("boshqa student chekni yuklay olmaydi (404)", async () => {
    await createUser('boshqa@test.uz', 'STUDENT');
    const boshqa = await loginAgent('boshqa@test.uz');
    await boshqa
      .post(`/api/enrollments/${enrollmentId}/receipt`)
      .send({ receiptUrl: 'https://example.com/hack.jpg' })
      .expect(404);
  });

  it("admin to'lovni tasdiqlaydi — enrollment ACTIVE bo'ladi, talabaga bildirishnoma tushadi", async () => {
    const res = await admin
      .patch(`/api/enrollments/${enrollmentId}`)
      .send({ paymentStatus: 'PAID' })
      .expect(200);
    expect(res.body.data.status).toBe('ACTIVE');
    expect(res.body.data.paymentStatus).toBe('PAID');

    const notif = await student.get('/api/notifications').expect(200);
    expect(notif.body.data.items.some((n: { type: string }) => n.type === 'ENROLLMENT_ACTIVATED')).toBe(true);
  });

  it("student enrollmentni admin sifatida o'zgartira olmaydi (403)", async () => {
    await student.patch(`/api/enrollments/${enrollmentId}`).send({ paymentStatus: 'REFUNDED' }).expect(403);
  });

  it('ACTIVE holatda learn ochiq', async () => {
    const res = await student.get(`/api/courses/${courseSlug}/learn`).expect(200);
    expect(res.body.data.course.modules[0].lessons).toHaveLength(2);
  });

  it('sertifikat kurs tugamaguncha berilmaydi (409)', async () => {
    const res = await student.get(`/api/enrollments/${enrollmentId}/certificate`).expect(409);
    expect(res.body.error.code).toBe('NOT_COMPLETED');
  });

  it("barcha darslar tugagach kurs avtomatik COMPLETED bo'ladi", async () => {
    await student.post(`/api/progress/lessons/${lessonIds[0]}/complete`).expect(200);
    const res = await student.post(`/api/progress/lessons/${lessonIds[1]}/complete`).expect(200);
    expect(res.body.data.courseCompleted).toBe(true);
    expect(res.body.data.enrollmentStatus).toBe('COMPLETED');
  });

  it('sertifikat PDF qaytadi', async () => {
    const res = await student.get(`/api/enrollments/${enrollmentId}/certificate`).expect(200);
    expect(res.headers['content-type']).toContain('application/pdf');
  });

  it("sertifikat ochiq tekshiruvdan o'tadi (login talab qilinmaydi)", async () => {
    const certNo = `DL-${enrollmentId.slice(-8).toUpperCase()}`;
    const res = await request(app).get(`/api/certificates/${certNo}/verify`).expect(200);
    expect(res.body.data.courseTitle).toBe('Pullik Kurs');
    expect(res.body.data.certificateNo).toBe(certNo);

    await request(app).get('/api/certificates/DL-YOQYOQ11/verify').expect(404);
  });

  it("dars bekor qilinsa kurs ACTIVE'ga qaytadi", async () => {
    const res = await student.delete(`/api/progress/lessons/${lessonIds[1]}/complete`).expect(200);
    expect(res.body.data.enrollmentStatus).toBe('ACTIVE');
  });

  it("mock-pay production'dan tashqarida ham test rejimida ishlaydi, CSRF yomon origin'ni bloklaydi", async () => {
    // CSRF: ruxsatsiz Origin bilan holat o'zgartiruvchi so'rov 403
    const res = await request(app)
      .post('/api/enrollments')
      .set('Origin', 'https://evil.example.com')
      .send({ courseId })
      .expect(403);
    expect(res.body.error.code).toBe('CSRF_ORIGIN_REJECTED');
  });
});
