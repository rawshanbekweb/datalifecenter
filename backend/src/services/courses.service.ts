import { Prisma } from '@prisma/client';
import { prisma } from '../config/prisma';
import { SupportedLocale } from '../config/locale';
import { ApiError } from '../utils/ApiError';
import { isForeignKeyViolation } from '../utils/prismaErrors';
import { LocalizedString, resolveLocaleDeep, toJsonInput } from '../utils/localizedField';
import { slugify } from '../utils/slugify';
import { signVideoUrl } from './storage.service';
import { hasActiveSubscription } from './subscriptions.service';

interface ListCoursesFilters {
  level?: 'BEGINNER' | 'INTERMEDIATE' | 'ADVANCED';
  isFree?: 'true' | 'false';
  search?: string;
  page: number;
  limit: number;
}

export async function listCourses(filters: ListCoursesFilters, locale: SupportedLocale) {
  const where: Prisma.CourseWhereInput = {
    published: true,
    ...(filters.level ? { level: filters.level } : {}),
    ...(filters.isFree !== undefined ? { isFree: filters.isFree === 'true' } : {}),
    // Qidiruv faqat o'zbekcha matnga ishlaydi — ru/kaa/en kontenti bo'yicha
    // qidiruv hozircha qo'llab-quvvatlanmaydi (bilingan cheklov).
    ...(filters.search
      ? { title: { path: ['uz'], string_contains: filters.search, mode: 'insensitive' } }
      : {}),
  };

  const [items, total] = await Promise.all([
    prisma.course.findMany({
      where,
      orderBy: { createdAt: 'asc' },
      skip: (filters.page - 1) * filters.limit,
      take: filters.limit,
      include: {
        mentor: { select: { id: true, name: true } },
        modules: { select: { id: true, title: true, order: true }, orderBy: { order: 'asc' } },
      },
    }),
    prisma.course.count({ where }),
  ]);

  return {
    items: resolveLocaleDeep(items, locale),
    pagination: { page: filters.page, limit: filters.limit, total, totalPages: Math.ceil(total / filters.limit) },
  };
}

export async function getCourseBySlug(slug: string, locale: SupportedLocale) {
  const course = await prisma.course.findFirst({
    where: { slug, published: true },
    include: {
      mentor: true,
      modules: {
        orderBy: { order: 'asc' },
        include: { lessons: { orderBy: { order: 'asc' } } },
      },
    },
  });

  if (!course) {
    throw ApiError.notFound('Kurs topilmadi');
  }

  return resolveLocaleDeep(
    {
      ...course,
      modules: course.modules.map((mod) => ({
        ...mod,
        lessons: mod.lessons.map((lesson) => ({
          ...lesson,
          videoUrl: lesson.isFreePreview ? signVideoUrl(lesson.videoUrl) : null,
          content: lesson.isFreePreview ? lesson.content : null,
        })),
      })),
    },
    locale
  );
}

export async function listCoursesAdmin() {
  return prisma.course.findMany({
    orderBy: { createdAt: 'desc' },
    include: { mentor: { select: { id: true, name: true } } },
  });
}

export async function getCourseByIdAdmin(id: string) {
  const course = await prisma.course.findUnique({
    where: { id },
    include: {
      mentor: { select: { id: true, name: true } },
      modules: {
        orderBy: { order: 'asc' },
        include: { lessons: { orderBy: { order: 'asc' } } },
      },
    },
  });
  if (!course) {
    throw ApiError.notFound('Kurs topilmadi');
  }
  return course;
}

