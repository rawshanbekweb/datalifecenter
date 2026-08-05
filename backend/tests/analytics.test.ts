import { beforeAll, afterAll, describe, expect, it } from 'vitest';
import request from 'supertest';
import { app, prisma, resetDb, createUser, loginAgent } from './helpers';

/**
 * Monitoring: kunlik kesim (`EngagementDaily`) jami hisoblagichlar bilan
 * BIR JOYDA yozilishi kerak. Agar ular ajralib ketsa, grafik saytdagi
 * raqamlarga mos kelmay qoladi — sinovlar aynan shu bog'lanishni ushlab turadi.
 */

let admin: Awaited<ReturnType<typeof loginAgent>>;
let student: Awaited<ReturnType<typeof loginAgent>>;
let courseId: string;

const DEVICE = 'test-device-analytics-1';

/** Bugungi kun kaliti — servisdagi UTC hisobi bilan bir xil */
function todayKey(): string {
  return new Date().toISOString().slice(0, 10);
}

beforeAll(async () => {
  await resetDb();
  await createUser('admin@an.uz', 'ADMIN');
  await createUser('student@an.uz', 'STUDENT');
  admin = await loginAgent('admin@an.uz');
  student = await loginAgent('student@an.uz');

  const course = await admin
    .post('/api/courses')
    .send({
      title: { uz: 'Monitoring Kursi' },
      description: { uz: 'Statistika oqimi testi' },
      durationMonths: 1,
      price: 0,
      published: true,
    })
    .expect(201);
  courseId = course.body.data.id;
});

afterAll(async () => {
  await prisma.$disconnect();
});

describe('Kunlik qiziqish statistikasi', () => {
  it("ko'rish va yoqtirish kunlik kesimga tushadi", async () => {
    await request(app).post(`/api/engagement/course/${courseId}/view`).set('X-Device-Id', DEVICE).expect(200);
    await request(app).post(`/api/engagement/course/${courseId}/like`).set('X-Device-Id', DEVICE).expect(200);

    const row = await prisma.engagementDaily.findFirst({ where: { contentType: 'COURSE', contentId: courseId } });
    expect(row?.views).toBe(1);
    expect(row?.likes).toBe(1);
  });

  it("takroriy ko'rish (bir qurilma, 24 soat ichida) kunlik kesimni oshirmaydi", async () => {
    await request(app).post(`/api/engagement/course/${courseId}/view`).set('X-Device-Id', DEVICE).expect(200);
    const row = await prisma.engagementDaily.findFirst({ where: { contentType: 'COURSE', contentId: courseId } });
    expect(row?.views).toBe(1);
  });

  it('yoqtirish olib tashlansa kunlik kesim SOF qiymatga tushadi', async () => {
    await request(app).post(`/api/engagement/course/${courseId}/like`).set('X-Device-Id', DEVICE).expect(200);
    const row = await prisma.engagementDaily.findFirst({ where: { contentType: 'COURSE', contentId: courseId } });
    expect(row?.likes).toBe(0);

    // Grafik uchun qayta yoqtiramiz
    await request(app).post(`/api/engagement/course/${courseId}/like`).set('X-Device-Id', DEVICE).expect(200);
  });
});

describe('Admin monitoring endpointi', () => {
  it('talaba monitoring raqamlarini ko\'ra olmaydi (403)', async () => {
    await student.get('/api/admin/analytics').expect(403);
  });

  it('anonim foydalanuvchi ham kira olmaydi (401)', async () => {
    await request(app).get('/api/admin/analytics').expect(401);
  });

  it('davr yig\'indisi va kunlik qator qaytadi', async () => {
    const res = await admin.get('/api/admin/analytics?days=30').expect(200);
    const data = res.body.data;

    expect(data.range.days).toBe(30);
    // Har kun uchun bitta nuqta — bo'sh kunlar ham nol bilan turadi
    expect(data.series).toHaveLength(30);
    expect(data.series[data.series.length - 1].day).toBe(todayKey());

    expect(data.totals.views).toBe(1);
    expect(data.totals.likes).toBe(1);
    // Testda ikkita foydalanuvchi yaratilgan
    expect(data.totals.users).toBe(2);
  });

  it("kontent turi bo'yicha taqsimot va top ro'yxat kurs sarlavhasini beradi", async () => {
    const res = await admin.get('/api/admin/analytics?days=7').expect(200);
    expect(res.body.data.byType).toEqual([{ type: 'COURSE', views: 1, likes: 1 }]);
    expect(res.body.data.topContent[0]).toMatchObject({
      id: courseId,
      type: 'COURSE',
      title: 'Monitoring Kursi',
      slug: 'monitoring-kursi',
      views: 1,
    });
  });

  it("ro'yxatdan tashqari davr 30 kunga tenglashtiriladi", async () => {
    const res = await admin.get('/api/admin/analytics?days=99999').expect(200);
    expect(res.body.data.range.days).toBe(30);
  });

  it("kontent o'chirilsa uning kunlik kesimi ham tozalanadi", async () => {
    await admin.delete(`/api/courses/${courseId}`).expect(200);
    const rows = await prisma.engagementDaily.count({ where: { contentId: courseId } });
    expect(rows).toBe(0);

    const res = await admin.get('/api/admin/analytics?days=7').expect(200);
    expect(res.body.data.topContent).toHaveLength(0);
  });
});
