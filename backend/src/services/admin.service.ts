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
    courseRequestsNew,
    recentEnrollments,
    recentMessages,
    topCourses,
    topPosts,
    topProjects,
    viewsTotals,
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
    prisma.courseRequest.count({ where: { status: 'NEW' } }),
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
    // Eng ko'p ko'rilgan kontent — hisoblagichlar allaqachon denormallashtirilgan
    // (engagement.service.ts), shuning uchun bu oddiy tartiblangan o'qish
    prisma.course.findMany({
      where: { published: true, views: { gt: 0 } },
      orderBy: { views: 'desc' },
      take: 5,
      select: { id: true, title: true, slug: true, views: true, likesCount: true },
    }),
    prisma.blogPost.findMany({
      where: { published: true, views: { gt: 0 } },
      orderBy: { views: 'desc' },
      take: 5,
      select: { id: true, title: true, slug: true, views: true, likesCount: true },
    }),
    prisma.project.findMany({
      where: { published: true, views: { gt: 0 } },
      orderBy: { views: 'desc' },
      take: 5,
      select: { id: true, title: true, views: true, likesCount: true },
    }),
    Promise.all([
      prisma.course.aggregate({ _sum: { views: true, likesCount: true } }),
      prisma.blogPost.aggregate({ _sum: { views: true, likesCount: true } }),
      prisma.project.aggregate({ _sum: { views: true, likesCount: true } }),
    ]),
  ]);

  const viewsTotal = viewsTotals.reduce((sum, row) => sum + (row._sum.views ?? 0), 0);
  const likesTotal = viewsTotals.reduce((sum, row) => sum + (row._sum.likesCount ?? 0), 0);

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
      courseRequestsNew,
      viewsTotal,
      likesTotal,
    },
    recentEnrollments: resolveLocaleDeep(recentEnrollments, locale),
    recentMessages,
    topContent: {
      courses: resolveLocaleDeep(topCourses, locale),
      posts: resolveLocaleDeep(topPosts, locale),
      projects: resolveLocaleDeep(topProjects, locale),
    },
  };
}
