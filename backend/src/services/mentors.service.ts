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
}

export async function createMentor(input: MentorInput) {
  return prisma.mentor.create({ data: input });
}

export async function updateMentor(id: string, input: Partial<MentorInput>) {
  const mentor = await prisma.mentor.findUnique({ where: { id } });
  if (!mentor) {
    throw ApiError.notFound('Mentor topilmadi');
  }
  return prisma.mentor.update({ where: { id }, data: input });
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
