import { beforeAll, afterAll, describe, expect, it } from 'vitest';
import request from 'supertest';
import crypto from 'crypto';
import { app, prisma, resetDb, createUser, loginAgent, TEST_PASSWORD } from './helpers';

beforeAll(async () => {
  await resetDb();
});

afterAll(async () => {
  await prisma.$disconnect();
});

describe('Auth', () => {
  it("ro'yxatdan o'tish va /me", async () => {
    const agent = request.agent(app);
    const res = await agent
      .post('/api/auth/register')
      .send({ name: 'Yangi Talaba', email: 'yangi@test.uz', password: 'Passw0rd!' })
      .expect(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data.user.email).toBe('yangi@test.uz');
    expect(res.body.data.user.role).toBe('STUDENT');
    expect(res.body.data.user.emailVerified).toBe(false);
    expect(res.body.data.user.passwordHash).toBeUndefined();
    // Token javob tanasida ham keladi (Safari — krossdomen cookie bloklanadi)
    expect(res.body.data.token).toBeTruthy();

    const me = await agent.get('/api/auth/me').expect(200);
    expect(me.body.data.email).toBe('yangi@test.uz');
  });

  it('Bearer header bilan cookie\'siz autentifikatsiya ishlaydi', async () => {
    const login = await request(app)
      .post('/api/auth/login')
      .send({ email: 'yangi@test.uz', password: 'Passw0rd!' })
      .expect(200);
    const token = login.body.data.token;

    const me = await request(app)
      .get('/api/auth/me')
      .set('Authorization', `Bearer ${token}`)
      .expect(200);
    expect(me.body.data.email).toBe('yangi@test.uz');
  });

  it('email tasdiqlash oqimi: token bilan tasdiqlanadi', async () => {
    const user = await prisma.user.findUnique({ where: { email: 'yangi@test.uz' } });
    const rawToken = crypto.randomBytes(32).toString('hex');
    const tokenHash = crypto.createHash('sha256').update(rawToken).digest('hex');
    await prisma.emailVerificationToken.deleteMany({ where: { userId: user!.id } });
    await prisma.emailVerificationToken.create({
      data: { userId: user!.id, tokenHash, expiresAt: new Date(Date.now() + 60_000) },
    });

    await request(app).post('/api/auth/verify-email').send({ token: rawToken }).expect(200);

    const updated = await prisma.user.findUnique({ where: { email: 'yangi@test.uz' } });
    expect(updated!.emailVerifiedAt).not.toBeNull();

    // Token bir martalik
    await request(app).post('/api/auth/verify-email').send({ token: rawToken }).expect(400);
  });

  it("parol o'zgarganda boshqa qurilmadagi sessiya bekor bo'ladi", async () => {
    await createUser('sessiya@test.uz');
    const device1 = await loginAgent('sessiya@test.uz');
    const device2 = await loginAgent('sessiya@test.uz');

    await device1
      .patch('/api/auth/me/password')
      .send({ currentPassword: TEST_PASSWORD, newPassword: 'YangiSessiya1!' })
      .expect(200);

    // device1 yangi cookie oldi — ishlashda davom etadi
    await device1.get('/api/auth/me').expect(200);
    // device2 esa eski token bilan qoldi — bekor qilingan
    const revoked = await device2.get('/api/auth/me').expect(401);
    expect(revoked.body.error.code).toBe('SESSION_REVOKED');
  });

  it('band email bilan register 409 qaytaradi', async () => {
    const res = await request(app)
      .post('/api/auth/register')
      .send({ name: 'Dublikat', email: 'yangi@test.uz', password: 'Passw0rd!' })
      .expect(409);
    expect(res.body.error.code).toBe('EMAIL_TAKEN');
  });

  it("noto'g'ri parol bilan login 401", async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: 'yangi@test.uz', password: 'notogri' })
      .expect(401);
    expect(res.body.error.code).toBe('INVALID_CREDENTIALS');
  });

  it('token siz /me 401', async () => {
    await request(app).get('/api/auth/me').expect(401);
  });

  it("parolni o'zgartirish va yangi parol bilan kirish", async () => {
    await createUser('parol@test.uz');
    const agent = await loginAgent('parol@test.uz');

    await agent
      .patch('/api/auth/me/password')
      .send({ currentPassword: TEST_PASSWORD, newPassword: 'YangiParol1!' })
      .expect(200);

    await request(app).post('/api/auth/login').send({ email: 'parol@test.uz', password: 'YangiParol1!' }).expect(200);
    await request(app).post('/api/auth/login').send({ email: 'parol@test.uz', password: TEST_PASSWORD }).expect(401);
  });

  it("forgot-password har doim 200 (email oshkor bo'lmaydi)", async () => {
    const known = await request(app).post('/api/auth/forgot-password').send({ email: 'parol@test.uz' }).expect(200);
    const unknown = await request(app).post('/api/auth/forgot-password').send({ email: 'mavjudmas@test.uz' }).expect(200);
    expect(known.body.data.message).toBe(unknown.body.data.message);

    // Mavjud user uchun token yaratilgan, mavjud bo'lmagani uchun yo'q
    const user = await prisma.user.findUnique({ where: { email: 'parol@test.uz' } });
    const tokens = await prisma.passwordResetToken.count({ where: { userId: user!.id } });
    expect(tokens).toBe(1);
  });

  it('reset-password: yaroqli token bilan paroli yangilanadi, token bir martalik', async () => {
    // Xom token faqat emailda bo'ladi — testda uni qo'lda yasab, hashini bazaga yozamiz
    const user = await prisma.user.findUnique({ where: { email: 'parol@test.uz' } });
    const rawToken = crypto.randomBytes(32).toString('hex');
    const tokenHash = crypto.createHash('sha256').update(rawToken).digest('hex');
    await prisma.passwordResetToken.deleteMany({ where: { userId: user!.id } });
    await prisma.passwordResetToken.create({
      data: { userId: user!.id, tokenHash, expiresAt: new Date(Date.now() + 60_000) },
    });

    await request(app)
      .post('/api/auth/reset-password')
      .send({ token: rawToken, newPassword: 'TiklanganParol1!' })
      .expect(200);

    await request(app).post('/api/auth/login').send({ email: 'parol@test.uz', password: 'TiklanganParol1!' }).expect(200);

    // Ikkinchi marta ishlamaydi
    const reuse = await request(app)
      .post('/api/auth/reset-password')
      .send({ token: rawToken, newPassword: 'YanaBoshqa1!' })
      .expect(400);
    expect(reuse.body.error.code).toBe('INVALID_RESET_TOKEN');
  });

  it("muddati o'tgan token rad etiladi", async () => {
    const user = await prisma.user.findUnique({ where: { email: 'parol@test.uz' } });
    const rawToken = crypto.randomBytes(32).toString('hex');
    const tokenHash = crypto.createHash('sha256').update(rawToken).digest('hex');
    await prisma.passwordResetToken.create({
      data: { userId: user!.id, tokenHash, expiresAt: new Date(Date.now() - 1000) },
    });

    await request(app)
      .post('/api/auth/reset-password')
      .send({ token: rawToken, newPassword: 'BuIshlamaydi1!' })
      .expect(400);
  });

  it('bloklangan foydalanuvchi kira olmaydi', async () => {
    const user = await createUser('blok@test.uz');
    await prisma.user.update({ where: { id: user.id }, data: { isBlocked: true } });
    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: 'blok@test.uz', password: TEST_PASSWORD })
      .expect(403);
    expect(res.body.error.code).toBe('USER_BLOCKED');
  });
});
