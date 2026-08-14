import { beforeAll, afterAll, describe, expect, it } from 'vitest';
import request from 'supertest';
import { app, prisma, resetDb, createUser, TEST_PASSWORD } from './helpers';
import { signToken, verifyToken } from '../src/utils/jwt';

/**
 * Kirilgan seanslar: ro'yxat, tanlab chiqarish va harakatsizlik chegarasi.
 *
 * DIQQAT: `tests/sessions.test.ts` boshqa narsa — u mentorning jonli darslari
 * (`LiveSession`) haqida.
 */

beforeAll(async () => {
  await resetDb();
});

afterAll(async () => {
  await prisma.$disconnect();
});

/** Login qilib token va undagi seans id'sini qaytaradi. */
async function login(email: string, userAgent = 'Mozilla/5.0 (Windows NT 10.0) Chrome/120.0 Safari/537.36') {
  const res = await request(app)
    .post('/api/auth/login')
    .set('User-Agent', userAgent)
    .send({ email, password: TEST_PASSWORD })
    .expect(200);
  const token: string = res.body.data.token;
  return { token, sid: verifyToken(token).sid as string };
}

/** Seansning oxirgi faolligini o'tmishga suradi (harakatsizlikni taqlid qilish). */
function ageSession(sid: string, ms: number) {
  return prisma.session.update({
    where: { id: sid },
    data: { lastSeenAt: new Date(Date.now() - ms) },
  });
}

const MINUTE = 60 * 1000;
const HOUR = 60 * MINUTE;

