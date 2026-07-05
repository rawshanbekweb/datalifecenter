import { prisma } from '../config/prisma';
import { ApiError } from '../utils/ApiError';

// ---------- Modules ----------

interface ModuleInput {
  courseId: string;
  title: string;
  description?: string | null;
  order?: number;
}

export async function createModule(input: ModuleInput) {
  const course = await prisma.course.findUnique({ where: { id: input.courseId } });
  if (!course) {
    throw ApiError.notFound('Kurs topilmadi');
  }

  let order = input.order;
  if (order === undefined) {
    const last = await prisma.module.findFirst({
      where: { courseId: input.courseId },
      orderBy: { order: 'desc' },
    });
    order = (last?.order ?? 0) + 1;
  }

  return prisma.module.create({
    data: { courseId: input.courseId, title: input.title, description: input.description ?? null, order },
    include: { lessons: { orderBy: { order: 'asc' } } },
  });
}

export async function updateModule(id: string, input: Partial<Omit<ModuleInput, 'courseId'>>) {
  const module = await prisma.module.findUnique({ where: { id } });
  if (!module) {
    throw ApiError.notFound('Modul topilmadi');
  }
  return prisma.module.update({
    where: { id },
    data: input,
    include: { lessons: { orderBy: { order: 'asc' } } },
  });
}

export async function deleteModule(id: string) {
  const module = await prisma.module.findUnique({ where: { id } });
  if (!module) {
    throw ApiError.notFound('Modul topilmadi');
  }
  await prisma.module.delete({ where: { id } });
}

// ---------- Lessons ----------

interface LessonInput {
  title: string;
  contentType?: 'VIDEO' | 'TEXT' | 'QUIZ' | 'ASSIGNMENT';
  videoUrl?: string | null;
  content?: string | null;
  durationMinutes?: number | null;
  isFreePreview?: boolean;
  order?: number;
}

export async function createLesson(moduleId: string, input: LessonInput) {
  const module = await prisma.module.findUnique({ where: { id: moduleId } });
  if (!module) {
    throw ApiError.notFound('Modul topilmadi');
  }

  let order = input.order;
  if (order === undefined) {
    const last = await prisma.lesson.findFirst({
      where: { moduleId },
      orderBy: { order: 'desc' },
    });
    order = (last?.order ?? 0) + 1;
  }

  return prisma.lesson.create({
    data: {
      moduleId,
      title: input.title,
      contentType: input.contentType ?? 'VIDEO',
      videoUrl: input.videoUrl ?? null,
      content: input.content ?? null,
      durationMinutes: input.durationMinutes ?? null,
      isFreePreview: input.isFreePreview ?? false,
      order,
    },
  });
}

export async function updateLesson(id: string, input: Partial<LessonInput>) {
  const lesson = await prisma.lesson.findUnique({ where: { id } });
  if (!lesson) {
    throw ApiError.notFound('Dars topilmadi');
  }
  return prisma.lesson.update({ where: { id }, data: input });
}

export async function deleteLesson(id: string) {
  const lesson = await prisma.lesson.findUnique({ where: { id } });
  if (!lesson) {
    throw ApiError.notFound('Dars topilmadi');
  }
  await prisma.lesson.delete({ where: { id } });
}
