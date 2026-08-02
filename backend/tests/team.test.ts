import { beforeAll, afterAll, describe, expect, it } from 'vitest';
import request from 'supertest';
import { app, prisma, resetDb, createUser, loginAgent } from './helpers';

let admin: Awaited<ReturnType<typeof loginAgent>>;
let staff: Awaited<ReturnType<typeof loginAgent>>;
let staffUserId: string;
let ceoId: string;
let projectId: string;

const bio = { uz: "Jamoa a'zosi haqida qisqacha ma'lumot" };

beforeAll(async () => {
  await resetDb();
  await createUser('admin@test.uz', 'ADMIN');
  admin = await loginAgent('admin@test.uz');

  const staffUser = await createUser('xodim@test.uz', 'TEAM', 'Bek Tursunov');
  staffUserId = staffUser.id;
  staff = await loginAgent('xodim@test.uz');

  const project = await prisma.project.create({
    data: {
      title: { uz: 'Demo loyiha' },
      category: 'Web App',
      description: { uz: 'Sinov loyihasi' },
      techStack: ['React'],
      screenshotUrl: '/demo.png',
    },
  });
  projectId = project.id;
});

afterAll(async () => {
  await prisma.$disconnect();
});

describe('Jamoa — admin CRUD', () => {
  it("a'zo yaratadi va slug ismdan hosil bo'ladi", async () => {
    const res = await admin
      .post('/api/team')
      .send({
        name: 'Rustam Nazarov',
        position: { uz: 'Asoschi va CEO' },
        bio,
        department: 'LEADERSHIP',
        leadership: true,
        skills: ['Strategiya', 'Product'],
        projects: [{ projectId }],
      })
      .expect(201);

    ceoId = res.body.data.id;
    expect(res.body.data.slug).toBe('rustam-nazarov');
    expect(res.body.data.leadership).toBe(true);
  });

  it("bir xil ismda ikkinchi a'zoda slug takrorlanmaydi", async () => {
    const res = await admin
      .post('/api/team')
      .send({ name: 'Rustam Nazarov', position: { uz: 'Dizayner' }, bio, department: 'DESIGN' })
      .expect(201);
    expect(res.body.data.slug).toBe('rustam-nazarov-2');
  });

  it("kabinet yo'llari bilan to'qnashadigan slug band qilinmaydi", async () => {
    const res = await admin
      .post('/api/team')
      .send({ name: 'Profile', position: { uz: 'Tester' }, bio, department: 'OPERATIONS' })
      .expect(201);
    // "profile" zahiralangan — /team/profile kabinetni ochishi kerak
    expect(res.body.data.slug).toBe('profile-1');
  });

  it('admin bo\'lmagan foydalanuvchi yarata olmaydi', async () => {
    await staff
      .post('/api/team')
      .send({ name: 'Ruxsatsiz', position: { uz: 'Hech kim' }, bio, department: 'DESIGN' })
      .expect(403);
  });

  it("bitta akkauntni ikki a'zoga bog'lab bo'lmaydi", async () => {
    await admin.put(`/api/team/${ceoId}`).send({ userId: staffUserId }).expect(200);

    const other = await admin
      .post('/api/team')
      .send({ name: 'Boshqa Xodim', position: { uz: 'Menejer' }, bio, department: 'OPERATIONS', userId: staffUserId })
      .expect(409);
    expect(other.body.error.code).toBe('USER_ALREADY_LINKED');

    // Keyingi testlar uchun bog'lanishni bo'shatamiz
    await admin.put(`/api/team/${ceoId}`).send({ userId: null }).expect(200);
  });

  it("mavjud bo'lmagan loyiha bilan saqlamaydi", async () => {
    const res = await admin
      .put(`/api/team/${ceoId}`)
      .send({ projects: [{ projectId: 'yoq-bunday-id' }] })
      .expect(400);
    expect(res.body.error.code).toBe('PROJECT_NOT_FOUND');
  });
});

