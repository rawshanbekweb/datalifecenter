import { prisma } from '../config/prisma';
import { ApiError } from '../utils/ApiError';
import { LocalizedString, toJsonInput } from '../utils/localizedField';
import { Actor, canManageCourse } from '../utils/mentorAccess';
import { deleteUploadByUrl } from './storage.service';

// ADMIN hamma kursni, MENTOR faqat o'ziga biriktirilgan kursni boshqaradi
async function assertCanManageCourse(courseId: string, actor: Actor) {
  const course = await prisma.course.findUnique({
    where: { id: courseId },
    select: { id: true, mentor: { select: { userId: true } } },
  });
  if (!course) {
    throw ApiError.notFound('Kurs topilmadi');
  }
  if (!canManageCourse(actor, course.mentor?.userId)) {
    throw ApiError.forbidden("Bu kurs sizga biriktirilmagan");
  }
}

async function courseIdOfModule(moduleId: string): Promise<string> {
  const module = await prisma.module.findUnique({ where: { id: moduleId }, select: { courseId: true } });
  if (!module) {
    throw ApiError.notFound('Modul topilmadi');
  }
  return module.courseId;
}

async function courseIdOfLesson(lessonId: string): Promise<string> {
  const lesson = await prisma.lesson.findUnique({
    where: { id: lessonId },
    select: { module: { select: { courseId: true } } },
  });
  if (!lesson) {
    throw ApiError.notFound('Dars topilmadi');
  }
  return lesson.module.courseId;
}

// ---------- Modules ----------

interface ModuleInput {
  courseId: string;
  title: LocalizedString;
  description?: LocalizedString | null;
  order?: number;
}

export async function createModule(input: ModuleInput, actor: Actor) {
  await assertCanManageCourse(input.courseId, actor);

  let order = input.order;
  if (order === undefined) {
    const last = await prisma.module.findFirst({
      where: { courseId: input.courseId },
      orderBy: { order: 'desc' },
    });
    order = (last?.order ?? 0) + 1;
  }

  return prisma.module.create({
    data: { courseId: input.courseId, title: input.title, description: toJsonInput(input.description ?? null), order },
    include: { lessons: { orderBy: { order: 'asc' } } },
  });
}

export async function updateModule(id: string, input: Partial<Omit<ModuleInput, 'courseId'>>, actor: Actor) {
  await assertCanManageCourse(await courseIdOfModule(id), actor);
  return prisma.module.update({
    where: { id },
    data: { ...input, description: toJsonInput(input.description) },
    include: { lessons: { orderBy: { order: 'asc' } } },
  });
}

export async function deleteModule(id: string, actor: Actor) {
  await assertCanManageCourse(await courseIdOfModule(id), actor);
  // Modul o'chirilganda ichidagi dars videolari xotirada yetim qolmasin
  const lessons = await prisma.lesson.findMany({ where: { moduleId: id }, select: { videoUrl: true } });
  await prisma.module.delete({ where: { id } });
  for (const lesson of lessons) {
    await deleteUploadByUrl(lesson.videoUrl);
  }
}

// ---------- Lessons ----------

interface LessonInput {
  title: LocalizedString;
  contentType?: 'VIDEO' | 'TEXT' | 'QUIZ' | 'ASSIGNMENT';
  videoUrl?: string | null;
  content?: LocalizedString | null;
  durationMinutes?: number | null;
  isFreePreview?: boolean;
  order?: number;
}

export async function createLesson(moduleId: string, input: LessonInput, actor: Actor) {
  await assertCanManageCourse(await courseIdOfModule(moduleId), actor);

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
      content: toJsonInput(input.content ?? null),
      durationMinutes: input.durationMinutes ?? null,
      isFreePreview: input.isFreePreview ?? false,
      order,
    },
  });
}

export async function updateLesson(id: string, input: Partial<LessonInput>, actor: Actor) {
  await assertCanManageCourse(await courseIdOfLesson(id), actor);

  // Video almashtirilsa eskisi xotirada yetim qolmasin
  if (input.videoUrl !== undefined) {
    const old = await prisma.lesson.findUnique({ where: { id }, select: { videoUrl: true } });
    if (old?.videoUrl && old.videoUrl !== input.videoUrl) {
      await deleteUploadByUrl(old.videoUrl);
    }
  }

  return prisma.lesson.update({ where: { id }, data: { ...input, content: toJsonInput(input.content) } });
}

export async function deleteLesson(id: string, actor: Actor) {
  await assertCanManageCourse(await courseIdOfLesson(id), actor);
  const lesson = await prisma.lesson.findUnique({ where: { id }, select: { videoUrl: true } });
  await prisma.lesson.delete({ where: { id } });
  await deleteUploadByUrl(lesson?.videoUrl);
}

