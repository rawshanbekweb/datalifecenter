import { beforeAll, afterAll, describe, expect, it } from 'vitest';
import { prisma, resetDb, createUser, loginAgent } from './helpers';

/**
 * Qabul bayroqlari — `published` dan ALOHIDA va formatga qarab IKKITA.
 *
 * Qoida: kurs saytda ko'rinaveradi (markazning yo'nalishi borligi bilinsin),
 * lekin YANGI yozilish qabul qilinmaydi. Gibrid kursda onlayn va offline
 * qabul MUSTAQIL — onlayn guruh to'lgani offline guruh ham yopiq degani
 * emas. Sinovlar aynan shuni tekshiradi, chunki bir bayroqni ikkalasiga
 * ishlatib yuborish oson.
 */

let student: Awaited<ReturnType<typeof loginAgent>>;
let admin: Awaited<ReturnType<typeof loginAgent>>;
let openCourseId: string;
let closedCourseId: string;
let hybridCourseId: string;
let closedSlug: string;

beforeAll(async () => {
  await resetDb();
  await createUser('admin@eo.uz', 'ADMIN');
  // emaili tasdiqlangan: kurs so'rovi faqat tasdiqlangan hisobdan qabul qilinadi
  await createUser('student@eo.uz', 'STUDENT', 'Test User', true);
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
  const closed = await course({ title: 'Yopiq kurs', slug: 'yopiq-kurs', onlineEnrollmentOpen: false });
  closedCourseId = closed.id;
  closedSlug = closed.slug;

  // Gibrid: onlayn YOPIQ, offline OCHIQ — foydalanuvchi so'ragan holat
  hybridCourseId = (
    await course({
      title: 'Gibrid kurs',
      slug: 'gibrid-kurs',
      format: 'HYBRID',
      onlineEnrollmentOpen: false,
      offlineEnrollmentOpen: true,
    })
  ).id;
});

afterAll(async () => {
  await prisma.$disconnect();
});

describe('Kursga qabul: onlayn va offline alohida', () => {
  it('yopiq kurs saytda KO\'RINAVERADI — yo\'nalish borligi bilinishi kerak', async () => {
    const list = await student.get('/api/courses').expect(200);
    const slugs = list.body.data.items.map((c: { slug: string }) => c.slug);
    expect(slugs).toContain('yopiq-kurs');

    // Ikkala bayroq ham javobda keladi — frontend shunga qarab qaror qiladi
    const detail = await student.get(`/api/courses/${closedSlug}`).expect(200);
    expect(detail.body.data.onlineEnrollmentOpen).toBe(false);
    expect(detail.body.data.offlineEnrollmentOpen).toBe(true);
  });

  it('onlayn qabul yopiq bo\'lsa yozilish qabul qilinmaydi', async () => {
    const res = await student.post('/api/enrollments').send({ courseId: closedCourseId }).expect(409);
    expect(res.body.error.code).toBe('COURSE_ENROLLMENT_CLOSED');
    expect(await prisma.enrollment.count({ where: { courseId: closedCourseId } })).toBe(0);
  });

  it('ochiq kursga yozilish oldingidek ishlaydi', async () => {
    await student.post('/api/enrollments').send({ courseId: openCourseId }).expect(201);
    expect(await prisma.enrollment.count({ where: { courseId: openCourseId } })).toBe(1);
  });

  it('gibrid kursda onlayn yopiq bo\'lsa to\'g\'ridan-to\'g\'ri yozilish to\'xtaydi', async () => {
    const res = await student.post('/api/enrollments').send({ courseId: hybridCourseId }).expect(409);
    expect(res.body.error.code).toBe('COURSE_ENROLLMENT_CLOSED');
  });

  it('gibrid kursda offline ochiq bo\'lsa so\'rov qabul qilinaveradi', async () => {
    await student
      .post('/api/course-requests')
      .send({ courseId: hybridCourseId, name: 'Talaba', phone: '+998901234567', format: 'OFFLINE', email: 'talaba@test.uz' })
      .expect(201);
    expect(await prisma.courseRequest.count({ where: { courseId: hybridCourseId } })).toBe(1);
  });

  it('offline bayrog\'i ONLAYN yozilishga ta\'sir qilmaydi', async () => {
    // Onlayn kursning offline bayrog'i yopilsa ham onlayn yozilish ishlashi kerak
    await admin.put(`/api/courses/${openCourseId}`).send({ offlineEnrollmentOpen: false }).expect(200);
    const other = await createUser('student2@eo.uz', 'STUDENT');
    const agent = await loginAgent(other.email);
    await agent.post('/api/enrollments').send({ courseId: openCourseId }).expect(201);
  });

  it('yopiq kursga ham SO\'ROV yuborish mumkin — bu navbat ro\'yxati', async () => {
    await student
      .post('/api/course-requests')
      .send({ courseId: closedCourseId, name: 'Talaba', phone: '+998901234567', format: 'ONLINE', email: 'talaba@test.uz' })
      .expect(201);
    expect(await prisma.courseRequest.count({ where: { courseId: closedCourseId } })).toBe(1);
  });

  it('admin onlayn qabulni qayta ochadi va yozilish darhol ishlaydi', async () => {
    await admin.put(`/api/courses/${closedCourseId}`).send({ onlineEnrollmentOpen: true }).expect(200);
    await student.post('/api/enrollments').send({ courseId: closedCourseId }).expect(201);
  });

  it("qabulni yopish kursni saytdan YASHIRMAYDI (published tegilmaydi)", async () => {
    await admin.put(`/api/courses/${openCourseId}`).send({ onlineEnrollmentOpen: false }).expect(200);
    const course = await prisma.course.findUniqueOrThrow({ where: { id: openCourseId } });
    expect(course.published).toBe(true);
    expect(course.onlineEnrollmentOpen).toBe(false);
  });

  it('allaqachon yozilgan talaba yopilgandan keyin ham darsga kiraveradi', async () => {
    // openCourseId yuqoridagi testda yopildi, lekin talaba unga oldin yozilgan
    const res = await student.get(`/api/courses/ochiq-kurs/learn`).expect(200);
    expect(res.body.data.course.slug).toBe('ochiq-kurs');
  });
});
