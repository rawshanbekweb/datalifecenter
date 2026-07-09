import { prisma } from '../config/prisma';
import { SupportedLocale } from '../config/locale';
import { ApiError } from '../utils/ApiError';
import { resolveLocaleDeep, toUzText } from '../utils/localizedField';
import { Actor, canManageCourse, mentorNotLinkedError } from '../utils/mentorAccess';
import { excerpt, notify } from './notifications.service';

// Dars qaysi kursga tegishli va bu kurs mentorining userId'si
async function lessonCourseInfo(lessonId: string) {
  const lesson = await prisma.lesson.findUnique({
    where: { id: lessonId },
    select: {
      id: true,
      title: true,
      module: { select: { course: { select: { id: true, title: true, mentor: { select: { userId: true } } } } } },
    },
  });
  if (!lesson) {
    throw ApiError.notFound('Dars topilmadi');
  }
  return lesson;
}

// Savol berish/o'qish uchun ruxsat: yozilgan o'quvchi, kurs mentori yoki admin
async function assertCanAccessLesson(lessonId: string, actor: Actor) {
  const lesson = await lessonCourseInfo(lessonId);
  const courseId = lesson.module.course.id;

  if (canManageCourse(actor, lesson.module.course.mentor?.userId)) return lesson;

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
    include: { user: { select: { id: true, name: true, avatarUrl: true } } },
  });

  const mentorUserId = lesson.module.course.mentor?.userId;
  if (mentorUserId && mentorUserId !== actor.userId) {
    await notify(mentorUserId, {
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
    include: { user: { select: { id: true, name: true, avatarUrl: true } } },
  });
}

// Mentor kabineti: o'z kurslaridagi barcha savollar (javobsizlari oldinda)
export async function listMentorQuestions(userId: string, locale: SupportedLocale) {
  const mentor = await prisma.mentor.findUnique({
    where: { userId },
    select: { id: true, courses: { select: { id: true } } },
  });
  if (!mentor) {
    throw mentorNotLinkedError();
  }
  const courseIds = mentor.courses.map((c) => c.id);
  if (!courseIds.length) return [];

  const questions = await prisma.lessonQuestion.findMany({
    where: { lesson: { module: { courseId: { in: courseIds } } } },
    orderBy: [{ answeredAt: { sort: 'asc', nulls: 'first' } }, { createdAt: 'desc' }],
    include: {
      user: { select: { id: true, name: true, email: true, avatarUrl: true } },
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
          module: { select: { course: { select: { slug: true, mentor: { select: { userId: true } } } } } },
        },
      },
    },
  });
  if (!question) {
    throw ApiError.notFound('Savol topilmadi');
  }
  if (!canManageCourse(actor, question.lesson.module.course.mentor?.userId)) {
    throw ApiError.forbidden('Bu savol sizning kursingizga tegishli emas');
  }
  const updated = await prisma.lessonQuestion.update({
    where: { id },
    data: { answer, answeredAt: new Date() },
    include: { user: { select: { id: true, name: true, avatarUrl: true } } },
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
