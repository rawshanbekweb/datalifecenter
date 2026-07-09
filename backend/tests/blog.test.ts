import { beforeAll, afterAll, describe, expect, it } from 'vitest';
import request from 'supertest';
import { app, prisma, resetDb, createUser, loginAgent } from './helpers';

let admin: Awaited<ReturnType<typeof loginAgent>>;
let slug: string;

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
});

afterAll(async () => {
  await prisma.$disconnect();
});

describe("Blog ko'rishlar soni (views) dublikatga qarshi himoya", () => {
  it("birinchi ochilishda +1 bo'ladi va cookie o'rnatiladi", async () => {
    const res = await request(app).get(`/api/blog/${slug}`).expect(200);
    expect(res.body.data.views).toBe(1);
    expect(res.headers['set-cookie']?.some((c: string) => c.startsWith(`bv_`))).toBe(true);
  });

  it('bir xil cookie bilan qayta ochilsa oshmaydi', async () => {
    const first = await request.agent(app).get(`/api/blog/${slug}`);
    expect(first.body.data.views).toBe(2);

    const agent = request.agent(app);
    const r1 = await agent.get(`/api/blog/${slug}`);
    expect(r1.body.data.views).toBe(3);
    const r2 = await agent.get(`/api/blog/${slug}`);
    expect(r2.body.data.views).toBe(3);
    const r3 = await agent.get(`/api/blog/${slug}`);
    expect(r3.body.data.views).toBe(3);
  });

  it('cookie bo\'lmagan yangi so\'rov qayta oshiradi', async () => {
    const res = await request(app).get(`/api/blog/${slug}`).expect(200);
    expect(res.body.data.views).toBe(4);
  });
});
