import { beforeAll, afterAll, describe, expect, it } from 'vitest';
import request from 'supertest';
import { app, prisma, resetDb, createUser, loginAgent } from './helpers';

let admin: Awaited<ReturnType<typeof loginAgent>>;
let student: Awaited<ReturnType<typeof loginAgent>>;
let momentId: string;

const title = { uz: "Ochilish marosimi" };

// Ommaviy ro'yxat keshlanadi (middleware/publicCache) va kesh faqat API orqali
// yozilganda tozalanadi — to'g'ridan-to'g'ri Prisma bilan yozadigan testlar
// uchun har so'rovga alohida kalit kerak
let cacheKey = 0;
const fresh = (path: string): string => `${path}?cb=${++cacheKey}`;

beforeAll(async () => {
  await resetDb();
  await createUser('admin@test.uz', 'ADMIN');
  admin = await loginAgent('admin@test.uz');
  await createUser('oquvchi@test.uz', 'STUDENT');
  student = await loginAgent('oquvchi@test.uz');
});

afterAll(async () => {
  await prisma.$disconnect();
});

describe('Bir kun galereyasi — admin CRUD', () => {
  it('admin surat qo\'shadi', async () => {
    const res = await admin
      .post('/api/moments')
      .send({ imageUrl: 'https://misol.uz/1.webp', title, caption: { uz: 'Qisqa izoh' }, happenedAt: '2026-08-01', order: 1 })
      .expect(201);

    momentId = res.body.data.id;
    expect(res.body.data.published).toBe(true);
    // Fokus berilmasa markaz qoladi
    expect(res.body.data.focusX).toBe(50);
  });

  it("rasmsiz saqlab bo'lmaydi", async () => {
    await admin.post('/api/moments').send({ title }).expect(400);
  });

  it("bo'sh sana null bo'lib saqlanadi (input tozalanganda bo'sh satr keladi)", async () => {
    const res = await admin
      .post('/api/moments')
      .send({ imageUrl: 'https://misol.uz/2.webp', title: { uz: 'Sanasiz voqea' }, happenedAt: '' })
      .expect(201);
    expect(res.body.data.happenedAt).toBeNull();
  });

  it("noto'g'ri sana rad etiladi", async () => {
    await admin
      .post('/api/moments')
      .send({ imageUrl: 'https://misol.uz/3.webp', title: { uz: 'Xato sana' }, happenedAt: 'kecha' })
      .expect(400);
  });

  it("admin bo'lmagan foydalanuvchi qo'sha olmaydi", async () => {
    await student.post('/api/moments').send({ imageUrl: 'https://misol.uz/x.webp', title }).expect(403);
  });

  it('fokus oralig\'idan tashqari qiymat rad etiladi', async () => {
    await admin.put(`/api/moments/${momentId}`).send({ focusX: 140 }).expect(400);
  });
});

describe('Bir kun galereyasi — ommaviy API', () => {
  it("nashr qilinmagan surat ommaviy ro'yxatda chiqmaydi", async () => {
    const hidden = await admin
      .post('/api/moments')
      .send({ imageUrl: 'https://misol.uz/yashirin.webp', title: { uz: 'Yashirin' }, published: false })
      .expect(201);

    const res = await request(app).get(fresh('/api/moments')).expect(200);
    expect(res.body.data.some((m: { id: string }) => m.id === hidden.body.data.id)).toBe(false);
  });

  it("ko'p tilli sarlavha tanlangan tilda bitta satr bo'lib qaytadi", async () => {
    const res = await request(app).get(fresh('/api/moments')).expect(200);
    const found = res.body.data.find((m: { id: string }) => m.id === momentId);
    expect(found.title).toBe(title.uz);
    expect(found.caption).toBe('Qisqa izoh');
  });

  it("tartib `order` bo'yicha — kichigi oldinda", async () => {
    await admin
      .post('/api/moments')
      .send({ imageUrl: 'https://misol.uz/birinchi.webp', title: { uz: 'Eng oldinda' }, order: -5 })
      .expect(201);

    const res = await request(app).get(fresh('/api/moments')).expect(200);
    expect(res.body.data[0].title).toBe('Eng oldinda');
  });

  it("admin o'chirsa ro'yxatdan ketadi", async () => {
    await admin.delete(`/api/moments/${momentId}`).expect(200);
    const res = await request(app).get(fresh('/api/moments')).expect(200);
    expect(res.body.data.some((m: { id: string }) => m.id === momentId)).toBe(false);
  });
});
