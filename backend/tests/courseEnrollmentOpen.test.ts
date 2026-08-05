import { beforeAll, afterAll, describe, expect, it } from 'vitest';
import { prisma, resetDb, createUser, loginAgent } from './helpers';

/**
 * "Yozilish yopiq" holati — `published` dan ALOHIDA bayroq.
 *
 * Qoida: kurs saytda ko'rinaveradi (markazning yo'nalishi borligi bilinsin),
 * lekin YANGI yozilish qabul qilinmaydi. Sinovlar shuni tekshiradi, chunki
 * bu ikki bayroqni chalkashtirib yuborish oson — "yopdim" deb yozilishni
 * o'chirganda kurs saytdan ham yo'qolib ketmasligi kerak.
 */

let student: Awaited<ReturnType<typeof loginAgent>>;
let admin: Awaited<ReturnType<typeof loginAgent>>;
let openCourseId: string;
let closedCourseId: string;
let closedSlug: string;

beforeAll(async () => {
  await resetDb();
  await createUser('admin@eo.uz', 'ADMIN');
  await createUser('student@eo.uz', 'STUDENT');
  admin = await loginAgent('admin@eo.uz');
  student = await loginAgent('student@eo.uz');

  const course = (data: Record<string, unknown>) =>
    prisma.course.create({
      data: {
        title: { uz: String(data.title) },
        description: { uz: 'Tavsif' },
        slug: String(data.slug),
        iconKey: 'BookOpen',
        color: '#0ea5e9',
        bg: '#f0f9ff',
        border: '#bae6fd',
        durationMonths: 2,
        isFree: true,
        published: true,
        ...data,
      } as never,
    });

  openCourseId = (await course({ title: 'Ochiq kurs', slug: 'ochiq-kurs' })).id;
  const closed = await course({ title: 'Yopiq kurs', slug: 'yopiq-kurs', enrollmentOpen: false });
  closedCourseId = closed.id;
  closedSlug = closed.slug;
});

afterAll(async () => {
  await prisma.$disconnect();
});

describe('Kursga yozilish ochiq/yopiq', () => {
  it('yopiq kurs saytda KO\'RINAVERADI — yo\'nalish borligi bilinishi kerak', async () => {
    const list = await student.get('/api/courses').expect(200);
    const slugs = list.body.data.items.map((c: { slug: string }) => c.slug);
    expect(slugs).toContain('yopiq-kurs');

    // Kurs sahifasi ham ochiladi va bayroq javobda keladi (frontend shunga
    // qarab "Tez orada" ko'rsatadi)
    const detail = await student.get(`/api/courses/${closedSlug}`).expect(200);
    expect(detail.body.data.enrollmentOpen).toBe(false);
  });

  it('yopiq kursga yangi yozilish qabul qilinmaydi', async () => {
    const res = await student.post('/api/enrollments').send({ courseId: closedCourseId }).expect(409);
    expect(res.body.error.code).toBe('COURSE_ENROLLMENT_CLOSED');
    const count = await prisma.enrollment.count({ where: { courseId: closedCourseId } });
    expect(count).toBe(0);
  });

  it('ochiq kursga yozilish oldingidek ishlaydi', async () => {
    await student.post('/api/enrollments').send({ courseId: openCourseId }).expect(201);
    const count = await prisma.enrollment.count({ where: { courseId: openCourseId } });
    expect(count).toBe(1);
  });

  it('yopiq kursga ham SO\'ROV yuborish mumkin — bu navbat ro\'yxati', async () => {
    await student
      .post('/api/course-requests')
      .send({ courseId: closedCourseId, name: 'Talaba', phone: '+998901234567', format: 'ONLINE' })
      .expect(201);
    const count = await prisma.courseRequest.count({ where: { courseId: closedCourseId } });
    expect(count).toBe(1);
  });

  it('admin yozilishni qayta ochadi va yozilish darhol ishlaydi', async () => {
    await admin.put(`/api/courses/${closedCourseId}`).send({ enrollmentOpen: true }).expect(200);
    await student.post('/api/enrollments').send({ courseId: closedCourseId }).expect(201);
  });

  it("yozilishni yopish kursni saytdan YASHIRMAYDI (published tegilmaydi)", async () => {
    await admin.put(`/api/courses/${openCourseId}`).send({ enrollmentOpen: false }).expect(200);
    const course = await prisma.course.findUniqueOrThrow({ where: { id: openCourseId } });
    expect(course.published).toBe(true);
    expect(course.enrollmentOpen).toBe(false);
  });

  it('allaqachon yozilgan talaba yopilgandan keyin ham darsga kiraveradi', async () => {
    // openCourseId yuqoridagi testda yopildi, lekin talaba unga oldin yozilgan
    const res = await student.get(`/api/courses/ochiq-kurs/learn`).expect(200);
    expect(res.body.data.course.slug).toBe('ochiq-kurs');
  });
});
