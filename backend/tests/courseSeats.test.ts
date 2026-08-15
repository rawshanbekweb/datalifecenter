import { beforeAll, afterAll, describe, expect, it } from 'vitest';
import { prisma, resetDb, createUser, loginAgent } from './helpers';

let admin: Awaited<ReturnType<typeof loginAgent>>;

async function createCourse(fields: Record<string, unknown>): Promise<{ id: string; slug: string }> {
  const res = await admin
    .post('/api/courses')
    .send({
      title: { uz: `Joy testi ${Date.now()}-${Math.random()}` },
      description: { uz: 'Guruh sig\'imi testi uchun kurs' },
      durationMonths: 1,
      published: true,
      ...fields,
    })
    .expect(201);
  return { id: res.body.data.id, slug: res.body.data.slug };
}

async function newStudent(): Promise<Awaited<ReturnType<typeof loginAgent>>> {
  // emaili tasdiqlangan: kurs so'rovi faqat tasdiqlangan hisobdan qabul qilinadi
  const user = await createUser(`seat-${Date.now()}-${Math.random()}@test.uz`, 'STUDENT', 'Test User', true);
  return loginAgent(user.email);
}

beforeAll(async () => {
  await resetDb();
  await createUser('admin@test.uz', 'ADMIN');
  admin = await loginAgent('admin@test.uz');
});

afterAll(async () => {
  await prisma.$disconnect();
});

describe('Guruh sig\'imi (5-6 kishilik guruh)', () => {
  it('bepul kursda joylar tugagach yangi yozilish 409 COURSE_FULL qaytaradi', async () => {
    const course = await createCourse({ price: 0, onlineSeats: 2 });

    const first = await newStudent();
    const second = await newStudent();
    const third = await newStudent();

    await first.post('/api/enrollments').send({ courseId: course.id }).expect(201);
    await second.post('/api/enrollments').send({ courseId: course.id }).expect(201);

    const res = await third.post('/api/enrollments').send({ courseId: course.id }).expect(409);
    expect(res.body.error.code).toBe('COURSE_FULL');
  });

  it('kursni tamomlagan o\'quvchi joyni bo\'shatadi', async () => {
    const course = await createCourse({ price: 0, onlineSeats: 1 });
    const busy = await newStudent();
    const next = await newStudent();

    const enrolled = await busy.post('/api/enrollments').send({ courseId: course.id }).expect(201);
    await next.post('/api/enrollments').send({ courseId: course.id }).expect(409);

    await prisma.enrollment.update({ where: { id: enrolled.body.data.id }, data: { status: 'COMPLETED' } });
    await next.post('/api/enrollments').send({ courseId: course.id }).expect(201);
  });

  it('kurs javobida joy holati qaytadi (total/taken/left/full)', async () => {
    const course = await createCourse({ price: 0, onlineSeats: 2 });
    const student = await newStudent();
    await student.post('/api/enrollments').send({ courseId: course.id }).expect(201);

    const res = await admin.get(`/api/courses/${course.slug}`).expect(200);
    expect(res.body.data.seats.online).toMatchObject({ total: 2, taken: 1, left: 1, full: false });
    // Chegara qo'yilmagan tomon cheklanmagan bo'lib qoladi
    expect(res.body.data.seats.offline).toMatchObject({ total: null, full: false });
  });

  it('joy soni belgilanmagan kursda yozilish cheklanmaydi', async () => {
    const course = await createCourse({ price: 0 });
    for (let i = 0; i < 3; i += 1) {
      const student = await newStudent();
      await student.post('/api/enrollments').send({ courseId: course.id }).expect(201);
    }
  });
});

