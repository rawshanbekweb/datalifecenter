import { Prisma } from '@prisma/client';
import { prisma } from '../config/prisma';
import { ApiError } from '../utils/ApiError';
import { slugify } from '../utils/slugify';

interface ListCoursesFilters {
  level?: 'BEGINNER' | 'INTERMEDIATE' | 'ADVANCED';
  isFree?: 'true' | 'false';
  search?: string;
  page: number;
  limit: number;
}

export async function listCourses(filters: ListCoursesFilters) {
  const where: Prisma.CourseWhereInput = {
    published: true,
    ...(filters.level ? { level: filters.level } : {}),
    ...(filters.isFree !== undefined ? { isFree: filters.isFree === 'true' } : {}),
    ...(filters.search
      ? { title: { contains: filters.search, mode: 'insensitive' } }
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
    items,
    pagination: { page: filters.page, limit: filters.limit, total, totalPages: Math.ceil(total / filters.limit) },
  };
}

export async function getCourseBySlug(slug: string) {
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

  return {
    ...course,
    modules: course.modules.map((mod) => ({
      ...mod,
      lessons: mod.lessons.map((lesson) => ({
        ...lesson,
        videoUrl: lesson.isFreePreview ? lesson.videoUrl : null,
        content: lesson.isFreePreview ? lesson.content : null,
      })),
    })),
  };
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

export async function getCourseForLearning(slug: string, userId: string, role: string) {
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
    if (!enrollment) {
      throw ApiError.forbidden("Siz bu kursga yozilmagansiz", 'NOT_ENROLLED');
    }
    if (enrollment.status === 'PENDING') {
      throw ApiError.forbidden("Yozilishingiz hali tasdiqlanmagan — to'lov kutilmoqda", 'ENROLLMENT_PENDING');
    }
    if (enrollment.status === 'CANCELLED') {
      throw ApiError.forbidden('Yozilishingiz bekor qilingan', 'ENROLLMENT_CANCELLED');
    }
  }

  const progress = await prisma.lessonProgress.findMany({
    where: { userId, lesson: { module: { courseId: course.id } } },
    select: { lessonId: true },
  });

  return { course, enrollment, completedLessonIds: progress.map((p) => p.lessonId) };
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
  title: string;
  subtitle?: string;
  description: string;
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
  const slug = await uniqueSlug(input.title);
  return prisma.course.create({
    data: { ...input, slug, isFree: input.price <= 0 },
  });
}

export async function updateCourse(id: string, input: Partial<CourseInput>) {
  const course = await prisma.course.findUnique({ where: { id } });
  if (!course) {
    throw ApiError.notFound('Kurs topilmadi');
  }

  const slug = input.title && input.title !== course.title ? await uniqueSlug(input.title, id) : undefined;
  const isFree = input.price !== undefined ? input.price <= 0 : undefined;

  return prisma.course.update({
    where: { id },
    data: { ...input, ...(slug ? { slug } : {}), ...(isFree !== undefined ? { isFree } : {}) },
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
    if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === 'P2003') {
      throw ApiError.conflict("Bu kursga talabalar yozilgan, avval ularni olib tashlang", 'COURSE_HAS_ENROLLMENTS');
    }
    throw err;
  }
}
