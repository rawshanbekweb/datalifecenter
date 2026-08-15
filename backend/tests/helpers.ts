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
    // Guruhlar kurs bilan cascade o'chadi, lekin tartib ochiq yozilgani
    // ma'qul: yozilishlar allaqachon yuqorida o'chirilgan
    prisma.courseGroup.deleteMany(),
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

/**
 * `verified` ATAYIN sukut bo'yicha false: haqiqiy ro'yxatdan o'tish ham
 * shunday boshlanadi va `users.test.ts` aynan tasdiqlanmagan hisoblar
 * ro'yxatini tekshiradi. Emaili tasdiqlangan hisob kerak bo'lsa (masalan
 * kurs so'rovi yuborish uchun) ochiq-oydin `true` beriladi.
 */
export async function createUser(email: string, role: Role = 'STUDENT', name = 'Test User', verified = false) {
  const passwordHash = await hashPassword(TEST_PASSWORD);
  return prisma.user.create({
    data: { email, name, passwordHash, role, emailVerifiedAt: verified ? new Date() : null },
  });
}

// Cookie'larni saqlaydigan supertest agenti bilan login qiladi
export async function loginAgent(email: string, password: string = TEST_PASSWORD) {
  const agent = request.agent(app);
  await agent.post('/api/auth/login').send({ email, password }).expect(200);
  return agent;
}
