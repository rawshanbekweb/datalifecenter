import { beforeAll, afterAll, describe, expect, it } from 'vitest';
import { prisma, resetDb, createUser, loginAgent } from './helpers';

/**
 * Kursda BIR NECHTA mentor bo'lishi — eng muhim qoida shu: kursga
 * biriktirilgan har bir mentor uni TENG boshqaradi. Sinovlar aynan shuni
 * tekshiradi, chunki ilgari huquq "kursning yagona mentoriman" degan
 * shartga bog'langan edi va qo'shimcha mentorlar hech nimaga kira olmasdi.
 */

let admin: Awaited<ReturnType<typeof loginAgent>>;
let leadAgent: Awaited<ReturnType<typeof loginAgent>>;
let coAgent: Awaited<ReturnType<typeof loginAgent>>;
let outsiderAgent: Awaited<ReturnType<typeof loginAgent>>;

let leadMentorId: string;
let coMentorId: string;
let outsiderMentorId: string;
let courseId: string;

beforeAll(async () => {
  await resetDb();
  await createUser('admin@cm.uz', 'ADMIN');
  const leadUser = await createUser('lead@cm.uz', 'MENTOR', 'Lead Mentor');
  const coUser = await createUser('co@cm.uz', 'MENTOR', 'Co Mentor');
  const outsiderUser = await createUser('outsider@cm.uz', 'MENTOR', 'Outsider Mentor');

  admin = await loginAgent('admin@cm.uz');
  leadAgent = await loginAgent('lead@cm.uz');
  coAgent = await loginAgent('co@cm.uz');
  outsiderAgent = await loginAgent('outsider@cm.uz');

  const mentorRow = (name: string, userId: string) =>
    prisma.mentor.create({ data: { name, bio: { uz: 'Bio' }, specialty: { uz: 'Backend' }, userId } });

  leadMentorId = (await mentorRow('Lead Mentor', leadUser.id)).id;
  coMentorId = (await mentorRow('Co Mentor', coUser.id)).id;
  outsiderMentorId = (await mentorRow('Outsider Mentor', outsiderUser.id)).id;
});

afterAll(async () => {
  await prisma.$disconnect();
});

describe("Kursga bir nechta mentor biriktirish", () => {
  it("admin kursni ikkita mentor bilan yaratadi — birinchisi asosiy bo'ladi", async () => {
    const res = await admin
      .post('/api/courses')
      .send({
        title: { uz: "Ko'p Mentorli Kurs" },
        description: { uz: 'Ikki mentor birga olib boradi' },
        durationMonths: 2,
        price: 0,
        published: true,
        mentorIds: [leadMentorId, coMentorId],
      })
      .expect(201);

    courseId = res.body.data.id;
    expect(res.body.data.mentors).toHaveLength(2);
    expect(res.body.data.mentors[0].id).toBe(leadMentorId);
    expect(res.body.data.mentors[0].isLead).toBe(true);
    expect(res.body.data.mentors[1].isLead).toBe(false);
  });

  it("ochiq kurs sahifasi ikkala mentorni ham qaytaradi", async () => {
    const res = await admin.get('/api/courses/kop-mentorli-kurs').expect(200);
    expect(res.body.data.mentors.map((m: { name: string }) => m.name)).toEqual(['Lead Mentor', 'Co Mentor']);
  });

  it("ikkala mentor ham kursni o'z kabinetida ko'radi", async () => {
    for (const agent of [leadAgent, coAgent]) {
      const res = await agent.get('/api/mentors/me/dashboard').expect(200);
      expect(res.body.data.mentor.courses.map((c: { id: string }) => c.id)).toContain(courseId);
    }
  });

  it("qo'shimcha mentor ham kurs dasturini ochadi, begona mentor ocholmaydi", async () => {
    await coAgent.get(`/api/mentors/me/courses/${courseId}`).expect(200);
    await outsiderAgent.get(`/api/mentors/me/courses/${courseId}`).expect(404);
  });

  it("qo'shimcha mentor kursga jonli dars qo'sha oladi", async () => {
    const res = await coAgent
      .post('/api/sessions')
      .send({
        courseId,
        title: { uz: 'Amaliyot darsi' },
        meetingUrl: 'https://meet.jit.si/co-mentor-dars',
        startsAt: new Date(Date.now() + 3600 * 1000).toISOString(),
        durationMin: 60,
      })
      .expect(201);
    // Sessiyaning muallifi — uni yaratgan mentor, kursning asosiysi emas
    expect(res.body.data.mentorId).toBe(coMentorId);
  });

  it("asosiy mentor hamkasbi yaratgan darsni ham ro'yxatda ko'radi", async () => {
    const res = await leadAgent.get('/api/sessions/manage').expect(200);
    expect(res.body.data).toHaveLength(1);
    expect(res.body.data[0].mentor.id).toBe(coMentorId);
  });

  it("begona mentor kursga dars qo'sha olmaydi (403)", async () => {
    await outsiderAgent
      .post('/api/sessions')
      .send({
        courseId,
        title: { uz: 'Ruxsatsiz dars' },
        meetingUrl: 'https://meet.jit.si/ruxsatsiz',
        startsAt: new Date(Date.now() + 3600 * 1000).toISOString(),
        durationMin: 60,
      })
      .expect(403);
  });

  it("ro'yxatni yangilash asosiy mentorni ham almashtiradi", async () => {
    const res = await admin
      .put(`/api/courses/${courseId}`)
      .send({ mentorIds: [coMentorId, outsiderMentorId] })
      .expect(200);

    expect(res.body.data.mentors.map((m: { id: string }) => m.id)).toEqual([coMentorId, outsiderMentorId]);
    expect(res.body.data.mentors[0].isLead).toBe(true);

    // Ro'yxatdan chiqarilgan mentor kursni boshqara olmaydi
    await leadAgent.get(`/api/mentors/me/courses/${courseId}`).expect(404);
  });

  it("mentorIds yuborilmasa mentorlar ro'yxati tegilmaydi", async () => {
    const res = await admin.put(`/api/courses/${courseId}`).send({ durationMonths: 5 }).expect(200);
    expect(res.body.data.mentors).toHaveLength(2);
  });

  it("bo'sh ro'yxat kursni mentorsiz qoldiradi", async () => {
    const res = await admin.put(`/api/courses/${courseId}`).send({ mentorIds: [] }).expect(200);
    expect(res.body.data.mentors).toHaveLength(0);
  });

  it("kursga biriktirilgan mentorni o'chirib bo'lmaydi (409)", async () => {
    await admin.put(`/api/courses/${courseId}`).send({ mentorIds: [leadMentorId] }).expect(200);
    const res = await admin.delete(`/api/mentors/${leadMentorId}`).expect(409);
    expect(res.body.error.code).toBe('MENTOR_HAS_COURSES');
  });
});
