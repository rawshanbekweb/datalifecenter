import request from 'supertest';
import type { Role } from '@prisma/client';
import app from '../src/app';
import { prisma } from '../src/config/prisma';
import { hashPassword } from '../src/utils/password';

export { app, prisma };

// Barcha jadvallarni FK tartibida tozalaydi — har bir test to'plami toza bazadan boshlanadi
export async function resetDb(): Promise<void> {
  await prisma.$transaction([
    prisma.assignmentSubmission.deleteMany(),
    prisma.assignment.deleteMany(),
    prisma.lessonProgress.deleteMany(),
    prisma.lessonQuestion.deleteMany(),
    prisma.message.deleteMany(),
    prisma.conversationParticipant.deleteMany(),
    prisma.conversation.deleteMany(),
    prisma.courseRequest.deleteMany(),
    prisma.notification.deleteMany(),
    prisma.passwordResetToken.deleteMany(),
    prisma.paymentTransaction.deleteMany(),
    prisma.subscription.deleteMany(),
    prisma.enrollment.deleteMany(),
    prisma.liveSession.deleteMany(),
    prisma.mentorRequest.deleteMany(),
    prisma.announcement.deleteMany(),
    prisma.lesson.deleteMany(),
    prisma.module.deleteMany(),
    // Kurs ↔ mentor bog'lanishi cascade bilan o'chadi, lekin mentor
    // qatorlari kursdan KEYIN o'chirilgani uchun tartib ochiq yozildi
    prisma.courseMentor.deleteMany(),
    prisma.course.deleteMany(),
    prisma.blogPost.deleteMany(),
    // TeamMemberProject onDelete: Cascade — lekin Project qatorlari testlarda
    // qolib ketmasligi uchun bog'lanishlar ochiq-oydin tozalanadi
    prisma.teamMemberProject.deleteMany(),
    prisma.teamMember.deleteMany(),
    prisma.project.deleteMany(),
    prisma.mentor.deleteMany(),
    prisma.partner.deleteMany(),
    prisma.contactMessage.deleteMany(),
    // Qiziqish hisoblagichlarida foreign key yo'q (polimorf) — o'zi tozalanmaydi
    prisma.contentLike.deleteMany(),
    prisma.contentView.deleteMany(),
    prisma.engagementDaily.deleteMany(),
    prisma.user.deleteMany(),
  ]);
}

export const TEST_PASSWORD = 'Passw0rd!';

export async function createUser(email: string, role: Role = 'STUDENT', name = 'Test User') {
  const passwordHash = await hashPassword(TEST_PASSWORD);
  return prisma.user.create({ data: { email, name, passwordHash, role } });
}

// Cookie'larni saqlaydigan supertest agenti bilan login qiladi
export async function loginAgent(email: string, password: string = TEST_PASSWORD) {
  const agent = request.agent(app);
  await agent.post('/api/auth/login').send({ email, password }).expect(200);
  return agent;
}
