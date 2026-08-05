import request from 'supertest';
import { beforeAll, afterAll, describe, expect, it } from 'vitest';
import { app, prisma, resetDb, createUser, loginAgent } from './helpers';

// Ochiq formalardan keladigan yozuvlarni tozalash: bittalab va ommaviy.
// Toshqin (spam yoki shunchaki gavjum kun) holatida admin ro'yxatni
// tartibga sola olishi kerak.

let adminAgent: Awaited<ReturnType<typeof loginAgent>>;
let studentAgent: Awaited<ReturnType<typeof loginAgent>>;
let studentId: string;

async function createMessages(n: number): Promise<string[]> {
  const ids: string[] = [];
  for (let i = 0; i < n; i += 1) {
    const res = await request(app)
      .post('/api/contact')
      .send({ name: `Mehmon ${i}`, email: `guest${i}@test.uz`, message: 'Salom, kurslar haqida' })
      .expect(201);
    ids.push(res.body.data.id);
  }
  return ids;
}

beforeAll(async () => {
  await resetDb();
  await createUser('admin@del.uz', 'ADMIN');
  studentId = (await createUser('student@del.uz', 'STUDENT')).id;
  adminAgent = await loginAgent('admin@del.uz');
  studentAgent = await loginAgent('student@del.uz');
});

afterAll(async () => {
  await prisma.$disconnect();
});

describe('Aloqa xabarlarini o\'chirish', () => {
  it('admin bitta xabarni o\'chiradi', async () => {
    const [id] = await createMessages(1);
    await adminAgent.delete(`/api/contact/${id}`).expect(200);
    expect(await prisma.contactMessage.findUnique({ where: { id } })).toBeNull();
  });

  it('yo\'q xabarni o\'chirishga urinish 404 qaytaradi', async () => {
    await adminAgent.delete('/api/contact/yoq-id').expect(404);
  });

  it('admin bo\'lmagan foydalanuvchi o\'chira olmaydi', async () => {
    const [id] = await createMessages(1);
    await studentAgent.delete(`/api/contact/${id}`).expect(403);
    // Yozuv joyida qolgani tekshiriladi — 403 qaytib, ammo o'chib ketsa
    // bu eng yomon nosozlik bo'lardi
    expect(await prisma.contactMessage.findUnique({ where: { id } })).not.toBeNull();
  });

  it('kirmagan foydalanuvchi o\'chira olmaydi', async () => {
    const [id] = await createMessages(1);
    await request(app).delete(`/api/contact/${id}`).expect(401);
  });

  it('ommaviy o\'chirish tanlanganlarni oladi, qolganini qoldiradi', async () => {
    const ids = await createMessages(3);
    const res = await adminAgent
      .post('/api/contact/bulk-delete')
      .send({ ids: [ids[0], ids[1]] })
      .expect(200);

    expect(res.body.data.deleted).toBe(2);
    expect(await prisma.contactMessage.findUnique({ where: { id: ids[0] } })).toBeNull();
    expect(await prisma.contactMessage.findUnique({ where: { id: ids[2] } })).not.toBeNull();
  });

  it('allaqachon o\'chirilgan ID bo\'lsa ham xato bermaydi, haqiqiy sonni qaytaradi', async () => {
    const [id] = await createMessages(1);
    const res = await adminAgent
      .post('/api/contact/bulk-delete')
      .send({ ids: [id, 'allaqachon-yoq-id'] })
      .expect(200);
    expect(res.body.data.deleted).toBe(1);
  });

  it('bo\'sh ro\'yxat rad etiladi', async () => {
    await adminAgent.post('/api/contact/bulk-delete').send({ ids: [] }).expect(400);
  });

  it('200 tadan ortiq ID rad etiladi', async () => {
    const tooMany = Array.from({ length: 201 }, (_, i) => `id-${i}`);
    await adminAgent.post('/api/contact/bulk-delete').send({ ids: tooMany }).expect(400);
  });

  it('admin bo\'lmagan ommaviy o\'chira olmaydi', async () => {
    const ids = await createMessages(1);
    await studentAgent.post('/api/contact/bulk-delete').send({ ids }).expect(403);
    expect(await prisma.contactMessage.findUnique({ where: { id: ids[0] } })).not.toBeNull();
  });
});

describe('Dars savolini o\'chirish', () => {
  let questionId: string;
  let lessonId: string;
  let ownerMentorAgent: Awaited<ReturnType<typeof loginAgent>>;
  let otherMentorAgent: Awaited<ReturnType<typeof loginAgent>>;

  beforeAll(async () => {
    // Kurs + modul + dars
    const course = await adminAgent
      .post('/api/courses')
      .send({ title: { uz: 'Savol kursi' }, description: { uz: 'Test kursi tavsifi' }, durationMonths: 1, price: 0, published: true })
      .expect(201);
    const mod = await adminAgent
      .post('/api/modules')
      .send({ courseId: course.body.data.id, title: { uz: '1-modul' } })
      .expect(201);
    const lesson = await adminAgent
      .post(`/api/modules/${mod.body.data.id}/lessons`)
      .send({ title: { uz: '1-dars' }, contentType: 'TEXT', content: { uz: 'Matn' } })
      .expect(201);
    lessonId = lesson.body.data.id;

    // Kursga biriktirilgan mentor va begona mentor
    const owner = await createUser('owner@del.uz', 'MENTOR', 'Egasi Mentor');
    const other = await createUser('other@del.uz', 'MENTOR', 'Begona Mentor');
    const ownerMentor = await prisma.mentor.create({
      data: { name: 'Egasi Mentor', bio: { uz: 'Test' }, specialty: { uz: 'Dasturlash' }, userId: owner.id },
    });
    await prisma.mentor.create({
      data: { name: 'Begona Mentor', bio: { uz: 'Test' }, specialty: { uz: 'Dizayn' }, userId: other.id },
    });
    await prisma.courseMentor.create({ data: { courseId: course.body.data.id, mentorId: ownerMentor.id } });

    ownerMentorAgent = await loginAgent('owner@del.uz');
    otherMentorAgent = await loginAgent('other@del.uz');

    // Savol to'g'ridan-to'g'ri bazaga yoziladi: /api/questions kursga yozilgan
    // bo'lishni talab qiladi, bu test esa O'CHIRISH ruxsatini tekshiradi
    questionId = (await prisma.lessonQuestion.create({
      data: { lessonId, userId: studentId, body: 'Bu qanday ishlaydi?' },
    })).id;
  });

  it('begona mentor o\'zga kursdagi savolni o\'chira olmaydi', async () => {
    await otherMentorAgent.delete(`/api/questions/${questionId}`).expect(403);
    expect(await prisma.lessonQuestion.findUnique({ where: { id: questionId } })).not.toBeNull();
  });

  it('kursning mentori o\'chira oladi', async () => {
    await ownerMentorAgent.delete(`/api/questions/${questionId}`).expect(200);
    expect(await prisma.lessonQuestion.findUnique({ where: { id: questionId } })).toBeNull();
  });

  it('ommaviy o\'chirish mentorga berilmagan', async () => {
    const q = await prisma.lessonQuestion.create({
      data: { lessonId, userId: studentId, body: 'Yana savol' },
    });
    await ownerMentorAgent.post('/api/questions/bulk-delete').send({ ids: [q.id] }).expect(403);
    expect(await prisma.lessonQuestion.findUnique({ where: { id: q.id } })).not.toBeNull();
  });
});
