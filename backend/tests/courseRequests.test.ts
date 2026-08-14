import request from 'supertest';
import { beforeAll, afterAll, describe, expect, it } from 'vitest';
import { app, prisma, resetDb, createUser, loginAgent } from './helpers';

// Online/offline kurs formati va adminga murojaat oqimi

let adminAgent: Awaited<ReturnType<typeof loginAgent>>;
let studentAgent: Awaited<ReturnType<typeof loginAgent>>;
let studentId: string;
let onlineCourseId: string;
let offlineCourseId: string;
let hybridCourseId: string;

async function createCourse(title: string, format: 'ONLINE' | 'OFFLINE' | 'HYBRID'): Promise<string> {
  const res = await adminAgent
    .post('/api/courses')
    .send({ title: { uz: title }, description: { uz: 'Test kursi' }, durationMonths: 1, price: 0, published: true, format })
    .expect(201);
  return res.body.data.id;
}

beforeAll(async () => {
  await resetDb();
  await createUser('admin@req.uz', 'ADMIN', 'Test User', true);
  // So'rov yuborish uchun email tasdiqlangan bo'lishi shart
  const student = await createUser('student@req.uz', 'STUDENT', 'Talaba Talabov', true);
  studentId = student.id;
  await createUser('tasdiqlanmagan@req.uz', 'STUDENT', 'Tasdiqlanmagan');

  adminAgent = await loginAgent('admin@req.uz');
  studentAgent = await loginAgent('student@req.uz');

  onlineCourseId = await createCourse('Online Kurs', 'ONLINE');
  offlineCourseId = await createCourse('Offline Kurs', 'OFFLINE');
  hybridCourseId = await createCourse('Gibrid Kurs', 'HYBRID');
});

afterAll(async () => {
  await prisma.$disconnect();
});

describe('Kurs formati', () => {
  it('format kurs javobida qaytadi', async () => {
    const res = await request(app).get('/api/courses/offline-kurs').expect(200);
    expect(res.body.data.format).toBe('OFFLINE');
  });

  it("offline kursga o'zicha yozilib bo'lmaydi", async () => {
    const res = await studentAgent
      .post('/api/enrollments')
      .send({ courseId: offlineCourseId })
      .expect(409);
    expect(res.body.error.code).toBe('OFFLINE_COURSE_REQUEST_REQUIRED');
  });

  it('online kursga yozilish avvalgidek ishlaydi', async () => {
    await studentAgent.post('/api/enrollments').send({ courseId: onlineCourseId }).expect(201);
  });
});

describe("Kurs so'rovi", () => {
  it('mehmon (login qilmagan) so‘rov yubora OLMAYDI', async () => {
    await request(app)
      .post('/api/course-requests')
      .send({ courseId: offlineCourseId, format: 'OFFLINE', name: 'Mehmon', phone: '+998901234567' })
      .expect(401);
  });

  it('emaili tasdiqlanmagan foydalanuvchi so‘rov yubora olmaydi', async () => {
    const agent = await loginAgent('tasdiqlanmagan@req.uz');
    const res = await agent
      .post('/api/course-requests')
      .send({ courseId: offlineCourseId, format: 'OFFLINE', name: 'Tasdiqlanmagan', phone: '+998901234567' })
      .expect(403);
    expect(res.body.error.code).toBe('EMAIL_NOT_VERIFIED');
  });

  it("kurs formatiga mos kelmaydigan so'rov rad etiladi", async () => {
    const res = await studentAgent
      .post('/api/course-requests')
      .send({ courseId: offlineCourseId, format: 'ONLINE', name: 'Talaba', phone: '+998901234567' })
      .expect(400);
    expect(res.body.error.code).toBe('FORMAT_NOT_AVAILABLE');
  });

  it('gibrid kursda ikkala format ham qabul qilinadi', async () => {
    await studentAgent
      .post('/api/course-requests')
      .send({ courseId: hybridCourseId, format: 'ONLINE', name: 'Talaba', phone: '+998901234567' })
      .expect(201);

    // Ikkinchi format BOSHQA foydalanuvchidan: bitta odamning bitta kursga
    // ochiq turgan ikkinchi so'rovi ataylab to'xtatiladi (REQUEST_PENDING)
    await createUser('ikkinchi@req.uz', 'STUDENT', 'Ikkinchi Talaba', true);
    const other = await loginAgent('ikkinchi@req.uz');
    await other
      .post('/api/course-requests')
      .send({ courseId: hybridCourseId, format: 'OFFLINE', name: 'Ikkinchi Talaba', phone: '+998901234568' })
      .expect(201);
  });

  it("saytga kirgan foydalanuvchining so'rovi hisobiga bog'lanadi", async () => {
    const res = await studentAgent
      .post('/api/course-requests')
      .send({ courseId: offlineCourseId, format: 'OFFLINE', name: 'Talaba Talabov', phone: '+998901112233', note: 'Kechqurungi guruh bormi?' })
      .expect(201);

    expect(res.body.data.userId).toBe(studentId);

    // /mine faqat shu hisobning so'rovlarini qaytaradi: yangi so'rov ro'yxatda
    // bo'ladi, boshqa talabaning gibrid kursga so'rovi esa bu yerga tushmaydi
    const mine = await studentAgent.get('/api/course-requests/mine').expect(200);
    const ids = mine.body.data.map((r: { id: string }) => r.id);
    expect(ids).toContain(res.body.data.id);
    expect(mine.body.data.every((r: { userId: string }) => r.userId === studentId)).toBe(true);
  });

  it("ko'rib chiqilmagan so'rov turganda takroriy so'rov yaratilmaydi", async () => {
    const res = await studentAgent
      .post('/api/course-requests')
      .send({ courseId: offlineCourseId, format: 'OFFLINE', name: 'Talaba Talabov', phone: '+998901112233' })
      .expect(409);
    expect(res.body.error.code).toBe('REQUEST_PENDING');
  });

  it("so'rovlar ro'yxati faqat adminga ochiq", async () => {
    await studentAgent.get('/api/course-requests').expect(403);
    const res = await adminAgent.get('/api/course-requests').expect(200);
    expect(res.body.data.items.length).toBeGreaterThan(0);
  });
});

describe('Adminning javobi', () => {
  it("hisobi bor o'quvchiga javob yozishma orqali yetkaziladi", async () => {
    const list = await adminAgent.get('/api/course-requests').expect(200);
    const own = list.body.data.items.find((r: { userId: string | null }) => r.userId === studentId);

    const updated = await adminAgent
      .patch(`/api/course-requests/${own.id}`)
      .send({ reply: 'Ha, kechqurungi guruh bor — 18:00 da' })
      .expect(200);

    // Javob yozilishi bilan holat "bog'lanildi"ga o'tadi
    expect(updated.body.data.status).toBe('CONTACTED');

    const conversations = await studentAgent.get('/api/messages/conversations').expect(200);
    const adminThread = conversations.body.data.find((c: { kind: string }) => c.kind === 'ADMIN');
    expect(adminThread).toBeTruthy();
    expect(adminThread.lastMessage.body).toContain('kechqurungi guruh bor');
  });

  it('admin holatni qo‘lda o‘zgartira oladi', async () => {
    const list = await adminAgent.get('/api/course-requests?status=NEW').expect(200);
    const target = list.body.data.items[0];

    const updated = await adminAgent
      .patch(`/api/course-requests/${target.id}`)
      .send({ status: 'ENROLLED' })
      .expect(200);
    expect(updated.body.data.status).toBe('ENROLLED');
  });
});