export async function getCourseForLearning(slug: string, userId: string, role: string, locale: SupportedLocale) {
  const course = await prisma.course.findFirst({
    where: { slug, published: true },
    include: {
      mentor: true,
      modules: {
        orderBy: { order: 'asc' },
        include: { lessons: { orderBy: { order: 'asc' } } },
      },
    },
  });

  if (!course) {
    throw ApiError.notFound('Kurs topilmadi');
  }

  let enrollment = null;
  if (role !== 'ADMIN') {
    enrollment = await prisma.enrollment.findUnique({
      where: { userId_courseId: { userId, courseId: course.id } },
    });

    // Enrollment yo'q, lekin foydalanuvchining faol obunasi bo'lsa — shu kursga ham
    // avtomatik (lazy) kirish beriladi. Obuna faollashganda barcha NASHR qilingan
    // kurslarga bir yo'la provisioning qilinadi (subscriptions.service.ts); bu shoxobcha
    // faqat obunadan KEYIN nashr qilingan kurslar uchun.
    if (!enrollment && (await hasActiveSubscription(userId))) {
      enrollment = await prisma.enrollment.create({
        data: { userId, courseId: course.id, status: 'ACTIVE', paymentStatus: 'FREE', provider: 'subscription' },
      });
    }

    if (!enrollment) {
      throw ApiError.forbidden("Siz bu kursga yozilmagansiz", 'NOT_ENROLLED');
    }
    if (enrollment.status === 'PENDING') {
      throw ApiError.forbidden("Yozilishingiz hali tasdiqlanmagan — to'lov kutilmoqda", 'ENROLLMENT_PENDING');
    }
    if (enrollment.status === 'CANCELLED') {
      throw ApiError.forbidden('Yozilishingiz bekor qilingan', 'ENROLLMENT_CANCELLED');
    }
    // Obuna orqali berilgan (hali "yakunlanmagan") kirish — obuna muddati tugagan bo'lsa
    // yopiladi. Tugatilgan kurslar doim ochiq qoladi (allaqachon topshirilgan narsa
    // qaytarib olinmaydi).
    if (enrollment.provider === 'subscription' && enrollment.status !== 'COMPLETED' && !(await hasActiveSubscription(userId))) {
      throw ApiError.forbidden('Obuna muddati tugagan — davom etish uchun yangilang', 'SUBSCRIPTION_EXPIRED');
    }
  }

  const progress = await prisma.lessonProgress.findMany({
    where: { userId, lesson: { module: { courseId: course.id } } },
    select: { lessonId: true },
  });

  const signedCourse = resolveLocaleDeep(
    {
      ...course,
      modules: course.modules.map((mod) => ({
        ...mod,
        lessons: mod.lessons.map((lesson) => ({ ...lesson, videoUrl: signVideoUrl(lesson.videoUrl) })),
      })),
    },
    locale
  );

  return { course: signedCourse, enrollment, completedLessonIds: progress.map((p) => p.lessonId) };
}

async function uniqueSlug(title: string, excludeId?: string): Promise<string> {
  const base = slugify(title);
  let candidate = base;
  let suffix = 1;
  while (true) {
    const existing = await prisma.course.findUnique({ where: { slug: candidate } });
    if (!existing || existing.id === excludeId) return candidate;
    suffix += 1;
    candidate = `${base}-${suffix}`;
  }
}

interface CourseInput {
  title: LocalizedString;
  subtitle?: LocalizedString | null;
  description: LocalizedString;
  iconKey: string;
  color: string;
  bg: string;
  border: string;
  price: number;
  currency: string;
  durationMonths: number;
  level: 'BEGINNER' | 'INTERMEDIATE' | 'ADVANCED';
  tags: string[];
  published: boolean;
  mentorId?: string | null;
}

export async function createCourse(input: CourseInput) {
  const slug = await uniqueSlug(input.title.uz);
  return prisma.course.create({
    data: {
      ...input,
      slug,
      isFree: input.price <= 0,
      subtitle: toJsonInput(input.subtitle),
    } as Prisma.CourseUncheckedCreateInput,
  });
}

export async function updateCourse(id: string, input: Partial<CourseInput>) {
  const course = await prisma.course.findUnique({ where: { id } });
  if (!course) {
    throw ApiError.notFound('Kurs topilmadi');
  }

  const currentTitle = course.title as unknown as LocalizedString;
  const slug = input.title && input.title.uz !== currentTitle.uz ? await uniqueSlug(input.title.uz, id) : undefined;
  const isFree = input.price !== undefined ? input.price <= 0 : undefined;

  return prisma.course.update({
    where: { id },
    data: {
      ...input,
      subtitle: toJsonInput(input.subtitle),
      ...(slug ? { slug } : {}),
      ...(isFree !== undefined ? { isFree } : {}),
    } as Prisma.CourseUncheckedUpdateInput,
  });
}

export async function deleteCourse(id: string) {
  const course = await prisma.course.findUnique({ where: { id } });
  if (!course) {
    throw ApiError.notFound('Kurs topilmadi');
  }
  try {
    await prisma.course.delete({ where: { id } });
  } catch (err) {
    if (isForeignKeyViolation(err)) {
      throw ApiError.conflict("Bu kursga talabalar yozilgan, avval ularni olib tashlang", 'COURSE_HAS_ENROLLMENTS');
    }
    throw err;
  }
}
