import { prisma } from '../config/prisma';
import { ApiError } from './ApiError';

export interface Actor {
  userId: string;
  role: string;
}

// Frontend MentorNotLinked UI'si aynan shu kod va xabarga bog'langan — faqat shu yerdan o'zgartirilsin
export const mentorNotLinkedError = () =>
  ApiError.notFound(
    "Sizning hisobingizga mentor profili bog'lanmagan. Administratorga murojaat qiling.",
    'MENTOR_NOT_LINKED'
  );

// userId'ga bog'langan Mentor yozuvining id'sini qaytaradi, bo'lmasa MENTOR_NOT_LINKED otadi
export async function requireMentorId(userId: string): Promise<string> {
  const mentor = await prisma.mentor.findUnique({ where: { userId }, select: { id: true } });
  if (!mentor) {
    throw mentorNotLinkedError();
  }
  return mentor.id;
}

// ADMIN hamma kursni, mentor faqat o'ziga biriktirilgan kursni boshqaradi
export function canManageCourse(actor: Actor, courseMentorUserId: string | null | undefined): boolean {
  if (actor.role === 'ADMIN') return true;
  return !!courseMentorUserId && courseMentorUserId === actor.userId;
}
