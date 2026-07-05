import { Prisma } from '@prisma/client';
import { prisma } from '../config/prisma';
import { ApiError } from '../utils/ApiError';

export async function listMentors() {
  return prisma.mentor.findMany({
    orderBy: [{ featured: 'desc' }, { order: 'asc' }],
    include: { courses: { select: { id: true, title: true, slug: true } } },
  });
}

export async function getMentorById(id: string) {
  const mentor = await prisma.mentor.findUnique({
    where: { id },
    include: { courses: { select: { id: true, title: true, slug: true } } },
  });

  if (!mentor) {
    throw ApiError.notFound('Mentor topilmadi');
  }

  return mentor;
}

interface MentorInput {
  name: string;
  bio: string;
  specialty: string;
  photoUrl?: string;
  position?: string;
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
  return prisma.mentor.create({ data: input });
}

export async function updateMentor(id: string, input: Partial<MentorInput>) {
  const mentor = await prisma.mentor.findUnique({ where: { id } });
  if (!mentor) {
    throw ApiError.notFound('Mentor topilmadi');
  }
  if (input.userId) {
    await assertUserLinkable(input.userId, id);
  }
  return prisma.mentor.update({ where: { id }, data: input });
}

// MENTOR roli uchun shaxsiy kabinet ma'lumotlari
export async function getMentorDashboard(userId: string) {
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
    throw ApiError.notFound(
      "Sizning hisobingizga mentor profili bog'lanmagan. Administratorga murojaat qiling.",
      'MENTOR_NOT_LINKED'
    );
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

  return { mentor, recentEnrollments, stats: { totalStudents, activeStudents, coursesCount: mentor.courses.length } };
}

export async function deleteMentor(id: string) {
  const mentor = await prisma.mentor.findUnique({ where: { id } });
  if (!mentor) {
    throw ApiError.notFound('Mentor topilmadi');
  }
  try {
    await prisma.mentor.delete({ where: { id } });
  } catch (err) {
    if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === 'P2003') {
      throw ApiError.conflict("Bu mentorga bog'langan kurslar bor, avval ularni boshqa mentorga o'tkazing", 'MENTOR_HAS_COURSES');
    }
    throw err;
  }
}
