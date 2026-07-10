import { Prisma } from '@prisma/client';
import { prisma } from '../config/prisma';
import { SupportedLocale } from '../config/locale';
import { ApiError } from '../utils/ApiError';
import { LocalizedString, resolveLocaleDeep, toJsonInput, toUzText } from '../utils/localizedField';
import { notify } from './notifications.service';

const sessionInclude = {
  course: { select: { id: true, title: true, slug: true, color: true, bg: true, border: true, iconKey: true } },
  mentor: { select: { id: true, name: true, photoUrl: true } },
} satisfies Prisma.LiveSessionInclude;

interface Actor {
  userId: string;
  role: string;
}

interface CreateSessionInput {
  courseId: string;
  title: LocalizedString;
  description?: LocalizedString | null;
  meetingUrl: string;
  startsAt: Date;
  durationMin: number;
  targetStudentIds?: string[];
}

interface UpdateSessionInput {
  title?: LocalizedString;
  description?: LocalizedString | null;
  meetingUrl?: string;
  startsAt?: Date;
  durationMin?: number;
  status?: 'SCHEDULED' | 'LIVE' | 'ENDED' | 'CANCELLED';
  targetStudentIds?: string[];
}

// Mentor yuborgan userId'lar orasidan faqat shu kursga haqiqatan ham
// faol (ACTIVE/COMPLETED) yozilganlarini qoldiradi — boshqa kurs yoki
// mavjud bo'lmagan foydalanuvchi id'si sessiyaga yozilib qolmasin.
async function filterEnrolledStudentIds(courseId: string, userIds: string[]): Promise<string[]> {
  if (userIds.length === 0) return [];
  const enrollments = await prisma.enrollment.findMany({
    where: { courseId, userId: { in: userIds }, status: { in: ['ACTIVE', 'COMPLETED'] } },
    select: { userId: true },
  });
  return enrollments.map((e) => e.userId);
}

// MENTOR roli uchun user hisobiga bog'langan mentor profilini topadi
async function getOwnMentor(userId: string) {
  const mentor = await prisma.mentor.findUnique({ where: { userId } });
  if (!mentor) {
    throw ApiError.forbidden(
      "Sizning hisobingizga mentor profili bog'lanmagan. Administratorga murojaat qiling.",
      'MENTOR_NOT_LINKED'
    );
  }
  return mentor;
}

export async function createSession(input: CreateSessionInput, actor: Actor) {
  const course = await prisma.course.findUnique({ where: { id: input.courseId } });
  if (!course) {
    throw ApiError.notFound('Kurs topilmadi');
  }

  let mentorId: string;
  if (actor.role === 'ADMIN') {
    if (!course.mentorId) {
      throw ApiError.conflict('Bu kursga mentor biriktirilmagan', 'COURSE_HAS_NO_MENTOR');
    }
    mentorId = course.mentorId;
  } else {
    const mentor = await getOwnMentor(actor.userId);
    if (course.mentorId !== mentor.id) {
      throw ApiError.forbidden("Bu kurs sizga biriktirilmagan");
    }
    mentorId = mentor.id;
  }

  const targetStudentIds = await filterEnrolledStudentIds(input.courseId, input.targetStudentIds ?? []);

  const session = await prisma.liveSession.create({
    data: { ...input, mentorId, targetStudentIds, description: toJsonInput(input.description) },
    include: sessionInclude,
  });

  // Auditoriya tanlangan bo'lsa — faqat o'shalarga, aks holda kursning barcha faol talabalariga
  let recipientIds: string[];
  if (targetStudentIds.length > 0) {
    recipientIds = targetStudentIds;
  } else {
    const enrollments = await prisma.enrollment.findMany({
      where: { courseId: input.courseId, status: 'ACTIVE' },
      select: { userId: true },
    });
    recipientIds = enrollments.map((e) => e.userId);
  }
  await notify(recipientIds, {
    type: 'SESSION_SCHEDULED',
    title: `Yangi jonli dars: ${toUzText(session.title)}`,
    body: `${toUzText(course.title)} — ${new Date(session.startsAt).toLocaleString('uz-UZ')}`,
    link: '/student/sessions',
  });

  return session;
}

