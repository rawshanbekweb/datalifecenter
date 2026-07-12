import { beforeAll, afterAll, describe, expect, it } from 'vitest';
import { app, prisma, resetDb, createUser, loginAgent } from './helpers';
import request from 'supertest';

let admin: Awaited<ReturnType<typeof loginAgent>>;
let mentorAgent: Awaited<ReturnType<typeof loginAgent>>;
let studentA: Awaited<ReturnType<typeof loginAgent>>;
let studentB: Awaited<ReturnType<typeof loginAgent>>;
let courseId: string;
let mentorUserId: string;
let studentAId: string;
let studentBId: string;

beforeAll(async () => {
  await resetDb();
  await createUser('admin@test.uz', 'ADMIN');
  const mentorUser = await createUser('mentor@test.uz', 'MENTOR');
  const userA = await createUser('studentA@test.uz', 'STUDENT');
  const userB = await createUser('studentB@test.uz', 'STUDENT');
  mentorUserId = mentorUser.id;
  studentAId = userA.id;
  studentBId = userB.id;

  admin = await loginAgent('admin@test.uz');
  mentorAgent = await loginAgent('mentor@test.uz');
  studentA = await loginAgent('studentA@test.uz');
  studentB = await loginAgent('studentB@test.uz');

  const course = await admin
    .post('/api/courses')
    .send({ title: { uz: 'Topshiriq Testi Kursi' }, description: { uz: 'Topshiriq oqimi testi' }, durationMonths: 1, price: 0, published: true })
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

describe("Topshiriq berish va auditoriya", () => {
  it("auditoriyasiz topshiriq barcha yozilgan talabalarga ko'rinadi va bildirishnoma boradi", async () => {
    const created = await mentorAgent
      .post('/api/assignments')
      .send({ courseId, title: 'Umumiy topshiriq', description: "Hammaga mo'ljallangan vazifa" })
      .expect(201);
    expect(created.body.data.targetStudentIds).toEqual([]);

    const listA = await studentA.get('/api/assignments/mine').expect(200);
    const listB = await studentB.get('/api/assignments/mine').expect(200);
    expect(listA.body.data.some((a: { id: string }) => a.id === created.body.data.id)).toBe(true);
    expect(listB.body.data.some((a: { id: string }) => a.id === created.body.data.id)).toBe(true);

    const notifA = await prisma.notification.count({ where: { userId: studentAId, type: 'NEW_ASSIGNMENT' } });
    const notifB = await prisma.notification.count({ where: { userId: studentBId, type: 'NEW_ASSIGNMENT' } });
    expect(notifA).toBe(1);
    expect(notifB).toBe(1);
  });

  it("aniq o'quvchiga mo'ljallangan topshiriqni faqat o'sha ko'radi", async () => {
    const created = await mentorAgent
      .post('/api/assignments')
      .send({ courseId, title: 'Faqat A uchun', description: 'Individual vazifa', targetStudentIds: [studentAId, 'soxta-id'] })
      .expect(201);
    // Kursga aloqasi yo'q id server tomonda tushirib qoldiriladi
    expect(created.body.data.targetStudentIds).toEqual([studentAId]);

    const listA = await studentA.get('/api/assignments/mine').expect(200);
    const listB = await studentB.get('/api/assignments/mine').expect(200);
    expect(listA.body.data.some((a: { id: string }) => a.id === created.body.data.id)).toBe(true);
    expect(listB.body.data.some((a: { id: string }) => a.id === created.body.data.id)).toBe(false);

    // B unga javob yubora olmaydi
    await studentB.post(`/api/assignments/${created.body.data.id}/submit`).send({ content: 'Men ham qatnashaman' }).expect(403);
  });

  it('talaba topshiriq yarata olmaydi', async () => {
    await studentA.post('/api/assignments').send({ courseId, title: 'Hiyla', description: 'Ruxsatsiz urinish' }).expect(403);
  });
});

describe('Javob yuborish va tekshirish oqimi', () => {
  let assignmentId: string;
  let submissionId: string;

  it("o'quvchi javob yuboradi — mentorga bildirishnoma boradi", async () => {
    const created = await mentorAgent
      .post('/api/assignments')
      .send({ courseId, title: 'Baholanadigan topshiriq', description: "To'liq oqim testi" })
      .expect(201);
    assignmentId = created.body.data.id;

    const before = await prisma.notification.count({ where: { userId: mentorUserId, type: 'ASSIGNMENT_SUBMITTED' } });
    const submitted = await studentA
      .post(`/api/assignments/${assignmentId}/submit`)
      .send({ content: 'Mana yechimim', linkUrl: 'https://github.com/test/repo' })
      .expect(201);
    submissionId = submitted.body.data.id;
    expect(submitted.body.data.status).toBe('SUBMITTED');

    const after = await prisma.notification.count({ where: { userId: mentorUserId, type: 'ASSIGNMENT_SUBMITTED' } });
    expect(after - before).toBe(1);

    // Mentor boshqaruv ro'yxatida javob ko'rinadi
    const managed = await mentorAgent.get('/api/assignments/manage').expect(200);
    const found = managed.body.data.find((a: { id: string }) => a.id === assignmentId);
    expect(found.submissions).toHaveLength(1);
    expect(found.submissions[0].content).toBe('Mana yechimim');
  });

  it("mentor qaytaradi — o'quvchi qayta yuboradi, baho/izoh tozalanadi", async () => {
    const returned = await mentorAgent
      .patch(`/api/assignments/submissions/${submissionId}/review`)
      .send({ status: 'RETURNED', feedback: "To'liq emas, testlarni qo'shing" })
      .expect(200);
    expect(returned.body.data.status).toBe('RETURNED');

    const notif = await prisma.notification.count({ where: { userId: studentAId, type: 'ASSIGNMENT_REVIEWED' } });
    expect(notif).toBe(1);

    // Talaba o'z ro'yxatida qaytarilganini va izohni ko'radi
    const mine = await studentA.get('/api/assignments/mine').expect(200);
    const a = mine.body.data.find((x: { id: string }) => x.id === assignmentId);
    expect(a.mySubmission.status).toBe('RETURNED');
    expect(a.mySubmission.feedback).toBe("To'liq emas, testlarni qo'shing");

    const resubmitted = await studentA
      .post(`/api/assignments/${assignmentId}/submit`)
      .send({ content: 'Testlar bilan yangilangan yechim' })
      .expect(201);
    expect(resubmitted.body.data.status).toBe('SUBMITTED');
    expect(resubmitted.body.data.feedback).toBeNull();
    expect(resubmitted.body.data.id).toBe(submissionId);
  });

  it("mentor baho bilan qabul qiladi — qabul qilingandan keyin qayta yuborib bo'lmaydi", async () => {
    const accepted = await mentorAgent
      .patch(`/api/assignments/submissions/${submissionId}/review`)
      .send({ status: 'ACCEPTED', grade: 95, feedback: 'Ajoyib ish!' })
      .expect(200);
    expect(accepted.body.data.status).toBe('ACCEPTED');
    expect(accepted.body.data.grade).toBe(95);

    const res = await studentA
      .post(`/api/assignments/${assignmentId}/submit`)
      .send({ content: 'Yana bir urinish' })
      .expect(409);
    expect(res.body.error.code).toBe('SUBMISSION_ALREADY_ACCEPTED');
  });

  it("boshqa mentor javobni tekshira olmaydi", async () => {
    const strangerUser = await createUser('stranger@test.uz', 'MENTOR');
    await prisma.mentor.create({
      data: { name: 'Begona Mentor', bio: { uz: 'Bio' }, specialty: { uz: 'Frontend' }, userId: strangerUser.id },
    });
    const stranger = await loginAgent('stranger@test.uz');
    await stranger
      .patch(`/api/assignments/submissions/${submissionId}/review`)
      .send({ status: 'ACCEPTED' })
      .expect(403);
  });

  it("topshiriq o'chirilganda javoblar ham o'chadi (cascade)", async () => {
    await mentorAgent.delete(`/api/assignments/${assignmentId}`).expect(200);
    const orphan = await prisma.assignmentSubmission.findUnique({ where: { id: submissionId } });
    expect(orphan).toBeNull();
  });
});
