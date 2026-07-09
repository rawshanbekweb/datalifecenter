import { Prisma } from '@prisma/client';
import { prisma } from '../config/prisma';
import { SupportedLocale } from '../config/locale';
import { ApiError } from '../utils/ApiError';
import { LocalizedString, resolveLocaleDeep, toJsonInput } from '../utils/localizedField';
import { Actor, mentorNotLinkedError, requireMentorId } from '../utils/mentorAccess';
import { isForeignKeyViolation } from '../utils/prismaErrors';

export async function listMentors(locale: SupportedLocale) {
  const mentors = await prisma.mentor.findMany({
    orderBy: [{ featured: 'desc' }, { order: 'asc' }],
    include: { courses: { select: { id: true, title: true, slug: true } } },
  });
  return resolveLocaleDeep(mentors, locale);
}

export async function getMentorById(id: string, locale: SupportedLocale) {
  const mentor = await prisma.mentor.findUnique({
    where: { id },
    include: { courses: { select: { id: true, title: true, slug: true } } },
  });

  if (!mentor) {
    throw ApiError.notFound('Mentor topilmadi');
  }

  return resolveLocaleDeep(mentor, locale);
}

// Admin tahrirlash paneli uchun — xom {uz,ru,kaa,en} obyektini qaytaradi
export async function listMentorsAdmin() {
  return prisma.mentor.findMany({
    orderBy: [{ featured: 'desc' }, { order: 'asc' }],
    include: { courses: { select: { id: true, title: true, slug: true } } },
  });
}

interface MentorInput {
  name: string;
  bio: LocalizedString;
  specialty: LocalizedString;
  photoUrl?: string;
  position?: LocalizedString | null;
  linkedinUrl?: string;
  githubUrl?: string;
  telegramUrl?: string;
  featured: boolean;
  order: number;
  userId?: string | null;
}

async function assertUserLinkable(userId: string, excludeMentorId?: string) {
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) {
    throw ApiError.notFound('Bog\'lanadigan foydalanuvchi topilmadi');
  }
  const linked = await prisma.mentor.findUnique({ where: { userId } });
  if (linked && linked.id !== excludeMentorId) {
    throw ApiError.conflict("Bu foydalanuvchi allaqachon boshqa mentorga bog'langan", 'USER_ALREADY_LINKED');
  }
}

export async function createMentor(input: MentorInput) {
  if (input.userId) {
    await assertUserLinkable(input.userId);
  }
  return prisma.mentor.create({ data: { ...input, position: toJsonInput(input.position) } as Prisma.MentorUncheckedCreateInput });
}

export async function updateMentor(id: string, input: Partial<MentorInput>) {
  const mentor = await prisma.mentor.findUnique({ where: { id } });
  if (!mentor) {
    throw ApiError.notFound('Mentor topilmadi');
  }
  if (input.userId) {
    await assertUserLinkable(input.userId, id);
  }
  return prisma.mentor.update({
    where: { id },
    data: { ...input, position: toJsonInput(input.position) } as Prisma.MentorUncheckedUpdateInput,
  });
}

// Mentor o'z profilini ko'radi
export async function getMentorMe(userId: string) {
  const mentor = await prisma.mentor.findUnique({
    where: { userId },
    include: { courses: { select: { id: true, title: true, slug: true } } },
  });
  if (!mentor) {
    throw mentorNotLinkedError();
  }
  return mentor;
}

// Mentor o'z profilini tahrirlaydi (faqat ochiq maydonlar — featured/order/userId emas)
export async function updateMentorMe(
  userId: string,
  input: Partial<Pick<MentorInput, 'name' | 'bio' | 'specialty' | 'photoUrl' | 'position' | 'linkedinUrl' | 'githubUrl' | 'telegramUrl'>>
) {
  const mentorId = await requireMentorId(userId);
  return prisma.mentor.update({
    where: { id: mentorId },
    data: { ...input, position: toJsonInput(input.position) } as Prisma.MentorUncheckedUpdateInput,
  });
}

// Kursning to'liq dasturini (modullar va darslar bilan) oladi:
// mentor faqat o'ziga biriktirilganini, ADMIN istalganini
export async function getMentorCourse(actor: Actor, courseId: string) {
  const where: { id: string; mentorId?: string } = { id: courseId };
  if (actor.role !== 'ADMIN') {
    where.mentorId = await requireMentorId(actor.userId);
  }
  const course = await prisma.course.findFirst({
    where,
    include: {
      modules: {
        orderBy: { order: 'asc' },
        include: { lessons: { orderBy: { order: 'asc' } } },
      },
    },
  });
  if (!course) {
    throw ApiError.notFound('Kurs topilmadi yoki sizga biriktirilmagan');
  }
  return course;
}

