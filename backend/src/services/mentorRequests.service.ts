import { prisma } from '../config/prisma';
import { ApiError } from '../utils/ApiError';
import { requireMentorId } from '../utils/mentorAccess';
import { excerpt, notify, notifyAdmins } from './notifications.service';

export async function createRequest(userId: string, input: { subject: string; body: string }) {
  const mentorId = await requireMentorId(userId);
  const request = await prisma.mentorRequest.create({
    data: { mentorId, subject: input.subject, body: input.body },
    include: { mentor: { select: { name: true } } },
  });

  await notifyAdmins({
    type: 'NEW_MENTOR_REQUEST',
    title: `Yangi mentor so'rovi: ${input.subject}`,
    body: `${request.mentor.name}: ${excerpt(input.body, 120)}`,
    link: '/admin/mentor-requests',
  });

  return request;
}

export async function listMyRequests(userId: string) {
  const mentorId = await requireMentorId(userId);
  return prisma.mentorRequest.findMany({
    where: { mentorId },
    orderBy: { createdAt: 'desc' },
  });
}

// Admin: barcha mentor so'rovlari (ochiqlari oldinda)
export async function listAllRequests() {
  return prisma.mentorRequest.findMany({
    orderBy: [{ status: 'asc' }, { createdAt: 'desc' }],
    include: { mentor: { select: { id: true, name: true, photoUrl: true, user: { select: { email: true } } } } },
  });
}

export async function updateRequest(id: string, input: { reply?: string; status?: 'OPEN' | 'ANSWERED' | 'CLOSED' }) {
  const request = await prisma.mentorRequest.findUnique({
    where: { id },
    include: { mentor: { select: { userId: true } } },
  });
  if (!request) {
    throw ApiError.notFound("So'rov topilmadi");
  }
  const data: { reply?: string; repliedAt?: Date; status?: 'OPEN' | 'ANSWERED' | 'CLOSED' } = {};
  if (input.reply !== undefined) {
    data.reply = input.reply;
    data.repliedAt = new Date();
    data.status = 'ANSWERED';
  }
  if (input.status !== undefined) {
    data.status = input.status;
  }
  const updated = await prisma.mentorRequest.update({
    where: { id },
    data,
    include: { mentor: { select: { id: true, name: true, photoUrl: true, user: { select: { email: true } } } } },
  });

  if (input.reply !== undefined && request.mentor.userId) {
    await notify(request.mentor.userId, {
      type: 'MENTOR_REQUEST_REPLIED',
      title: `So'rovingizga javob berildi: ${request.subject}`,
      body: excerpt(input.reply),
      link: '/mentor/requests',
    });
  }

  return updated;
}
