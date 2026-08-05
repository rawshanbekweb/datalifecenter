import { prisma } from '../config/prisma';
import { SupportedLocale } from '../config/locale';
import { ApiError } from '../utils/ApiError';
import { resolveLocaleDeep, toUzText } from '../utils/localizedField';
import { Actor, canManageCourse, mentorNotLinkedError } from '../utils/mentorAccess';
import { mentorsForAccess } from '../utils/courseMentors';
import { excerpt, notify } from './notifications.service';

// Dars qaysi kursga tegishli va bu kurs mentorlarining userId'lari
async function lessonCourseInfo(lessonId: string) {
  const lesson = await prisma.lesson.findUnique({
    where: { id: lessonId },
    select: {
      id: true,
      title: true,
      module: { select: { course: { select: { id: true, title: true, ...mentorsForAccess } } } },
    },
  });
  if (!lesson) {
    throw ApiError.notFound('Dars topilmadi');
  }
  return lesson;
}

/** Darsdagi kursning mentor hisoblari — ruxsat va bildirishnoma uchun */
function mentorUserIds(course: { mentors: { mentor: { userId: string | null } }[] }): string[] {
  return course.mentors.map((m) => m.mentor.userId).filter((id): id is string => id !== null);
}

// Savol berish/o'qish uchun ruxsat: yozilgan o'quvchi, kurs mentori yoki admin
async function assertCanAccessLesson(lessonId: string, actor: Actor) {
  const lesson = await lessonCourseInfo(lessonId);
  const courseId = lesson.module.course.id;

  if (canManageCourse(actor, mentorUserIds(lesson.module.course))) return lesson;

  const enrollment = await prisma.enrollment.findUnique({
    where: { userId_courseId: { userId: actor.userId, courseId } },
  });
  if (!enrollment || (enrollment.status !== 'ACTIVE' && enrollment.status !== 'COMPLETED')) {
    throw ApiError.forbidden('Savol-javob faqat kursga yozilgan o‘quvchilar uchun ochiq');
  }
  return lesson;
}

export async function createQuestion(actor: Actor, input: { lessonId: string; body: string }) {
  const lesson = await assertCanAccessLesson(input.lessonId, actor);
  const question = await prisma.lessonQuestion.create({
    data: { lessonId: input.lessonId, userId: actor.userId, body: input.body },
    include: { user: { select: { id: true, name: true, avatarUrl: true, focusX: true, focusY: true } } },
  });

  // Kursning BARCHA mentorlariga xabar beriladi — javob birinchi bo'sh
  // bo'lgani beradi. Savol bergan mentorning o'ziga qaytmaydi.
  const recipients = mentorUserIds(lesson.module.course).filter((id) => id !== actor.userId);
  if (recipients.length) {
    await notify(recipients, {
      type: 'NEW_QUESTION',
      title: `Yangi savol: ${toUzText(lesson.title)}`,
      body: excerpt(input.body),
      link: '/mentor/questions',
    });
  }

  return question;
}

export async function listLessonQuestions(lessonId: string, actor: Actor) {
  await assertCanAccessLesson(lessonId, actor);
  return prisma.lessonQuestion.findMany({
    where: { lessonId },
    orderBy: { createdAt: 'desc' },
    include: { user: { select: { id: true, name: true, avatarUrl: true, focusX: true, focusY: true } } },
  });
}

// Mentor kabineti: o'z kurslaridagi barcha savollar (javobsizlari oldinda)
export async function listMentorQuestions(userId: string, locale: SupportedLocale) {
  const mentor = await prisma.mentor.findUnique({
    where: { userId },
    select: { id: true, courseLinks: { select: { courseId: true } } },
  });
  if (!mentor) {
    throw mentorNotLinkedError();
  }
  const courseIds = mentor.courseLinks.map((link) => link.courseId);
  if (!courseIds.length) return [];

  const questions = await prisma.lessonQuestion.findMany({
    where: { lesson: { module: { courseId: { in: courseIds } } } },
    orderBy: [{ answeredAt: { sort: 'asc', nulls: 'first' } }, { createdAt: 'desc' }],
    include: {
      user: { select: { id: true, name: true, email: true, avatarUrl: true, focusX: true, focusY: true } },
      lesson: {
        select: {
          id: true,
          title: true,
          module: { select: { course: { select: { id: true, title: true, slug: true } } } },
        },
      },
    },
  });
  return resolveLocaleDeep(questions, locale);
}

export async function answerQuestion(id: string, answer: string, actor: Actor) {
  const question = await prisma.lessonQuestion.findUnique({
    where: { id },
    select: {
      id: true,
      userId: true,
      lesson: {
        select: {
          title: true,
          module: { select: { course: { select: { slug: true, ...mentorsForAccess } } } },
        },
      },
    },
  });
  if (!question) {
    throw ApiError.notFound('Savol topilmadi');
  }
  if (!canManageCourse(actor, mentorUserIds(question.lesson.module.course))) {
    throw ApiError.forbidden('Bu savol sizning kursingizga tegishli emas');
  }
  const updated = await prisma.lessonQuestion.update({
    where: { id },
    data: { answer, answeredAt: new Date() },
    include: { user: { select: { id: true, name: true, avatarUrl: true, focusX: true, focusY: true } } },
  });

  if (question.userId !== actor.userId) {
    await notify(question.userId, {
      type: 'QUESTION_ANSWERED',
      title: `Savolingizga javob berildi: ${toUzText(question.lesson.title)}`,
      body: excerpt(answer),
      link: `/learn/${question.lesson.module.course.slug}`,
    });
  }

  return updated;
}

/**
 * Savolni o'chirish — admin, yoki shu kursning mentori.
 *
 * Mentorga ruxsat berilgani ataylab: o'z kursidagi savollarni u
 * moderatsiya qiladi, har safar adminni kutish kerak emas. Tekshiruv
 * `answerQuestion` dagi bilan bir xil (`canManageCourse`), ya'ni mentor
 * begona kursga tegolmaydi.
 */
export async function deleteQuestion(id: string, actor: Actor): Promise<void> {
  const question = await prisma.lessonQuestion.findUnique({
    where: { id },
    select: {
      lesson: { select: { module: { select: { course: { select: { ...mentorsForAccess } } } } } },
    },
  });
  if (!question) {
    throw ApiError.notFound('Savol topilmadi');
  }
  if (!canManageCourse(actor, mentorUserIds(question.lesson.module.course))) {
    throw ApiError.forbidden('Bu savol sizning kursingizga tegishli emas');
  }
  await prisma.lessonQuestion.delete({ where: { id } });
}

/**
 * Ommaviy o'chirish — FAQAT admin.
 *
 * Mentorga berilmadi, chunki har bir ID uchun alohida kurs egaligini
 * tekshirish kerak bo'lardi va bitta begona ID ro'yxatga qo'shilib qolsa
 * u jimgina o'chib ketardi. Bittalab o'chirishda tekshiruv aniq.
 */
export async function deleteQuestions(ids: string[]): Promise<number> {
  const { count } = await prisma.lessonQuestion.deleteMany({ where: { id: { in: ids } } });
  return count;
}
