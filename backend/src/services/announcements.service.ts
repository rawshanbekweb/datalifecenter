import { prisma } from '../config/prisma';
import { ApiError } from '../utils/ApiError';
import { notify } from './notifications.service';

interface CreateAnnouncementInput {
  title: string;
  body: string;
  audience?: 'ALL' | 'STUDENTS' | 'MENTORS';
  courseId?: string | null;
}

// E'lon yaratiladi va auditoriyaga bildirishnoma sifatida tarqatiladi.
// courseId berilsa auditoriya — o'sha kursning faol/yakunlagan talabalari.
export async function createAnnouncement(input: CreateAnnouncementInput) {
  const audience = input.audience ?? 'ALL';

  if (input.courseId) {
    const course = await prisma.course.findUnique({ where: { id: input.courseId }, select: { id: true } });
    if (!course) {
      throw ApiError.notFound('Kurs topilmadi');
    }
  }

  const announcement = await prisma.announcement.create({
    data: { title: input.title, body: input.body, audience, courseId: input.courseId ?? null },
    include: { course: { select: { id: true, title: true } } },
  });

  const users = await prisma.user.findMany({
    where: {
      isBlocked: false,
      ...(input.courseId
        ? { enrollments: { some: { courseId: input.courseId, status: { in: ['ACTIVE', 'COMPLETED'] } } } }
        : audience === 'STUDENTS'
          ? { role: 'STUDENT' }
          : audience === 'MENTORS'
            ? { role: 'MENTOR' }
            : {}),
    },
    select: { id: true },
  });

  await notify(
    users.map((u) => u.id),
    { type: 'ANNOUNCEMENT', title: announcement.title, body: announcement.body, link: null }
  );

  return announcement;
}

export async function listAnnouncements() {
  return prisma.announcement.findMany({
    orderBy: { createdAt: 'desc' },
    include: { course: { select: { id: true, title: true } } },
  });
}

export async function deleteAnnouncement(id: string) {
  const announcement = await prisma.announcement.findUnique({ where: { id } });
  if (!announcement) {
    throw ApiError.notFound("E'lon topilmadi");
  }
  await prisma.announcement.delete({ where: { id } });
}
