import { prisma } from '../config/prisma';

// Jonli efir va topshiriqlar uchun umumiy auditoriya mantig'i:
// bo'sh targetStudentIds = kursning barcha faol o'quvchilari.

// Mentor yuborgan userId'lar orasidan faqat shu kursga haqiqatan ham
// faol (ACTIVE/COMPLETED) yozilganlarini qoldiradi — boshqa kurs yoki
// mavjud bo'lmagan foydalanuvchi id'si auditoriyaga yozilib qolmasin.
export async function filterEnrolledStudentIds(courseId: string, userIds: string[]): Promise<string[]> {
  if (userIds.length === 0) return [];
  const enrollments = await prisma.enrollment.findMany({
    where: { courseId, userId: { in: userIds }, status: { in: ['ACTIVE', 'COMPLETED'] } },
    select: { userId: true },
  });
  return enrollments.map((e) => e.userId);
}

// Bildirishnoma oluvchilar: tanlangan bo'lsa faqat o'sha talabalar,
// aks holda kursning barcha faol talabalari
export async function audienceRecipientIds(courseId: string, targetStudentIds: string[]): Promise<string[]> {
  if (targetStudentIds.length > 0) return targetStudentIds;
  const enrollments = await prisma.enrollment.findMany({
    where: { courseId, status: 'ACTIVE' },
    select: { userId: true },
  });
  return enrollments.map((e) => e.userId);
}