describe('Jamoa — ommaviy API', () => {
  it('nashr qilinmagan xodim ro\'yxatda ham, slug bo\'yicha ham chiqmaydi', async () => {
    const created = await admin
      .post('/api/team')
      .send({ name: 'Yashirin Xodim', position: { uz: 'Sinov' }, bio, department: 'DATA', published: false })
      .expect(201);

    const list = await request(app).get('/api/team').expect(200);
    expect(list.body.data.some((m: { id: string }) => m.id === created.body.data.id)).toBe(false);

    await request(app).get(`/api/team/${created.body.data.slug}`).expect(404);
  });

  it("ro'yxatda rahbariyat birinchi turadi", async () => {
    const res = await request(app).get('/api/team').expect(200);
    expect(res.body.data[0].leadership).toBe(true);
  });

  it("ko'p tilli maydonlar tanlangan tilda bitta satr bo'lib qaytadi", async () => {
    const res = await request(app).get('/api/team/rustam-nazarov').expect(200);
    expect(res.body.data.position).toBe('Asoschi va CEO');
    expect(res.body.data.bio).toBe(bio.uz);
  });

  it("a'zoning loyihalari qaytariladi", async () => {
    const res = await request(app).get('/api/team/rustam-nazarov').expect(200);
    expect(res.body.data.projects).toHaveLength(1);
    expect(res.body.data.projects[0].project.title).toBe('Demo loyiha');
  });

  // Fokus nuqtasi ommaviy javobda BO'LISHI shart: usiz frontend rasmni
  // avvalgidek o'rtadan kesadi va portret suratlarda yuz kadrdan chiqadi
  it('rasm fokusi ommaviy javobda qaytadi (sukut bo\'yicha markaz)', async () => {
    const res = await request(app).get('/api/team/rustam-nazarov').expect(200);
    expect(res.body.data.focusX).toBe(50);
    expect(res.body.data.focusY).toBe(50);
  });
});

describe('Jamoa — rasm fokusi', () => {
  it('admin fokusni saqlaydi va u ommaviy javobda ko\'rinadi', async () => {
    await admin.put(`/api/team/${ceoId}`).send({ focusX: 50, focusY: 22 }).expect(200);

    const res = await request(app).get('/api/team/rustam-nazarov').expect(200);
    expect(res.body.data.focusY).toBe(22);
  });

  it('oraliqdan tashqari qiymat rad etiladi', async () => {
    await admin.put(`/api/team/${ceoId}`).send({ focusY: 140 }).expect(400);
    await admin.put(`/api/team/${ceoId}`).send({ focusX: -5 }).expect(400);

    // Rad etilgan so'rov avval saqlangan qiymatni buzmasligi kerak
    const unchanged = await prisma.teamMember.findUnique({ where: { id: ceoId } });
    expect(unchanged?.focusY).toBe(22);
  });
});

describe('Jamoa — xodimning shaxsiy kabineti', () => {
  it("profil bog'lanmagan bo'lsa tushunarli kod qaytadi", async () => {
    const res = await staff.get('/api/team/me').expect(403);
    expect(res.body.error.code).toBe('TEAM_PROFILE_NOT_LINKED');
  });

  it("bog'langandan keyin o'z profilini ko'radi va tahrirlaydi", async () => {
    await admin.put(`/api/team/${ceoId}`).send({ userId: staffUserId }).expect(200);

    const me = await staff.get('/api/team/me').expect(200);
    expect(me.body.data.id).toBe(ceoId);

    await staff.patch('/api/team/me').send({ skills: ['Node.js', 'SQL'], phone: '+998901234567' }).expect(200);
    const updated = await prisma.teamMember.findUnique({ where: { id: ceoId } });
    expect(updated?.skills).toEqual(['Node.js', 'SQL']);
    expect(updated?.phone).toBe('+998901234567');
  });

  it("xodim o'zini rahbariyatga yoki boshqa bo'limga ko'chira olmaydi", async () => {
    await staff.patch('/api/team/me').send({ leadership: false, department: 'MARKETING' }).expect(400);

    const unchanged = await prisma.teamMember.findUnique({ where: { id: ceoId } });
    expect(unchanged?.leadership).toBe(true);
    expect(unchanged?.department).toBe('LEADERSHIP');
  });

  it("ism o'zgarsa ommaviy manzil (slug) ham yangilanadi", async () => {
    await staff.patch('/api/team/me').send({ name: 'Rustam Nazarovich' }).expect(200);
    const renamed = await prisma.teamMember.findUnique({ where: { id: ceoId } });
    expect(renamed?.slug).toBe('rustam-nazarovich');
  });

  it("kirmagan foydalanuvchi kabinetga kira olmaydi", async () => {
    await request(app).get('/api/team/me').expect(401);
  });
});

describe('Jamoa — rol berilganda profil ochilishi', () => {
  it("foydalanuvchiga TEAM roli berilsa nashr qilinmagan profil avtomatik yaratiladi", async () => {
    const fresh = await createUser('yangi@test.uz', 'STUDENT', 'Yangi Xodim');
    await admin.patch(`/api/users/${fresh.id}/role`).send({ role: 'TEAM' }).expect(200);

    const profile = await prisma.teamMember.findUnique({ where: { userId: fresh.id } });
    expect(profile).not.toBeNull();
    expect(profile?.published).toBe(false);
    expect(profile?.slug).toBe('yangi-xodim');
  });
});
