import { Prisma } from '@prisma/client';
import { prisma } from '../config/prisma';
import { SupportedLocale } from '../config/locale';
import { ApiError } from '../utils/ApiError';
import { LocalizedString, resolveLocaleDeep, toJsonInput } from '../utils/localizedField';
import { Actor, mentorNotLinkedError, requireMentorId } from '../utils/mentorAccess';
import { inheritPhoto, PersonPhoto } from '../utils/personPhoto';
import { isForeignKeyViolation } from '../utils/prismaErrors';

// Rasmi bor mentorlar oldinda: rasmsiz karta bosh harflar bilan zaxira
// ko'rinishga tushadi va yonidagi suratli kartalar orasida bo'sh ko'rinadi.
// `nulls: 'last'` — photoUrl NULL bo'lganlar oxiriga suriladi.
// ESLATMA: bo'sh satr ('') NULL emas, ya'ni "rasmli" hisoblanadi; admin
// formasi rasmni o'chirganda NULL yozishiga tayanadi.
const PHOTO_FIRST = { photoUrl: { sort: 'asc', nulls: 'last' } } as const;

/**
 * Mentorning kurslari `CourseMentor` orqali keladi (kursda bir nechta mentor
 * bo'lishi mumkin). Javobda esa oddiy `courses` massivi turadi — bog'lovchi
 * jadval mijozga ko'rinmaydi.
 */
const courseLinksSelect = {
  orderBy: [{ isLead: 'desc' }, { order: 'asc' }],
  select: { isLead: true, course: { select: { id: true, title: true, slug: true } } },
} satisfies Prisma.Mentor$courseLinksArgs;

// Bog'lovchi qatorlarni tekis kurs ro'yxatiga aylantiradi. Massiv ATAYIN
// parametr sifatida olinadi — utils/courseMentors.ts dagi `flatMentors`
// izohiga qarang: "obyektni ol, ichidagini almashtir" ko'rinishida TypeScript
// kurs tipini chiqara olmay `object`ka yassilaydi.
function flatCourses<C>(links: { isLead: boolean; course: C }[]): (C & { isLead: boolean })[] {
  return links.map((link) => ({ ...link.course, isLead: link.isLead }));
}

// O'z rasmi bo'lmasa jamoa profilidan olinadi (utils/personPhoto.ts).
// `teamProfile` javobga chiqmaydi — u faqat shu zaxira uchun o'qiladi.
const publicInclude = {
  courseLinks: courseLinksSelect,
  teamProfile: { select: { photoUrl: true, focusX: true, focusY: true } },
} satisfies Prisma.MentorInclude;

function withTeamPhoto<T extends PersonPhoto & { teamProfile: PersonPhoto | null }>(mentor: T) {
  const { teamProfile, ...rest } = inheritPhoto(mentor, mentor.teamProfile);
  return rest;
}

export async function listMentors(locale: SupportedLocale) {
  const mentors = await prisma.mentor.findMany({
    orderBy: [PHOTO_FIRST, { featured: 'desc' }, { order: 'asc' }],
    include: publicInclude,
  });
  return resolveLocaleDeep(mentors.map((m) => {
    const { courseLinks, ...rest } = withTeamPhoto(m);
    return { ...rest, courses: flatCourses(courseLinks) };
  }), locale);
}

export async function getMentorById(id: string, locale: SupportedLocale) {
  const mentor = await prisma.mentor.findUnique({
    where: { id },
    include: publicInclude,
  });

  if (!mentor) {
    throw ApiError.notFound('Mentor topilmadi');
  }

  const { courseLinks, ...rest } = withTeamPhoto(mentor);
  return resolveLocaleDeep({ ...rest, courses: flatCourses(courseLinks) }, locale);
}

// Admin tahrirlash paneli uchun — xom {uz,ru,kaa,en} obyektini qaytaradi
export async function listMentorsAdmin() {
  const mentors = await prisma.mentor.findMany({
    orderBy: [{ featured: 'desc' }, { order: 'asc' }],
    include: { courseLinks: courseLinksSelect },
  });
  return mentors.map(({ courseLinks, ...rest }) => ({ ...rest, courses: flatCourses(courseLinks) }));
}

interface MentorInput {
  name: string;
  bio: LocalizedString;
  specialty: LocalizedString;
  photoUrl?: string;
  // Rasm kadrga kesilganda markazda qoladigan nuqta (foizda)
  focusX?: number;
  focusY?: number;
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
    include: { courseLinks: courseLinksSelect },
  });
  if (!mentor) {
    throw mentorNotLinkedError();
  }
  const { courseLinks, ...rest } = mentor;
  return { ...rest, courses: flatCourses(courseLinks) };
}

// Mentor o'z profilini tahrirlaydi (faqat ochiq maydonlar — featured/order/userId emas)
export async function updateMentorMe(
  userId: string,
  input: Partial<Pick<MentorInput, 'name' | 'bio' | 'specialty' | 'photoUrl' | 'focusX' | 'focusY' | 'position' | 'linkedinUrl' | 'githubUrl' | 'telegramUrl'>>
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
  const where: Prisma.CourseWhereInput = { id: courseId };
  if (actor.role !== 'ADMIN') {
    where.mentors = { some: { mentorId: await requireMentorId(actor.userId) } };
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
  const found = await prisma.mentor.findUnique({
    where: { userId },
    include: {
      courseLinks: {
        orderBy: [{ isLead: 'desc' }, { order: 'asc' }],
        select: {
          isLead: true,
          course: { include: { _count: { select: { enrollments: true, modules: true } } } },
        },
      },
    },
  });

  if (!found) {
    throw mentorNotLinkedError();
  }
  const { courseLinks, ...profile } = found;
  const mentor = { ...profile, courses: flatCourses(courseLinks) };

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

  // Mentor o'z kurslarining qiziqish raqamlarini ham ko'radi: hisoblagichlar
  // kurs qatorida denormallashtirilgan, ya'ni bu qo'shimcha so'rov emas.
  const totalViews = mentor.courses.reduce((sum, c) => sum + c.views, 0);
  const totalLikes = mentor.courses.reduce((sum, c) => sum + c.likesCount, 0);

  return resolveLocaleDeep(
    {
      mentor,
      recentEnrollments,
      stats: { totalStudents, activeStudents, coursesCount: mentor.courses.length, totalViews, totalLikes },
    },
    locale
  );
}

// Mentor kurslaridagi talabalar va ularning dars progressi
export async function getMentorStudents(userId: string, locale: SupportedLocale) {
  const mentor = await prisma.mentor.findUnique({
    where: { userId },
    select: { id: true, courseLinks: { select: { courseId: true } } },
  });

  if (!mentor) {
    throw mentorNotLinkedError();
  }

  const courseIds = mentor.courseLinks.map((link) => link.courseId);
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

  // `CourseMentor` cascade bilan o'chadi, ya'ni baza bu holatni to'smaydi —
  // mentor kurslardan JIMGINA yo'qolib qolardi (kursning yagona mentori
  // bo'lsa kurs mentorsiz qolardi). Shuning uchun tekshiruv shu yerda.
  const attachedCourses = await prisma.courseMentor.count({ where: { mentorId: id } });
  if (attachedCourses > 0) {
    throw ApiError.conflict(
      "Bu mentorga bog'langan kurslar bor, avval uni kurslardan olib tashlang",
      'MENTOR_HAS_COURSES'
    );
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