// MENTOR roli uchun shaxsiy kabinet ma'lumotlari
export async function getMentorDashboard(userId: string, locale: SupportedLocale) {
  const mentor = await prisma.mentor.findUnique({
    where: { userId },
    include: {
      courses: {
        orderBy: { createdAt: 'asc' },
        include: {
          _count: { select: { enrollments: true, modules: true } },
        },
      },
    },
  });

  if (!mentor) {
    throw mentorNotLinkedError();
  }

  const courseIds = mentor.courses.map((c) => c.id);
  const recentEnrollments = courseIds.length
    ? await prisma.enrollment.findMany({
        where: { courseId: { in: courseIds } },
        orderBy: { enrolledAt: 'desc' },
        take: 20,
        include: {
          user: { select: { id: true, name: true, email: true } },
          course: { select: { id: true, title: true, slug: true } },
        },
      })
    : [];

  const [totalStudents, activeStudents] = await Promise.all([
    prisma.enrollment.count({ where: { courseId: { in: courseIds } } }),
    prisma.enrollment.count({ where: { courseId: { in: courseIds }, status: 'ACTIVE' } }),
  ]);

  return resolveLocaleDeep(
    { mentor, recentEnrollments, stats: { totalStudents, activeStudents, coursesCount: mentor.courses.length } },
    locale
  );
}

// Mentor kurslaridagi talabalar va ularning dars progressi
export async function getMentorStudents(userId: string, locale: SupportedLocale) {
  const mentor = await prisma.mentor.findUnique({
    where: { userId },
    select: { id: true, courses: { select: { id: true } } },
  });

  if (!mentor) {
    throw mentorNotLinkedError();
  }

  const courseIds = mentor.courses.map((c) => c.id);
  if (!courseIds.length) return [];

  const enrollments = await prisma.enrollment.findMany({
    where: { courseId: { in: courseIds }, status: { in: ['ACTIVE', 'COMPLETED'] } },
    orderBy: { enrolledAt: 'desc' },
    include: {
      user: { select: { id: true, name: true, email: true } },
      course: { select: { id: true, title: true, slug: true } },
    },
  });
  if (!enrollments.length) return [];

  // Har bir kursdagi jami darslar soni (modul orqali)
  const modules = await prisma.module.findMany({
    where: { courseId: { in: courseIds } },
    select: { courseId: true, _count: { select: { lessons: true } } },
  });
  const totalByCourse = new Map<string, number>();
  for (const m of modules) {
    totalByCourse.set(m.courseId, (totalByCourse.get(m.courseId) ?? 0) + m._count.lessons);
  }

  // Har bir talaba+kurs bo'yicha tugatilgan darslar
  const userIds = [...new Set(enrollments.map((e) => e.user.id))];
  const progressRows = await prisma.lessonProgress.findMany({
    where: { userId: { in: userIds }, lesson: { module: { courseId: { in: courseIds } } } },
    select: { userId: true, lesson: { select: { module: { select: { courseId: true } } } } },
  });
  const completedByUserCourse = new Map<string, number>();
  for (const p of progressRows) {
    const key = `${p.userId}:${p.lesson.module.courseId}`;
    completedByUserCourse.set(key, (completedByUserCourse.get(key) ?? 0) + 1);
  }

  return resolveLocaleDeep(
    enrollments.map((e) => ({
      id: e.id,
      status: e.status,
      enrolledAt: e.enrolledAt,
      user: e.user,
      course: e.course,
      progress: {
        totalLessons: totalByCourse.get(e.course.id) ?? 0,
        completedLessons: completedByUserCourse.get(`${e.user.id}:${e.course.id}`) ?? 0,
      },
    })),
    locale
  );
}

export async function deleteMentor(id: string) {
  const mentor = await prisma.mentor.findUnique({ where: { id } });
  if (!mentor) {
    throw ApiError.notFound('Mentor topilmadi');
  }
  try {
    await prisma.mentor.delete({ where: { id } });
  } catch (err) {
    if (isForeignKeyViolation(err)) {
      throw ApiError.conflict("Bu mentorga bog'langan kurslar bor, avval ularni boshqa mentorga o'tkazing", 'MENTOR_HAS_COURSES');
    }
    throw err;
  }
}
