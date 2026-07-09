import { prisma } from '../config/prisma';
import { SupportedLocale } from '../config/locale';
import { resolveLocaleDeep } from '../utils/localizedField';

export async function getStats(locale: SupportedLocale) {
  const [
    usersTotal,
    studentsTotal,
    coursesTotal,
    coursesPublished,
    enrollmentsTotal,
    enrollmentsPending,
    enrollmentsActive,
    messagesNew,
    blogPostsTotal,
    mentorsTotal,
    recentEnrollments,
    recentMessages,
  ] = await Promise.all([
    prisma.user.count(),
    prisma.user.count({ where: { role: 'STUDENT' } }),
    prisma.course.count(),
    prisma.course.count({ where: { published: true } }),
    prisma.enrollment.count(),
    prisma.enrollment.count({ where: { status: 'PENDING' } }),
    prisma.enrollment.count({ where: { status: 'ACTIVE' } }),
    prisma.contactMessage.count({ where: { status: 'NEW' } }),
    prisma.blogPost.count(),
    prisma.mentor.count(),
    prisma.enrollment.findMany({
      orderBy: { enrolledAt: 'desc' },
      take: 6,
      include: {
        user: { select: { id: true, name: true, email: true } },
        course: { select: { id: true, title: true, slug: true } },
      },
    }),
    prisma.contactMessage.findMany({
      orderBy: { createdAt: 'desc' },
      take: 6,
    }),
  ]);

  return {
    counts: {
      usersTotal,
      studentsTotal,
      coursesTotal,
      coursesPublished,
      enrollmentsTotal,
      enrollmentsPending,
      enrollmentsActive,
      messagesNew,
      blogPostsTotal,
      mentorsTotal,
    },
    recentEnrollments: resolveLocaleDeep(recentEnrollments, locale),
    recentMessages,
  };
}
