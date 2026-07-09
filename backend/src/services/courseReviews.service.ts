import { prisma } from '../config/prisma';
import { SupportedLocale } from '../config/locale';
import { ApiError } from '../utils/ApiError';
import { resolveLocaleDeep } from '../utils/localizedField';

async function findCourseBySlug(slug: string) {
  const course = await prisma.course.findFirst({ where: { slug, published: true } });
  if (!course) {
    throw ApiError.notFound('Kurs topilmadi');
  }
  return course;
}

// Sharh yozilgan/o'zgargan/o'chirilgandan keyin kursning o'rtacha reytingi va soni qayta hisoblanadi
async function recalculateCourseRating(courseId: string): Promise<void> {
  const agg = await prisma.courseReview.aggregate({
    where: { courseId, published: true },
    _avg: { rating: true },
    _count: true,
  });
  await prisma.course.update({
    where: { id: courseId },
    data: { rating: agg._avg.rating ?? 0, reviewsCount: agg._count },
  });
}

export async function listReviews(slug: string) {
  const course = await findCourseBySlug(slug);
  return prisma.courseReview.findMany({
    where: { courseId: course.id, published: true },
    orderBy: { createdAt: 'desc' },
    include: { user: { select: { name: true, avatarUrl: true } } },
  });
}

export async function getMyReview(slug: string, userId: string) {
  const course = await findCourseBySlug(slug);
  return prisma.courseReview.findUnique({ where: { userId_courseId: { userId, courseId: course.id } } });
}

interface ReviewInput {
  rating: number;
  comment: string;
}

export async function upsertReview(slug: string, userId: string, input: ReviewInput) {
  const course = await findCourseBySlug(slug);

  const enrollment = await prisma.enrollment.findUnique({
    where: { userId_courseId: { userId, courseId: course.id } },
  });
  if (!enrollment || enrollment.status !== 'COMPLETED') {
    throw ApiError.forbidden('Sharh faqat kursni tugatgan talabalar uchun', 'COURSE_NOT_COMPLETED');
  }

  const review = await prisma.courseReview.upsert({
    where: { userId_courseId: { userId, courseId: course.id } },
    update: { rating: input.rating, comment: input.comment },
    create: { userId, courseId: course.id, rating: input.rating, comment: input.comment },
  });

  await recalculateCourseRating(course.id);
  return review;
}

export async function deleteMyReview(slug: string, userId: string): Promise<void> {
  const course = await findCourseBySlug(slug);
  const review = await prisma.courseReview.findUnique({ where: { userId_courseId: { userId, courseId: course.id } } });
  if (!review) {
    throw ApiError.notFound('Sharh topilmadi');
  }
  await prisma.courseReview.delete({ where: { id: review.id } });
  await recalculateCourseRating(course.id);
}

interface ListReviewsAdminFilters {
  page: number;
  limit: number;
}

export async function listReviewsAdmin(filters: ListReviewsAdminFilters, locale: SupportedLocale) {
  const [items, total] = await Promise.all([
    prisma.courseReview.findMany({
      orderBy: { createdAt: 'desc' },
      skip: (filters.page - 1) * filters.limit,
      take: filters.limit,
      include: {
        course: { select: { id: true, title: true, slug: true } },
        user: { select: { id: true, name: true, email: true } },
      },
    }),
    prisma.courseReview.count(),
  ]);

  return {
    items: resolveLocaleDeep(items, locale),
    pagination: { page: filters.page, limit: filters.limit, total, totalPages: Math.ceil(total / filters.limit) },
  };
}

export async function setReviewPublished(id: string, published: boolean) {
  const review = await prisma.courseReview.findUnique({ where: { id } });
  if (!review) {
    throw ApiError.notFound('Sharh topilmadi');
  }
  const updated = await prisma.courseReview.update({ where: { id }, data: { published } });
  await recalculateCourseRating(review.courseId);
  return updated;
}

export async function deleteReviewAdmin(id: string): Promise<void> {
  const review = await prisma.courseReview.findUnique({ where: { id } });
  if (!review) {
    throw ApiError.notFound('Sharh topilmadi');
  }
  await prisma.courseReview.delete({ where: { id } });
  await recalculateCourseRating(review.courseId);
}