// Talaba: o'zi yozilgan (ACTIVE/COMPLETED) kurslarning yaqin sessiyalari — o'z tiliga tekislanadi
export async function listMySessions(userId: string, locale: SupportedLocale) {
  const enrollments = await prisma.enrollment.findMany({
    where: { userId, status: { in: ['ACTIVE', 'COMPLETED'] } },
    select: { courseId: true },
  });
  const courseIds = enrollments.map((e) => e.courseId);
  if (courseIds.length === 0) return [];

  // Tugagan sessiyalarni ko'rsatmaymiz; boshlangan-lekin-tugamaganlar ko'rinadi
  const cutoff = new Date(Date.now() - 8 * 60 * 60 * 1000);
  const sessions = await prisma.liveSession.findMany({
    where: {
      courseId: { in: courseIds },
      status: { in: ['SCHEDULED', 'LIVE'] },
      startsAt: { gte: cutoff },
      // Auditoriya tanlanmagan (bo'sh massiv) — hammaga ochiq; tanlangan bo'lsa faqat o'sha userId'larga
      OR: [{ targetStudentIds: { isEmpty: true } }, { targetStudentIds: { has: userId } }],
    },
    orderBy: { startsAt: 'asc' },
    take: 20,
    include: sessionInclude,
  });
  return resolveLocaleDeep(sessions, locale);
}

// Bitta sessiya — saytdagi jonli efir sahifasi (/live/:id) uchun.
// Kirish huquqi: ADMIN — istalgan; sessiya mentorining o'zi; yoki kursga faol
// yozilgan talaba (auditoriya tanlangan bo'lsa faqat o'sha ro'yxatdagilar).
export async function getSessionForViewer(id: string, actor: Actor, locale: SupportedLocale) {
  const session = await prisma.liveSession.findUnique({ where: { id }, include: sessionInclude });
  if (!session) {
    throw ApiError.notFound('Sessiya topilmadi');
  }

  if (actor.role !== 'ADMIN') {
    const mentor =
      actor.role === 'MENTOR' ? await prisma.mentor.findUnique({ where: { userId: actor.userId } }) : null;
    const isOwnerMentor = mentor !== null && session.mentorId === mentor.id;

    if (!isOwnerMentor) {
      const enrollment = await prisma.enrollment.findFirst({
        where: { userId: actor.userId, courseId: session.courseId, status: { in: ['ACTIVE', 'COMPLETED'] } },
        select: { id: true },
      });
      const inAudience =
        session.targetStudentIds.length === 0 || session.targetStudentIds.includes(actor.userId);
      if (!enrollment || !inAudience) {
        throw ApiError.forbidden("Bu jonli darsga kirish huquqingiz yo'q", 'SESSION_FORBIDDEN');
      }
    }
  }

  return resolveLocaleDeep(session, locale);
}

// Mentor: o'z sessiyalari; Admin: hammasi
export async function listManagedSessions(actor: Actor) {
  const where: Prisma.LiveSessionWhereInput =
    actor.role === 'ADMIN' ? {} : { mentorId: (await getOwnMentor(actor.userId)).id };

  return prisma.liveSession.findMany({
    where,
    orderBy: { startsAt: 'desc' },
    take: 100,
    include: sessionInclude,
  });
}

async function getOwnedSession(id: string, actor: Actor) {
  const session = await prisma.liveSession.findUnique({ where: { id } });
  if (!session) {
    throw ApiError.notFound('Sessiya topilmadi');
  }
  if (actor.role !== 'ADMIN') {
    const mentor = await getOwnMentor(actor.userId);
    if (session.mentorId !== mentor.id) {
      throw ApiError.forbidden('Bu sessiya sizga tegishli emas');
    }
  }
  return session;
}

export async function updateSession(id: string, input: UpdateSessionInput, actor: Actor) {
  const session = await getOwnedSession(id, actor);
  const data: Prisma.LiveSessionUpdateInput = { ...input, description: toJsonInput(input.description) };
  if (input.targetStudentIds !== undefined) {
    data.targetStudentIds = await filterEnrolledStudentIds(session.courseId, input.targetStudentIds);
  }
  return prisma.liveSession.update({ where: { id }, data, include: sessionInclude });
}

export async function deleteSession(id: string, actor: Actor) {
  await getOwnedSession(id, actor);
  await prisma.liveSession.delete({ where: { id } });
}
