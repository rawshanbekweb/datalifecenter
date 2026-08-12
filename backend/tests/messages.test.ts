import { beforeAll, beforeEach, afterAll, describe, expect, it } from 'vitest';
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
  await prisma.courseMentor.create({ data: { courseId: course.body.data.id, mentorId: mentor.id, isLead: true } });
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
    expect(res.body.data.otherUser.id).toBe(mentorUserId);
    // Yuborilgan xabarning O'ZI tekshiriladi (xabarlar eskidan yangiga beriladi).
    // Ilgari bu yerda "suhbatda bitta xabar bor" deyilardi — ya'ni test shu
    // juftlikka undan oldin hech kim yozmaganiga bog'lanib qolgandi.
    expect(res.body.data.messages.at(-1).body).toBe('Salom, savolim bor edi');
  });

  it("bir juftlik uchun ikkinchi suhbat OCHILMAYDI — o'sha yozishma davom etadi", async () => {
    const first = await enrolledAgent
      .post('/api/messages/conversations')
      .send({ recipientId: mentorUserId, body: 'Birinchi savol' })
      .expect(201);

    const again = await enrolledAgent
      .post('/api/messages/conversations')
      .send({ recipientId: mentorUserId, body: 'Yana bir savol' })
      .expect(201);

    // Asosiy da'vo: yangi suhbat ochilmadi, AYNAN o'sha yozishma davom etdi.
    // Ilgari bu xabarlar sonini sanash orqali bilvosita tekshirilardi va
    // shuning uchun oldingi testning xabariga bog'lanib qolgandi.
    expect(again.body.data.id).toBe(first.body.data.id);
    expect(again.body.data.messages.at(-1).body).toBe('Yana bir savol');

    // Hisob AYNAN shu talabaning yozishmalari bilan cheklanadi — bazadagi
    // barcha DIRECT suhbatlar sanalsa, "admin hamkasbiga yozadi" testi
    // ikkinchi DIRECT suhbat ochgani uchun tartib o'zgarganda yiqilardi.
    const count = await prisma.conversation.count({
      where: { kind: 'DIRECT', participants: { some: { userId: enrolledUserId } } },
    });
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

  it('admin hamkasbiga yozsa oddiy shaxsiy yozishma ochiladi', async () => {
    const second = await createUser('admin2@msg.uz', 'ADMIN', 'Ikkinchi Admin');
    const res = await adminAgent
      .post('/api/messages/conversations')
      .send({ recipientId: second.id, body: 'Hamkasbga xabar' })
      .expect(201);

    // Administratsiya kanaliga emas — admin o'ziga tegishli kanalga yoza olmaydi
    expect(res.body.data.kind).toBe('DIRECT');
    expect(res.body.data.otherUser.id).toBe(second.id);
  });
});

describe('Bildirishnomalar', () => {
  it('bitta suhbat qo‘ng‘iroqni to‘ldirmaydi — bitta o‘qilmagan yozuv qoladi', async () => {
    const mentorUser = await prisma.user.findUniqueOrThrow({ where: { email: 'mentor@msg.uz' } });
    await prisma.notification.deleteMany({ where: { userId: mentorUser.id } });

    for (const text of ['Birinchi', 'Ikkinchi', 'Uchinchi']) {
      await enrolledAgent
        .post('/api/messages/conversations')
        .send({ recipientId: mentorUserId, body: text })
        .expect(201);
    }

    const notifications = await prisma.notification.findMany({
      where: { userId: mentorUser.id, type: 'NEW_MESSAGE' },
    });
    expect(notifications).toHaveLength(1);
    // Matn oxirgi xabarga yangilanadi
    expect(notifications[0]?.body).toContain('Uchinchi');
  });

  it("o'qilgandan keyin yangi xabar yangi bildirishnoma yaratadi", async () => {
    const mentorUser = await prisma.user.findUniqueOrThrow({ where: { email: 'mentor@msg.uz' } });
    await prisma.notification.updateMany({
      where: { userId: mentorUser.id, readAt: null },
      data: { readAt: new Date() },
    });

    await enrolledAgent
      .post('/api/messages/conversations')
      .send({ recipientId: mentorUserId, body: "O'qilgandan keyingi xabar" })
      .expect(201);

    const unread = await prisma.notification.count({
      where: { userId: mentorUser.id, type: 'NEW_MESSAGE', readAt: null },
    });
    expect(unread).toBe(1);
  });
});

