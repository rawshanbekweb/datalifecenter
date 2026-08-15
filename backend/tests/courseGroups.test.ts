import { beforeAll, afterAll, describe, expect, it } from 'vitest';
import { prisma, resetDb, createUser, loginAgent } from './helpers';

/**
 * O'quv guruhlari: qabul qilingan o'quvchi qachon, qayerda va kim bilan
 * o'qishi. Bu yerdagi tekshiruvlar guruhning ikki vazifasini qamraydi —
 * jadvalni saqlash va o'quvchini to'g'ri guruhga tushirish.
 */

let admin: Awaited<ReturnType<typeof loginAgent>>;

async function createCourse(fields: Record<string, unknown>): Promise<{ id: string; slug: string }> {
  const res = await admin
    .post('/api/courses')
    .send({
      title: { uz: `Guruh testi ${Date.now()}-${Math.random()}` },
      description: { uz: 'Guruh testi uchun kurs' },
      durationMonths: 3,
      published: true,
      ...fields,
    })
    .expect(201);
  return { id: res.body.data.id, slug: res.body.data.slug };
}

async function newStudent(): Promise<Awaited<ReturnType<typeof loginAgent>>> {
  // Emaili tasdiqlangan: kurs so'rovi faqat shunday hisobdan qabul qilinadi
  const user = await createUser(`grp-${Date.now()}-${Math.random()}@test.uz`, 'STUDENT', 'Guruh Talabasi', true);
  return loginAgent(user.email);
}

/** So'rov yuborib, uni admin tasdiqlaydi — kerak bo'lsa guruhga qo'shib */
async function enrollViaRequest(
  student: Awaited<ReturnType<typeof loginAgent>>,
  courseId: string,
  format: 'ONLINE' | 'OFFLINE',
  groupId?: string,
): Promise<{ requestId: string; status: number }> {
  const created = await student
    .post('/api/course-requests')
    .send({ courseId, format, name: 'Talaba', phone: '+998901112233' })
    .expect(201);
  const res = await admin
    .post(`/api/course-requests/${created.body.data.id}/enroll`)
    .send(groupId ? { groupId } : {});
  return { requestId: created.body.data.id, status: res.status };
}

async function createGroup(fields: Record<string, unknown>): Promise<{ id: string; body: Record<string, unknown> }> {
  const res = await admin
    .post('/api/course-groups')
    .send({
      name: 'Kechki guruh',
      format: 'OFFLINE',
      startsAt: '2026-09-15',
      weekdays: [1, 3, 5],
      startTime: '18:00',
      room: '2-xona',
      capacity: 6,
      ...fields,
    })
    .expect(201);
  return { id: res.body.data.id, body: res.body.data };
}

beforeAll(async () => {
  await resetDb();
  await createUser('admin@test.uz', 'ADMIN');
  admin = await loginAgent('admin@test.uz');
});

afterAll(async () => {
  await prisma.$disconnect();
});

describe("O'quv guruhlari", () => {
  it('admin guruh ochadi va jadval saqlanadi', async () => {
    const course = await createCourse({ format: 'OFFLINE', price: 500000 });
    const { body } = await createGroup({ courseId: course.id, name: 'Python kechki' });

    expect(body.name).toBe('Python kechki');
    expect(body.weekdays).toEqual([1, 3, 5]);
    expect(body.startTime).toBe('18:00');
    expect(body.room).toBe('2-xona');
    expect(body.status).toBe('PLANNED');

    const list = await admin.get(`/api/course-groups?courseId=${course.id}`).expect(200);
    expect(list.body.data).toHaveLength(1);
  });

  it('hafta kunlari tartiblanadi va takrorlari tashlanadi', async () => {
    const course = await createCourse({ format: 'OFFLINE', price: 500000 });
    const { body } = await createGroup({ courseId: course.id, weekdays: [5, 1, 1, 3] });
    expect(body.weekdays).toEqual([1, 3, 5]);
  });

  it("kurs formatiga mos kelmagan guruh ochilmaydi", async () => {
    const course = await createCourse({ format: 'ONLINE', price: 0 });
    const res = await admin
      .post('/api/course-groups')
      .send({ courseId: course.id, name: 'Offline guruh', format: 'OFFLINE', startsAt: '2026-09-15' })
      .expect(400);
    expect(res.body.error.code).toBe('GROUP_FORMAT_MISMATCH');
  });

  it("noto'g'ri vaqt formati qabul qilinmaydi", async () => {
    const course = await createCourse({ format: 'OFFLINE', price: 500000 });
    await admin
      .post('/api/course-groups')
      .send({ courseId: course.id, name: 'Guruh', format: 'OFFLINE', startsAt: '2026-09-15', startTime: '25:99' })
      .expect(400);
  });

  it("o'quvchi guruhlar ro'yxatini ko'ra olmaydi", async () => {
    const student = await newStudent();
    await student.get('/api/course-groups').expect(403);
  });
});