describe("So'rovni admin tasdiqlab kursga qo'shishi", () => {
  it("onlayn so'rov tasdiqlansa Enrollment ACTIVE/PAID bo'ladi va so'rov ENROLLED holatiga o'tadi", async () => {
    const course = await createCourse({ price: 700000, onlineSeats: 5 });
    const student = await newStudent();

    const created = await student
      .post('/api/course-requests')
      .send({ courseId: course.id, format: 'ONLINE', name: 'Talaba', phone: '+998901112233' })
      .expect(201);

    const enrolled = await admin.post(`/api/course-requests/${created.body.data.id}/enroll`).expect(200);
    expect(enrolled.body.data.status).toBe('ENROLLED');

    const learn = await student.get(`/api/courses/${course.slug}/learn`).expect(200);
    expect(learn.body.data.enrollment.status).toBe('ACTIVE');
    expect(learn.body.data.enrollment.paymentStatus).toBe('PAID');
  });

  it("offline so'rov tasdiqlansa markazdagi o'quvchi ham Enrollment oladi", async () => {
    const course = await createCourse({ price: 500000, offlinePrice: 900000, format: 'OFFLINE', offlineSeats: 3 });
    const student = await newStudent();

    const created = await student
      .post('/api/course-requests')
      .send({ courseId: course.id, format: 'OFFLINE', name: 'Markaz talabasi', phone: '+998901112266' })
      .expect(201);
    await admin.post(`/api/course-requests/${created.body.data.id}/enroll`).expect(200);

    const mine = await student.get('/api/enrollments/me').expect(200);
    const row = mine.body.data.find((e: { course: { slug: string } }) => e.course.slug === course.slug);
    expect(row).toBeDefined();
    expect(row.format).toBe('OFFLINE');
    expect(row.status).toBe('ACTIVE');
    expect(row.paymentStatus).toBe('PAID');
    // Markazda o'qish narxi alohida — onlayn narx yozilmasligi kerak
    expect(Number(row.amountPaid)).toBe(900000);
  });

  it("offline yozilish bekor qilinsa joy bo'shaydi", async () => {
    const course = await createCourse({ price: 500000, offlineSeats: 1, format: 'OFFLINE' });
    const first = await newStudent();
    const second = await newStudent();

    const firstReq = await first
      .post('/api/course-requests')
      .send({ courseId: course.id, format: 'OFFLINE', name: 'Ketuvchi', phone: '+998901112277' })
      .expect(201);
    await admin.post(`/api/course-requests/${firstReq.body.data.id}/enroll`).expect(200);

    const secondReq = await second
      .post('/api/course-requests')
      .send({ courseId: course.id, format: 'OFFLINE', name: 'Navbatdagi', phone: '+998901112288' })
      .expect(201);
    await admin.post(`/api/course-requests/${secondReq.body.data.id}/enroll`).expect(409);

    // Guruhni tark etgan o'quvchi: yozilish bekor qilinadi va joy darhol
    // bo'shaydi (ilgari so'rov ENROLLED bo'lib qolib, joy band turaverardi)
    const enrollment = await prisma.enrollment.findFirstOrThrow({ where: { courseId: course.id } });
    await admin.patch(`/api/enrollments/${enrollment.id}`).send({ status: 'CANCELLED' }).expect(200);

    await admin.post(`/api/course-requests/${secondReq.body.data.id}/enroll`).expect(200);
  });

  it('qayta tasdiqlash joyni ikkinchi marta band qilmaydi (idempotent)', async () => {
    const course = await createCourse({ price: 500000, offlineSeats: 1, format: 'OFFLINE' });
    const student = await newStudent();

    const created = await student
      .post('/api/course-requests')
      .send({ courseId: course.id, format: 'OFFLINE', name: 'Talaba', phone: '+998901112233' })
      .expect(201);

    await admin.post(`/api/course-requests/${created.body.data.id}/enroll`).expect(200);
    await admin.post(`/api/course-requests/${created.body.data.id}/enroll`).expect(200);

    const res = await admin.get(`/api/courses/${course.slug}`).expect(200);
    expect(res.body.data.seats.offline).toMatchObject({ total: 1, taken: 1, left: 0, full: true });
  });

  it("offline joylar tugagach keyingi so'rovni tasdiqlab bo'lmaydi", async () => {
    const course = await createCourse({ price: 500000, offlineSeats: 1, format: 'OFFLINE' });
    const first = await newStudent();
    const second = await newStudent();

    const firstReq = await first
      .post('/api/course-requests')
      .send({ courseId: course.id, format: 'OFFLINE', name: 'Birinchi', phone: '+998901112233' })
      .expect(201);
    await admin.post(`/api/course-requests/${firstReq.body.data.id}/enroll`).expect(200);

    const secondReq = await second
      .post('/api/course-requests')
      .send({ courseId: course.id, format: 'OFFLINE', name: 'Ikkinchi', phone: '+998901112244' })
      .expect(201);
    const res = await admin.post(`/api/course-requests/${secondReq.body.data.id}/enroll`).expect(409);
    expect(res.body.error.code).toBe('COURSE_FULL');
  });

  it("guruh to'lgan bo'lsa ham so'rov qabul qilinaveradi (navbat)", async () => {
    const course = await createCourse({ price: 0, onlineSeats: 1 });
    const busy = await newStudent();
    await busy.post('/api/enrollments').send({ courseId: course.id }).expect(201);

    const waiting = await newStudent();
    await waiting
      .post('/api/course-requests')
      .send({ courseId: course.id, format: 'ONLINE', name: 'Navbatchi', phone: '+998901112255' })
      .expect(201);
  });

  it("hisobsiz (mehmon) so'rovini kursga qo'shib bo'lmaydi", async () => {
    const course = await createCourse({ price: 400000 });
    const guest = await createGuestRequest(course.id);

    const res = await admin.post(`/api/course-requests/${guest}/enroll`).expect(400);
    expect(res.body.error.code).toBe('REQUEST_HAS_NO_ACCOUNT');
  });
});

async function createGuestRequest(courseId: string): Promise<string> {
  const request = await prisma.courseRequest.create({
    data: { courseId, format: 'ONLINE', name: 'Mehmon', phone: '+998901110000' },
  });
  return request.id;
}

describe('Onlayn va offline narxlar', () => {
  it('offlinePrice alohida saqlanadi va kurs javobida qaytadi', async () => {
    const course = await createCourse({ price: 800000, offlinePrice: 1200000, format: 'HYBRID' });

    const res = await admin.get(`/api/courses/${course.slug}`).expect(200);
    expect(Number(res.body.data.price)).toBe(800000);
    expect(Number(res.body.data.offlinePrice)).toBe(1200000);
  });

  it('offlinePrice berilmasa null bo\'lib qoladi (offline uchun ham onlayn narx ko\'rsatiladi)', async () => {
    const course = await createCourse({ price: 300000 });
    const res = await admin.get(`/api/courses/${course.slug}`).expect(200);
    expect(res.body.data.offlinePrice).toBeNull();
  });
});
