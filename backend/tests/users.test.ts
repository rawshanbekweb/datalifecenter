import { beforeAll, afterAll, describe, expect, it } from 'vitest';
import { prisma, resetDb, createUser, loginAgent } from './helpers';

beforeAll(async () => {
  await resetDb();
  await createUser('admin@test.uz', 'ADMIN', 'Bosh Admin');
  await createUser('tasdiqlangan@test.uz', 'STUDENT', 'Tasdiqlangan Talaba');
  await prisma.user.update({ where: { email: 'tasdiqlangan@test.uz' }, data: { emailVerifiedAt: new Date() } });
  await createUser('tasdiqlanmagan@test.uz', 'STUDENT', 'Tasdiqlanmagan Talaba');
});

afterAll(async () => {
  await prisma.$disconnect();
});

describe('Admin — foydalanuvchilar ro\'yxati', () => {
  it("emailVerifiedAt ro'yxatda qaytadi", async () => {
    const agent = await loginAgent('admin@test.uz');
    const res = await agent.get('/api/users').expect(200);
    const byEmail = Object.fromEntries(res.body.data.items.map((u: { email: string; emailVerifiedAt: string | null }) => [u.email, u.emailVerifiedAt]));
    expect(byEmail['tasdiqlangan@test.uz']).toBeTruthy();
    expect(byEmail['tasdiqlanmagan@test.uz']).toBeNull();
  });

  it('verified=false faqat tasdiqlanmaganlarni qaytaradi', async () => {
    const agent = await loginAgent('admin@test.uz');
    const res = await agent.get('/api/users?verified=false').expect(200);
    const emails = res.body.data.items.map((u: { email: string }) => u.email);
    expect(emails).toContain('tasdiqlanmagan@test.uz');
    expect(emails).not.toContain('tasdiqlangan@test.uz');
    expect(res.body.data.pagination.total).toBe(emails.length);
  });

  it('verified=true faqat tasdiqlanganlarni qaytaradi', async () => {
    const agent = await loginAgent('admin@test.uz');
    const res = await agent.get('/api/users?verified=true').expect(200);
    const emails = res.body.data.items.map((u: { email: string }) => u.email);
    expect(emails).toEqual(['tasdiqlangan@test.uz']);
  });

  it("verified noto'g'ri qiymat bilan 400", async () => {
    const agent = await loginAgent('admin@test.uz');
    await agent.get('/api/users?verified=hammasi').expect(400);
  });
});
