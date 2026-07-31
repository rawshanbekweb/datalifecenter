import { beforeAll, afterAll, describe, expect, it } from 'vitest';
import request from 'supertest';
import { app, prisma, resetDb, createUser, loginAgent } from './helpers';

let admin: Awaited<ReturnType<typeof loginAgent>>;
let slug: string;
let postId: string;

beforeAll(async () => {
  await resetDb();
  await createUser('admin@test.uz', 'ADMIN');
  admin = await loginAgent('admin@test.uz');

  const res = await admin.post('/api/blog').send({
    title: { uz: 'Test Maqolasi' },
    excerpt: { uz: 'Qisqacha mazmun' },
    content: { uz: "To'liq matn kamida o'n belgidan iborat" },
    category: 'Umumiy',
    published: true,
  });
  slug = res.body.data.slug;
  postId = res.body.data.id;
});

afterAll(async () => {
  await prisma.$disconnect();
});

/**
 * Ko'rishlar endi GET ichida emas, alohida `POST /api/engagement/blog/:id/view`
 * orqali hisoblanadi va dublikat `X-Device-Id` bo'yicha BAZADA tekshiriladi
 * (ilgari `bv_` cookie'si ishlatilardi — krossdomen cookie Safari'da
 * bloklangani uchun o'sha brauzerlarda hisob oshib ketardi).
 */
describe("Blog ko'rishlar soni (views)", () => {
  it("maqolani ochish o'zi hisobni oshirmaydi", async () => {
    const res = await request(app).get(`/api/blog/${slug}`).expect(200);
    expect(res.body.data.views).toBe(0);
  });

  it('view yuborilganda +1 bo\'ladi', async () => {
    const res = await request(app)
      .post(`/api/engagement/blog/${postId}/view`)
      .set('X-Device-Id', 'device-aaaaaaaa')
      .expect(200);
    expect(res.body.data).toMatchObject({ views: 1, counted: true });
  });

  it("bir xil qurilma qayta yuborsa oshmaydi", async () => {
    for (let i = 0; i < 3; i += 1) {
      const res = await request(app)
        .post(`/api/engagement/blog/${postId}/view`)
        .set('X-Device-Id', 'device-aaaaaaaa')
        .expect(200);
      expect(res.body.data).toMatchObject({ views: 1, counted: false });
    }
  });

  it('boshqa qurilma qayta oshiradi', async () => {
    const res = await request(app)
      .post(`/api/engagement/blog/${postId}/view`)
      .set('X-Device-Id', 'device-bbbbbbbb')
      .expect(200);
    expect(res.body.data).toMatchObject({ views: 2, counted: true });
  });

  it('qurilma identifikatorisiz rad etiladi', async () => {
    const res = await request(app).post(`/api/engagement/blog/${postId}/view`).expect(400);
    expect(res.body.error.code).toBe('DEVICE_ID_REQUIRED');
  });
});

describe('Yoqtirish (like)', () => {
  it("birinchi bosishda qo'yiladi", async () => {
    const res = await request(app)
      .post(`/api/engagement/blog/${postId}/like`)
      .set('X-Device-Id', 'device-aaaaaaaa')
      .expect(200);
    expect(res.body.data).toEqual({ liked: true, likesCount: 1 });
  });

  it('takroriy bosishda olinadi (toggle)', async () => {
    const res = await request(app)
      .post(`/api/engagement/blog/${postId}/like`)
      .set('X-Device-Id', 'device-aaaaaaaa')
      .expect(200);
    expect(res.body.data).toEqual({ liked: false, likesCount: 0 });
  });

  it("turli qurilmalar alohida sanaladi", async () => {
    await request(app).post(`/api/engagement/blog/${postId}/like`).set('X-Device-Id', 'device-aaaaaaaa');
    const res = await request(app)
      .post(`/api/engagement/blog/${postId}/like`)
      .set('X-Device-Id', 'device-bbbbbbbb')
      .expect(200);
    expect(res.body.data).toEqual({ liked: true, likesCount: 2 });
  });

  it('statistika shu qurilmaning holatini qaytaradi', async () => {
    const mine = await request(app)
      .get('/api/engagement/blog')
      .query({ ids: postId })
      .set('X-Device-Id', 'device-aaaaaaaa')
      .expect(200);
    expect(mine.body.data[0]).toMatchObject({ contentId: postId, likesCount: 2, liked: true });

    // Identifikatorsiz — hech narsa yoqtirilmagan holatda ko'rinadi
    const anon = await request(app).get('/api/engagement/blog').query({ ids: postId }).expect(200);
    expect(anon.body.data[0]).toMatchObject({ likesCount: 2, liked: false });
  });

  it('nashr qilinmagan kontentni yoqtirib bo\'lmaydi', async () => {
    const draft = await admin.post('/api/blog').send({
      title: { uz: 'Qoralama' },
      excerpt: { uz: 'Qisqacha' },
      content: { uz: "To'liq matn kamida o'n belgidan iborat" },
      category: 'Umumiy',
      published: false,
    });

    const res = await request(app)
      .post(`/api/engagement/blog/${draft.body.data.id}/like`)
      .set('X-Device-Id', 'device-aaaaaaaa')
      .expect(404);
    expect(res.body.error.code).toBe('CONTENT_NOT_FOUND');
  });

  it("maqola o'chirilganda yoqtirishlar ham tozalanadi", async () => {
    await admin.delete(`/api/blog/${postId}`).expect(200);
    const left = await prisma.contentLike.count({ where: { contentType: 'BLOG_POST', contentId: postId } });
    const views = await prisma.contentView.count({ where: { contentType: 'BLOG_POST', contentId: postId } });
    expect(left).toBe(0);
    expect(views).toBe(0);
  });
});