describe("O'qilmagan xabarlar", () => {
  /**
   * Har bir test "hammasi o'qilgan" nuqtasidan boshlanadi.
   *
   * Ilgari bu blokdagi testlar bir-birining qoldiq holatiga tayanardi: biri
   * o'qilmagan xabar qoldirsa, keyingisining kutilgan raqami siljib ketardi.
   * Eng yomoni — yiqilgani o'zgartirilgan test EMAS, undan KEYINGISI bo'lardi,
   * ya'ni xato ko'rsatgan joy sabab bo'lgan joydan boshqa edi.
   *
   * Barcha ishtirokchini "o'qidi" deb belgilash yetarli va arzon: shundan
   * keyin har test o'zi kerakli o'qilmagan holatni yaratadi va ANIQ raqamni
   * tekshiradi — "noldan katta" kabi mo'ljalsiz shartlar o'rniga.
   */
  beforeEach(async () => {
    await prisma.conversationParticipant.updateMany({ data: { lastReadAt: new Date() } });
  });

  it("qabul qiluvchida o'qilmagan hisoblanadi, o'qilgach nolga tushadi", async () => {
    await enrolledAgent
      .post('/api/messages/conversations')
      .send({ recipientId: mentorUserId, body: "Uchinchi xabar" })
      .expect(201);

    const before = await mentorAgent.get('/api/messages/unread-count').expect(200);
    expect(before.body.data.unreadCount).toBe(1);

    // Suhbat KINDI bo'yicha topiladi — ilgari ro'yxatning birinchi yozuvi
    // olinardi va bu tartibga (lastMessageAt) bilinmasdan bog'lanib qolgandi
    const list = await mentorAgent.get('/api/messages/conversations').expect(200);
    const direct = list.body.data.find((c: { kind: string }) => c.kind === 'DIRECT');
    await mentorAgent.patch(`/api/messages/conversations/${direct.id}/read`).expect(200);

    const after = await mentorAgent.get('/api/messages/unread-count').expect(200);
    expect(after.body.data.unreadCount).toBe(0);
  });

  it("bitta suhbat ochilganda o'qilmagan soni FAQAT o'sha suhbatniki bo'ladi", async () => {
    // Ikki xil suhbat: mentor bilan yozishma va administratsiya kanali.
    // Suhbat sahifasi hisobni bitta suhbat bo'yicha cheklab so'raydi —
    // xavf shundaki, cheklov tushib qolsa boshqa yozishmalarning o'qilmagan
    // xabarlari ham shu suhbatning belgisiga qo'shilib ketardi.
    await enrolledAgent.post('/api/messages/conversations').send({ recipientId: mentorUserId, body: 'Mentorga' }).expect(201);
    await enrolledAgent.post('/api/messages/conversations').send({ toAdmin: true, body: 'Adminga' }).expect(201);

    const list = await enrolledAgent.get('/api/messages/conversations').expect(200);
    const mentorConv = list.body.data.find((c: { kind: string }) => c.kind === 'DIRECT');
    expect(mentorConv).toBeDefined();

    // Mentor talabaga javob yozadi — o'qilmagan faqat SHU suhbatda paydo bo'ladi
    await mentorAgent
      .post(`/api/messages/conversations/${mentorConv.id}/messages`)
      .send({ body: 'Mentor javobi' })
      .expect(201);

    const thread = await enrolledAgent.get(`/api/messages/conversations/${mentorConv.id}`).expect(200);
    expect(thread.body.data.unreadCount).toBe(1);
  });

  it("o'z yuborgan xabari o'qilmaganga sanalmaydi", async () => {
    await enrolledAgent
      .post('/api/messages/conversations')
      .send({ recipientId: mentorUserId, body: "O'z xabarim" })
      .expect(201);

    // beforeEach hammasini o'qilgan qilib qo'ygani uchun kutilgan qiymat aniq
    // NOL: ilgari bu yerda testdan oldingi qoldiq hisob bilan solishtirilardi,
    // ya'ni ikkalasi ham noto'g'ri bo'lsa test baribir o'tib ketaverardi.
    const after = await enrolledAgent.get('/api/messages/unread-count').expect(200);
    expect(after.body.data.unreadCount).toBe(0);
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
