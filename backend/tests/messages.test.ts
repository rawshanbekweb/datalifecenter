import { beforeAll, afterAll, describe, expect, it } from 'vitest';
import { prisma, resetDb, createUser, loginAgent } from './helpers';

// Rollar aro yozishma: kim kimga yoza olishi va o'qilmagan hisobi

let adminAgent: Awaited<ReturnType<typeof loginAgent>>;
let mentorAgent: Awaited<ReturnType<typeof loginAgent>>;
let enrolledAgent: Awaited<ReturnType<typeof loginAgent>>;
let strangerAgent: Awaited<ReturnType<typeof loginAgent>>;
let mentorUserId: string;
let enrolledUserId: string;
let strangerUserId: string;

beforeAll(async () => {
  await resetDb();
  await createUser('admin@msg.uz', 'ADMIN', 'Admin Adminov');
  const mentorUser = await createUser('mentor@msg.uz', 'MENTOR', 'Mentor Mentorov');
  const enrolled = await createUser('student@msg.uz', 'STUDENT', 'Yozilgan Talaba');
  const stranger = await createUser('stranger@msg.uz', 'STUDENT', 'Begona Talaba');
  mentorUserId = mentorUser.id;
  enrolledUserId = enrolled.id;
  strangerUserId = stranger.id;

  adminAgent = await loginAgent('admin@msg.uz');
  mentorAgent = await loginAgent('mentor@msg.uz');
  enrolledAgent = await loginAgent('student@msg.uz');
  strangerAgent = await loginAgent('stranger@msg.uz');

  const course = await adminAgent
    .post('/api/courses')
    .send({ title: { uz: 'Yozishma Testi Kursi' }, description: { uz: 'Yozishma oqimi testi' }, durationMonths: 1, price: 0, published: true })
    .expect(201);

  const mentor = await prisma.mentor.create({
    data: { name: 'Mentor Mentorov', bio: { uz: 'Bio' }, specialty: { uz: 'Backend' }, userId: mentorUser.id },
  });
  await prisma.course.update({ where: { id: course.body.data.id }, data: { mentorId: mentor.id } });
  await prisma.enrollment.create({
    data: { userId: enrolledUserId, courseId: course.body.data.id, status: 'ACTIVE', paymentStatus: 'PAID' },
  });
});

afterAll(async () => {
  await prisma.$disconnect();
});

describe('Kim kimga yoza oladi', () => {
  it("kursga yozilgan talaba o'z mentoriga yoza oladi", async () => {
    const res = await enrolledAgent
      .post('/api/messages/conversations')
      .send({ recipientId: mentorUserId, body: 'Salom, savolim bor edi' })
      .expect(201);

    expect(res.body.data.kind).toBe('DIRECT');
    expect(res.body.data.messages).toHaveLength(1);
    expect(res.body.data.otherUser.id).toBe(mentorUserId);
  });

  it("bir juftlik uchun ikkinchi suhbat OCHILMAYDI — o'sha yozishma davom etadi", async () => {
    const again = await enrolledAgent
      .post('/api/messages/conversations')
      .send({ recipientId: mentorUserId, body: 'Yana bir savol' })
      .expect(201);

    expect(again.body.data.messages).toHaveLength(2);
    const count = await prisma.conversation.count({ where: { kind: 'DIRECT' } });
    expect(count).toBe(1);
  });

  it('kursga yozilmagan talaba mentorga yoza olmaydi', async () => {
    const res = await strangerAgent
      .post('/api/messages/conversations')
      .send({ recipientId: mentorUserId, body: 'Salom' })
      .expect(403);

    expect(res.body.error.code).toBe('MESSAGE_NOT_ALLOWED');
  });

  it("mentor o'z kursidagi bo'lmagan talabaga yoza olmaydi", async () => {
    await mentorAgent
      .post('/api/messages/conversations')
      .send({ recipientId: strangerUserId, body: 'Salom' })
      .expect(403);
  });

  it('har qanday foydalanuvchi administratsiyaga yoza oladi', async () => {
    const res = await strangerAgent
      .post('/api/messages/conversations')
      .send({ toAdmin: true, body: 'Kurslar haqida savol' })
      .expect(201);

    expect(res.body.data.kind).toBe('ADMIN');
    // Murojaat qiluvchi aniq adminni emas, "administratsiya"ni ko'radi
    expect(res.body.data.otherUser).toBeNull();
  });

  it("adminga to'g'ridan-to'g'ri yozilgan xabar ham administratsiya kanaliga tushadi", async () => {
    const adminUser = await prisma.user.findUniqueOrThrow({ where: { email: 'admin@msg.uz' } });
    const res = await enrolledAgent
      .post('/api/messages/conversations')
      .send({ recipientId: adminUser.id, body: 'Adminga savol' })
      .expect(201);

    expect(res.body.data.kind).toBe('ADMIN');
  });
});

describe("O'qilmagan xabarlar", () => {
  it("qabul qiluvchida o'qilmagan hisoblanadi, o'qilgach nolga tushadi", async () => {
    await enrolledAgent
      .post('/api/messages/conversations')
      .send({ recipientId: mentorUserId, body: "Uchinchi xabar" })
      .expect(201);

    const before = await mentorAgent.get('/api/messages/unread-count').expect(200);
    expect(before.body.data.unreadCount).toBeGreaterThan(0);

    const list = await mentorAgent.get('/api/messages/conversations').expect(200);
    const conversationId = list.body.data[0].id;
    await mentorAgent.patch(`/api/messages/conversations/${conversationId}/read`).expect(200);

    const after = await mentorAgent.get('/api/messages/unread-count').expect(200);
    expect(after.body.data.unreadCount).toBe(0);
  });

  it("o'z yuborgan xabari o'qilmaganga sanalmaydi", async () => {
    const before = await enrolledAgent.get('/api/messages/unread-count').expect(200);
    await enrolledAgent
      .post('/api/messages/conversations')
      .send({ recipientId: mentorUserId, body: "O'z xabarim" })
      .expect(201);

    const after = await enrolledAgent.get('/api/messages/unread-count').expect(200);
    expect(after.body.data.unreadCount).toBe(before.body.data.unreadCount);
  });

  it('begona odam suhbatni ocha olmaydi', async () => {
    const list = await enrolledAgent.get('/api/messages/conversations').expect(200);
    const direct = list.body.data.find((c: { kind: string }) => c.kind === 'DIRECT');

    const res = await strangerAgent.get(`/api/messages/conversations/${direct.id}`).expect(403);
    expect(res.body.error.code).toBe('CONVERSATION_FORBIDDEN');
  });
});

describe('Kontaktlar', () => {
  it("talabaga faqat o'z kursi mentori ko'rinadi", async () => {
    const res = await enrolledAgent.get('/api/messages/contacts').expect(200);
    expect(res.body.data).toHaveLength(1);
    expect(res.body.data[0].id).toBe(mentorUserId);
  });

  it("kursga yozilmagan talabada kontakt yo'q", async () => {
    const res = await strangerAgent.get('/api/messages/contacts').expect(200);
    expect(res.body.data).toHaveLength(0);
  });

  it("mentorga o'z o'quvchisi ko'rinadi", async () => {
    const res = await mentorAgent.get('/api/messages/contacts').expect(200);
    expect(res.body.data.map((c: { id: string }) => c.id)).toEqual([enrolledUserId]);
  });
});