describe("So'rovni tasdiqlashda guruhga qo'shish", () => {
  it("tanlangan guruh o'quvchining kabinetida jadval bilan ko'rinadi", async () => {
    const course = await createCourse({ format: 'OFFLINE', price: 500000, offlineSeats: 5 });
    const group = await createGroup({ courseId: course.id, name: 'Kechki A' });
    const student = await newStudent();

    const { status } = await enrollViaRequest(student, course.id, 'OFFLINE', group.id);
    expect(status).toBe(200);

    const mine = await student.get('/api/course-groups/mine').expect(200);
    expect(mine.body.data).toHaveLength(1);
    expect(mine.body.data[0].name).toBe('Kechki A');
    expect(mine.body.data[0].startTime).toBe('18:00');
    expect(mine.body.data[0].room).toBe('2-xona');
  });

  it("guruh to'lgan bo'lsa tasdiqlash to'xtaydi", async () => {
    const course = await createCourse({ format: 'OFFLINE', price: 500000, offlineSeats: 10 });
    const group = await createGroup({ courseId: course.id, capacity: 1 });

    const first = await newStudent();
    expect((await enrollViaRequest(first, course.id, 'OFFLINE', group.id)).status).toBe(200);

    const second = await newStudent();
    const secondReq = await second
      .post('/api/course-requests')
      .send({ courseId: course.id, format: 'OFFLINE', name: 'Ikkinchi', phone: '+998901112244' })
      .expect(201);
    const res = await admin
      .post(`/api/course-requests/${secondReq.body.data.id}/enroll`)
      .send({ groupId: group.id })
      .expect(409);
    expect(res.body.error.code).toBe('GROUP_FULL');
  });

  it("boshqa kursning guruhi qabul qilinmaydi", async () => {
    const course = await createCourse({ format: 'OFFLINE', price: 500000 });
    const other = await createCourse({ format: 'OFFLINE', price: 500000 });
    const alienGroup = await createGroup({ courseId: other.id });
    const student = await newStudent();

    const created = await student
      .post('/api/course-requests')
      .send({ courseId: course.id, format: 'OFFLINE', name: 'Talaba', phone: '+998901112255' })
      .expect(201);
    const res = await admin
      .post(`/api/course-requests/${created.body.data.id}/enroll`)
      .send({ groupId: alienGroup.id })
      .expect(400);
    expect(res.body.error.code).toBe('GROUP_COURSE_MISMATCH');
  });

  it("guruh tanlanmasa o'quvchi guruhsiz qabul qilinadi", async () => {
    const course = await createCourse({ format: 'OFFLINE', price: 500000 });
    const student = await newStudent();

    expect((await enrollViaRequest(student, course.id, 'OFFLINE')).status).toBe(200);
    const mine = await student.get('/api/course-groups/mine').expect(200);
    expect(mine.body.data).toHaveLength(0);
  });
});

describe("Guruh a'zolarini boshqarish", () => {
  it("admin o'quvchini guruhga qo'shadi va chiqaradi", async () => {
    const course = await createCourse({ format: 'OFFLINE', price: 500000 });
    const group = await createGroup({ courseId: course.id });
    const student = await newStudent();
    await enrollViaRequest(student, course.id, 'OFFLINE');

    const enrollment = await prisma.enrollment.findFirstOrThrow({ where: { courseId: course.id } });
    await admin.post(`/api/course-groups/${group.id}/members`).send({ enrollmentId: enrollment.id }).expect(200);

    const detail = await admin.get(`/api/course-groups/${group.id}`).expect(200);
    expect(detail.body.data.enrollments).toHaveLength(1);

    await admin.delete(`/api/course-groups/${group.id}/members/${enrollment.id}`).expect(200);
    const after = await admin.get(`/api/course-groups/${group.id}`).expect(200);
    expect(after.body.data.enrollments).toHaveLength(0);
  });

  it("guruh o'chirilsa o'quvchining yozilishi saqlanadi", async () => {
    const course = await createCourse({ format: 'OFFLINE', price: 500000 });
    const group = await createGroup({ courseId: course.id });
    const student = await newStudent();
    await enrollViaRequest(student, course.id, 'OFFLINE', group.id);

    await admin.delete(`/api/course-groups/${group.id}`).expect(200);

    // Yozilish o'chmaydi — o'quvchi kursda qoladi, faqat guruhi uziladi
    const enrollment = await prisma.enrollment.findFirstOrThrow({ where: { courseId: course.id } });
    expect(enrollment.status).toBe('ACTIVE');
    expect(enrollment.groupId).toBeNull();
  });

  it("tugagan guruhga o'quvchi qo'shilmaydi", async () => {
    const course = await createCourse({ format: 'OFFLINE', price: 500000 });
    const group = await createGroup({ courseId: course.id, status: 'FINISHED' });
    const student = await newStudent();
    await enrollViaRequest(student, course.id, 'OFFLINE');

    const enrollment = await prisma.enrollment.findFirstOrThrow({ where: { courseId: course.id } });
    const res = await admin
      .post(`/api/course-groups/${group.id}/members`)
      .send({ enrollmentId: enrollment.id })
      .expect(409);
    expect(res.body.error.code).toBe('GROUP_FINISHED');
  });
});
