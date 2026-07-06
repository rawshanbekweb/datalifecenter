import { Prisma } from '@prisma/client';
import { prisma } from '../config/prisma';
import { ApiError } from '../utils/ApiError';

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
  title: string;
  description?: string;
  meetingUrl: string;
  startsAt: Date;
  durationMin: number;
}

interface UpdateSessionInput {
  title?: string;
  description?: string | null;
  meetingUrl?: string;
  startsAt?: Date;
  durationMin?: number;
  status?: 'SCHEDULED' | 'LIVE' | 'ENDED' | 'CANCELLED';
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

  return prisma.liveSession.create({
    data: { ...input, mentorId },
    include: sessionInclude,
  });
}

// Talaba: o'zi yozilgan (ACTIVE/COMPLETED) kurslarning yaqin sessiyalari
export async function listMySessions(userId: string) {
  const enrollments = await prisma.enrollment.findMany({
    where: { userId, status: { in: ['ACTIVE', 'COMPLETED'] } },
    select: { courseId: true },
  });
  const courseIds = enrollments.map((e) => e.courseId);
  if (courseIds.length === 0) return [];

  // Tugagan sessiyalarni ko'rsatmaymiz; boshlangan-lekin-tugamaganlar ko'rinadi
  const cutoff = new Date(Date.now() - 8 * 60 * 60 * 1000);
  return prisma.liveSession.findMany({
    where: {
      courseId: { in: courseIds },
      status: { in: ['SCHEDULED', 'LIVE'] },
      startsAt: { gte: cutoff },
    },
    orderBy: { startsAt: 'asc' },
    take: 20,
    include: sessionInclude,
  });
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
  await getOwnedSession(id, actor);
  return prisma.liveSession.update({ where: { id }, data: input, include: sessionInclude });
}

export async function deleteSession(id: string, actor: Actor) {
  await getOwnedSession(id, actor);
  await prisma.liveSession.delete({ where: { id } });
}
