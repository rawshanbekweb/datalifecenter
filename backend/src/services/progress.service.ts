import { prisma } from '../config/prisma';
import { ApiError } from '../utils/ApiError';

interface ProgressSummary {
  totalLessons: number;
  completedLessons: number;
  enrollmentStatus: string;
  courseCompleted: boolean;
}

async function getEnrolledLessonContext(userId: string, lessonId: string) {
  const lesson = await prisma.lesson.findUnique({
    where: { id: lessonId },
    include: { module: { select: { courseId: true } } },
  });
  if (!lesson) {
    throw ApiError.notFound('Dars topilmadi');
  }

  const enrollment = await prisma.enrollment.findUnique({
    where: { userId_courseId: { userId, courseId: lesson.module.courseId } },
  });
  if (!enrollment || enrollment.status === 'PENDING' || enrollment.status === 'CANCELLED') {
    throw ApiError.forbidden("Bu kursga faol yozilishingiz yo'q", 'NOT_ENROLLED');
  }

  return { lesson, enrollment, courseId: lesson.module.courseId };
}

async function buildSummary(userId: string, courseId: string, enrollmentId: string): Promise<ProgressSummary> {
  const [totalLessons, completedLessons] = await Promise.all([
    prisma.lesson.count({ where: { module: { courseId } } }),
    prisma.lessonProgress.count({ where: { userId, lesson: { module: { courseId } } } }),
  ]);

  // Hamma dars tugagan bo'lsa kurs avtomatik yakunlanadi, aks holda faolga qaytadi
  const shouldComplete = totalLessons > 0 && completedLessons >= totalLessons;
  const enrollment = await prisma.enrollment.findUnique({ where: { id: enrollmentId } });
  let status = enrollment?.status ?? 'ACTIVE';

  if (shouldComplete && status === 'ACTIVE') {
    await prisma.enrollment.update({
      where: { id: enrollmentId },
      data: { status: 'COMPLETED', completedAt: new Date() },
    });
    status = 'COMPLETED';
  } else if (!shouldComplete && status === 'COMPLETED') {
    await prisma.enrollment.update({
      where: { id: enrollmentId },
      data: { status: 'ACTIVE', completedAt: null },
    });
    status = 'ACTIVE';
  }

  return { totalLessons, completedLessons, enrollmentStatus: status, courseCompleted: shouldComplete };
}

export async function completeLesson(userId: string, lessonId: string): Promise<ProgressSummary> {
  const { enrollment, courseId } = await getEnrolledLessonContext(userId, lessonId);

  await prisma.lessonProgress.upsert({
    where: { userId_lessonId: { userId, lessonId } },
    create: { userId, lessonId },
    update: {},
  });

  return buildSummary(userId, courseId, enrollment.id);
}

export async function uncompleteLesson(userId: string, lessonId: string): Promise<ProgressSummary> {
  const { enrollment, courseId } = await getEnrolledLessonContext(userId, lessonId);

  await prisma.lessonProgress.deleteMany({ where: { userId, lessonId } });

  return buildSummary(userId, courseId, enrollment.id);
}
