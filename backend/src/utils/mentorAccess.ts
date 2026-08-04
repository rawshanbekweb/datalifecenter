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

/**
 * ADMIN hamma kursni, mentor faqat o'ziga biriktirilgan kursni boshqaradi.
 *
 * Kursda bir nechta mentor bo'lishi mumkin, shuning uchun bu yerga ULARNING
 * BARCHASINING hisob id'si beriladi: har biri kursni teng boshqaradi (savolga
 * javob beradi, dasturni tahrirlaydi). Mentor profiliga user bog'lanmagan
 * bo'lsa (admin qo'lda kiritgan) ro'yxatda null turadi va hech kimga mos
 * kelmaydi.
 */
export function canManageCourse(actor: Actor, courseMentorUserIds: (string | null | undefined)[]): boolean {
  if (actor.role === 'ADMIN') return true;
  return courseMentorUserIds.some((id) => !!id && id === actor.userId);
}