describe('Seans boshqaruvi', () => {
  it('login seans yozuvini yaratadi va tokenga sid qo\'yadi', async () => {
    await createUser('seans-login@test.uz');
    const { sid } = await login('seans-login@test.uz');

    const session = await prisma.session.findUnique({ where: { id: sid } });
    expect(session).not.toBeNull();
    expect(session!.revokedAt).toBeNull();
    // Ro'yxatda qurilmani tanish uchun User-Agent saqlanadi
    expect(session!.userAgent).toContain('Chrome');
  });

  it('chiqish seansni yopadi va o\'sha token endi ishlamaydi', async () => {
    await createUser('seans-logout@test.uz');
    const { token, sid } = await login('seans-logout@test.uz');

    await request(app).get('/api/auth/me').set('Authorization', `Bearer ${token}`).expect(200);
    await request(app).post('/api/auth/logout').set('Authorization', `Bearer ${token}`).expect(200);

    const session = await prisma.session.findUnique({ where: { id: sid } });
    expect(session!.revokedAt).not.toBeNull();

    // Aynan shu nuqsonni tuzatish uchun qilingan: avval token yana 7 kun ishlardi
    const after = await request(app).get('/api/auth/me').set('Authorization', `Bearer ${token}`).expect(401);
    expect(after.body.error.code).toBe('SESSION_REVOKED');
  });

  it("sid'siz eski token rad etiladi", async () => {
    const user = await createUser('seans-eski@test.uz');
    const legacyToken = signToken({ userId: user.id, role: user.role, tv: user.tokenVersion });

    const res = await request(app)
      .get('/api/auth/me')
      .set('Authorization', `Bearer ${legacyToken}`)
      .expect(401);
    expect(res.body.error.code).toBe('SESSION_REVOKED');
  });

  it("mavjud bo'lmagan seans id'si bilan token rad etiladi", async () => {
    const user = await createUser('seans-yolq@test.uz');
    const token = signToken({ userId: user.id, role: user.role, tv: user.tokenVersion, sid: 'yoq-bunday-seans' });

    const res = await request(app).get('/api/auth/me').set('Authorization', `Bearer ${token}`).expect(401);
    expect(res.body.error.code).toBe('SESSION_REVOKED');
  });

  describe('harakatsizlik chegarasi rolga qarab', () => {
    it('ADMIN 61 daqiqadan keyin chiqariladi', async () => {
      await createUser('seans-admin@test.uz', 'ADMIN');
      const { token, sid } = await login('seans-admin@test.uz');
      await ageSession(sid, 61 * MINUTE);

      const res = await request(app).get('/api/auth/me').set('Authorization', `Bearer ${token}`).expect(401);
      expect(res.body.error.code).toBe('SESSION_IDLE');

      // Chiqarilgan seans yopiq bo'lib qoladi — qayta tiklanmaydi
      const session = await prisma.session.findUnique({ where: { id: sid } });
      expect(session!.revokedAt).not.toBeNull();
    });

    it('STUDENT 61 daqiqadan keyin ham ishlayveradi (darsni o\'qib o\'tirgan bo\'lishi mumkin)', async () => {
      await createUser('seans-talaba@test.uz');
      const { token, sid } = await login('seans-talaba@test.uz');
      await ageSession(sid, 61 * MINUTE);

      await request(app).get('/api/auth/me').set('Authorization', `Bearer ${token}`).expect(200);
    });

    it('STUDENT 13 soatdan keyin chiqariladi', async () => {
      await createUser('seans-talaba2@test.uz');
      const { token, sid } = await login('seans-talaba2@test.uz');
      await ageSession(sid, 13 * HOUR);

      const res = await request(app).get('/api/auth/me').set('Authorization', `Bearer ${token}`).expect(401);
      expect(res.body.error.code).toBe('SESSION_IDLE');
    });
  });

  it("lastSeenAt daqiqasiga ko'pi bilan bir marta yoziladi", async () => {
    await createUser('seans-throttle@test.uz');
    const { token, sid } = await login('seans-throttle@test.uz');

    // 2 daqiqa eski — birinchi so'rov yangilaydi
    await ageSession(sid, 2 * MINUTE);
    await request(app).get('/api/auth/me').set('Authorization', `Bearer ${token}`).expect(200);
    const first = await prisma.session.findUnique({ where: { id: sid } });

    // Darhol keyingi so'rov yozuv qilmasligi kerak
    await request(app).get('/api/auth/me').set('Authorization', `Bearer ${token}`).expect(200);
    const second = await prisma.session.findUnique({ where: { id: sid } });

    expect(second!.lastSeenAt.getTime()).toBe(first!.lastSeenAt.getTime());
  });

  it('seanslar ro\'yxati joriysini belgilaydi', async () => {
    await createUser('seans-royxat@test.uz');
    const a = await login('seans-royxat@test.uz', 'Mozilla/5.0 (iPhone) Safari/604.1');
    const b = await login('seans-royxat@test.uz');

    const res = await request(app)
      .get('/api/auth/sessions')
      .set('Authorization', `Bearer ${b.token}`)
      .expect(200);

    const list = res.body.data;
    expect(list).toHaveLength(2);
    expect(list.filter((s: { isCurrent: boolean }) => s.isCurrent)).toHaveLength(1);
    expect(list.find((s: { id: string }) => s.id === b.sid).isCurrent).toBe(true);
    // Qurilma yorlig'i o'qiladigan ko'rinishda bo'ladi
    expect(list.find((s: { id: string }) => s.id === a.sid).device).toBe('Safari · iOS');
  });

  it("'boshqa qurilmalardan chiqish' joriy seansga tegmaydi", async () => {
    await createUser('seans-boshqa@test.uz');
    const first = await login('seans-boshqa@test.uz');
    const second = await login('seans-boshqa@test.uz');
    const third = await login('seans-boshqa@test.uz');

    const res = await request(app)
      .delete('/api/auth/sessions/others')
      .set('Authorization', `Bearer ${third.token}`)
      .expect(200);
    expect(res.body.data.count).toBe(2);

    await request(app).get('/api/auth/me').set('Authorization', `Bearer ${third.token}`).expect(200);
    await request(app).get('/api/auth/me').set('Authorization', `Bearer ${first.token}`).expect(401);
    await request(app).get('/api/auth/me').set('Authorization', `Bearer ${second.token}`).expect(401);
  });

  it('bitta seansni tanlab yopish mumkin', async () => {
    await createUser('seans-bitta@test.uz');
    const keep = await login('seans-bitta@test.uz');
    const drop = await login('seans-bitta@test.uz');

    await request(app)
      .delete(`/api/auth/sessions/${drop.sid}`)
      .set('Authorization', `Bearer ${keep.token}`)
      .expect(200);

    await request(app).get('/api/auth/me').set('Authorization', `Bearer ${drop.token}`).expect(401);
    await request(app).get('/api/auth/me').set('Authorization', `Bearer ${keep.token}`).expect(200);
  });

  it("begona foydalanuvchining seansini yopib bo'lmaydi", async () => {
    await createUser('seans-egasi@test.uz');
    await createUser('seans-buzgunchi@test.uz');
    const victim = await login('seans-egasi@test.uz');
    const attacker = await login('seans-buzgunchi@test.uz');

    await request(app)
      .delete(`/api/auth/sessions/${victim.sid}`)
      .set('Authorization', `Bearer ${attacker.token}`)
      .expect(404);

    // Qurbonning seansi ochiqligicha qoladi
    await request(app).get('/api/auth/me').set('Authorization', `Bearer ${victim.token}`).expect(200);
  });

  it('heartbeat 204 qaytaradi va faollikni yangilaydi', async () => {
    await createUser('seans-heartbeat@test.uz');
    const { token, sid } = await login('seans-heartbeat@test.uz');
    await ageSession(sid, 5 * MINUTE);
    const before = await prisma.session.findUnique({ where: { id: sid } });

    await request(app).get('/api/auth/heartbeat').set('Authorization', `Bearer ${token}`).expect(204);

    const after = await prisma.session.findUnique({ where: { id: sid } });
    expect(after!.lastSeenAt.getTime()).toBeGreaterThan(before!.lastSeenAt.getTime());
  });

  it("parol o'zgarganda hamma seans yopilib, joriysiga yangisi ochiladi", async () => {
    await createUser('seans-parol@test.uz');
    const old = await login('seans-parol@test.uz');
    const other = await login('seans-parol@test.uz');

    const res = await request(app)
      .patch('/api/auth/me/password')
      .set('Authorization', `Bearer ${old.token}`)
      .send({ currentPassword: TEST_PASSWORD, newPassword: 'YangiParol1!' })
      .expect(200);

    const newToken = res.body.data.token;
    // Yangi token ishlaydi, ikkala eskisi ham yo'q
    await request(app).get('/api/auth/me').set('Authorization', `Bearer ${newToken}`).expect(200);
    await request(app).get('/api/auth/me').set('Authorization', `Bearer ${old.token}`).expect(401);
    await request(app).get('/api/auth/me').set('Authorization', `Bearer ${other.token}`).expect(401);

    // Ro'yxatda faqat bitta ochiq seans qoladi
    const list = await request(app)
      .get('/api/auth/sessions')
      .set('Authorization', `Bearer ${newToken}`)
      .expect(200);
    expect(list.body.data).toHaveLength(1);
  });
});
