import { beforeAll, afterAll, describe, expect, it } from 'vitest';
import { app, prisma, resetDb, createUser, loginAgent } from './helpers';
import request from 'supertest';

let admin: Awaited<ReturnType<typeof loginAgent>>;
let mentorAgent: Awaited<ReturnType<typeof loginAgent>>;
let studentA: Awaited<ReturnType<typeof loginAgent>>;
let studentB: Awaited<ReturnType<typeof loginAgent>>;
let courseId: string;
let studentAId: string;
let studentBId: string;

beforeAll(async () => {
  await resetDb();
  await createUser('admin@test.uz', 'ADMIN');
  const mentorUser = await createUser('mentor@test.uz', 'MENTOR');
  const userA = await createUser('studentA@test.uz', 'STUDENT');
  const userB = await createUser('studentB@test.uz', 'STUDENT');
  studentAId = userA.id;
  studentBId = userB.id;

  admin = await loginAgent('admin@test.uz');
  mentorAgent = await loginAgent('mentor@test.uz');
  studentA = await loginAgent('studentA@test.uz');
  studentB = await loginAgent('studentB@test.uz');

  const course = await admin
    .post('/api/courses')
    .send({ title: { uz: 'Sessiya Testi Kursi' }, description: { uz: 'Jonli dars auditoriyasi testi' }, durationMonths: 1, price: 0, published: true })
    .expect(201);
  courseId = course.body.data.id;

  const mentor = await prisma.mentor.create({
    data: { name: 'Test Mentor', bio: { uz: 'Bio matni' }, specialty: { uz: 'Backend' }, userId: mentorUser.id },
  });
  await prisma.course.update({ where: { id: courseId }, data: { mentorId: mentor.id } });

  await prisma.enrollment.createMany({
    data: [
      { userId: studentAId, courseId, status: 'ACTIVE', paymentStatus: 'PAID' },
      { userId: studentBId, courseId, status: 'ACTIVE', paymentStatus: 'PAID' },
    ],
  });
});

afterAll(async () => {
  await prisma.$disconnect();
});

function futureIso(hours: number): string {
  return new Date(Date.now() + hours * 3600 * 1000).toISOString();
}

describe('Jonli efir auditoriyasi (targetStudentIds)', () => {
  it("auditoriyasiz sessiya barcha yozilgan talabalarga ko'rinadi", async () => {
    const created = await mentorAgent
      .post('/api/sessions')
      .send({ courseId, title: { uz: 'Hammaga ochiq sessiya' }, meetingUrl: 'https://meet.jit.si/test1', startsAt: futureIso(1), durationMin: 60 })
      .expect(201);
    expect(created.body.data.targetStudentIds).toEqual([]);

    const listA = await studentA.get('/api/sessions/mine').expect(200);
    const listB = await studentB.get('/api/sessions/mine').expect(200);
    expect(listA.body.data.some((s: { id: string }) => s.id === created.body.data.id)).toBe(true);
    expect(listB.body.data.some((s: { id: string }) => s.id === created.body.data.id)).toBe(true);
  });

  it('aniq o\'quvchiga mo\'ljallangan sessiyani faqat o\'sha ko\'radi', async () => {
    const notifABefore = await prisma.notification.count({ where: { userId: studentAId, type: 'SESSION_SCHEDULED' } });
    const notifBBefore = await prisma.notification.count({ where: { userId: studentBId, type: 'SESSION_SCHEDULED' } });

    const created = await mentorAgent
      .post('/api/sessions')
      .send({
        courseId,
        title: { uz: 'Faqat A uchun sessiya' },
        meetingUrl: 'https://meet.jit.si/test2',
        startsAt: futureIso(2),
        durationMin: 45,
        targetStudentIds: [studentAId],
      })
      .expect(201);
    expect(created.body.data.targetStudentIds).toEqual([studentAId]);

    const listA = await studentA.get('/api/sessions/mine').expect(200);
    const listB = await studentB.get('/api/sessions/mine').expect(200);
    expect(listA.body.data.some((s: { id: string }) => s.id === created.body.data.id)).toBe(true);
    expect(listB.body.data.some((s: { id: string }) => s.id === created.body.data.id)).toBe(false);

    // Faqat studentA'ga yangi bildirishnoma yuborilgan bo'lishi kerak
    const notifAAfter = await prisma.notification.count({ where: { userId: studentAId, type: 'SESSION_SCHEDULED' } });
    const notifBAfter = await prisma.notification.count({ where: { userId: studentBId, type: 'SESSION_SCHEDULED' } });
    expect(notifAAfter - notifABefore).toBe(1);
    expect(notifBAfter - notifBBefore).toBe(0);
  });

  it("kursga aloqasi yo'q userId server tomonda e'tiborsiz qoldiriladi", async () => {
    const created = await mentorAgent
      .post('/api/sessions')
      .send({
        courseId,
        title: { uz: 'Soxta id bilan sessiya' },
        meetingUrl: 'https://meet.jit.si/test3',
        startsAt: futureIso(3),
        durationMin: 30,
        targetStudentIds: [studentAId, 'mavjud-bolmagan-id'],
      })
      .expect(201);
    expect(created.body.data.targetStudentIds).toEqual([studentAId]);
  });
});
