import { Prisma } from '@prisma/client';
import { prisma } from '../config/prisma';

/**
 * Kurs ↔ mentor bog'lanishi bilan ishlashning yagona joyi.
 *
 * Kursda bir nechta mentor bo'ladi (`CourseMentor`), lekin API javoblari
 * TEKIS ro'yxat qaytaradi: `course.mentors = [{...mentor, isLead}]`. Frontend
 * bog'lovchi jadval haqida bilishi shart emas, u faqat "kimlar o'tadi"
 * degan savolga javob oladi.
 *
 * Tartib hamma joyda bir xil: asosiy mentor birinchi, keyin admin qo'ygan
 * tartib. Aks holda kurs kartasi har yuklanishda mentorlarni boshqacha
 * ko'rsatardi (Postgres tartibsiz qaytaradi).
 */
const ORDER = [
  { isLead: 'desc' },
  { order: 'asc' },
  { createdAt: 'asc' },
] satisfies Prisma.CourseMentorOrderByWithRelationInput[];

/** Ro'yxatlar uchun: faqat ism va id */
export const mentorsBrief = {
  mentors: {
    orderBy: ORDER,
    select: { isLead: true, mentor: { select: { id: true, name: true } } },
  },
} satisfies Prisma.CourseInclude;

/** Kurs sahifasi uchun: to'liq mentor profili (bio, surat, havolalar) */
export const mentorsFull = {
  mentors: { orderBy: ORDER, include: { mentor: true } },
} satisfies Prisma.CourseInclude;

/** Faqat ruxsat tekshiruvi uchun: mentorning hisob (user) id'si */
export const mentorsForAccess = {
  mentors: { select: { mentor: { select: { userId: true } } } },
} satisfies Prisma.CourseInclude;

/**
 * Bog'lovchi qatorlarni tekis mentor ro'yxatiga aylantiradi:
 * `[{ isLead, mentor }]` → `[{ ...mentor, isLead }]`. Javob shaklini
 * soddalashtiradi — frontend `m.mentor.name` emas, `m.name` yozadi.
 *
 * Massiv ATAYIN parametr sifatida olinadi (butun kurs obyekti emas): TypeScript
 * generikni shu holatdagina mentor tanlovidan (select) aniq chiqara oladi,
 * "kursni ol, mentorlarini almashtir" ko'rinishida esa tip `object`ka
 * yassilanib, chaqiruv joyida maydonlar yo'qolardi.
 */
export function flatMentors<M>(links: { isLead: boolean; mentor: M }[]): (M & { isLead: boolean })[] {
  return links.map((link) => ({ ...link.mentor, isLead: link.isLead }));
}

/** Kursning barcha mentor id'lari — asosiysi birinchi */
export async function courseMentorIds(courseId: string): Promise<string[]> {
  const links = await prisma.courseMentor.findMany({
    where: { courseId },
    orderBy: ORDER,
    select: { mentorId: true },
  });
  return links.map((l) => l.mentorId);
}

/**
 * Kursning asosiy mentori. `isLead` qo'yilmagan bo'lsa birinchi biriktirilgani
 * olinadi — admin kurs nomidan sessiya/topshiriq yaratganda muallif kerak,
 * va "asosiysi belgilanmagan" holat butun amalni to'xtatib qo'ymasligi kerak.
 */
export async function leadMentorId(courseId: string): Promise<string | null> {
  const link = await prisma.courseMentor.findFirst({
    where: { courseId },
    orderBy: ORDER,
    select: { mentorId: true },
  });
  return link?.mentorId ?? null;
}

/** Shu mentor kursga biriktirilganmi */
export async function isCourseMentor(courseId: string, mentorId: string): Promise<boolean> {
  const link = await prisma.courseMentor.findUnique({
    where: { courseId_mentorId: { courseId, mentorId } },
    select: { id: true },
  });
  return link !== null;
}

/**
 * Kursning mentorlari ro'yxatini butunlay almashtiradi.
 *
 * BITTA tranzaksiyada: eskisini o'chirib, yangisini yozadi. Qisman bajarilsa
 * kurs mentorsiz qolib ketardi — mentorlar esa o'z kabinetida darhol kursni
 * yo'qotardi. Ro'yxatdagi BIRINCHI mentor asosiy (`isLead`) bo'ladi: kursda
 * ko'pi bilan bitta asosiy mentor bo'lishi shu yerda ta'minlanadi.
 */
export async function setCourseMentors(courseId: string, mentorIds: string[]): Promise<void> {
  // Takrorlarni tashlaymiz — noyoblik cheklovi buzilmasin
  const unique = [...new Set(mentorIds)];

  await prisma.$transaction(async (tx) => {
    // Ro'yxat bo'sh bo'lsa `notIn: []` hamma qatorni o'chiradi — bu ATAYIN:
    // admin ro'yxatni bo'shatsa kurs mentorsiz qoladi (ilgari ham `mentorId: null`
    // ruxsat etilgan holat edi).
    await tx.courseMentor.deleteMany({ where: { courseId, mentorId: { notIn: unique } } });

    for (const [index, mentorId] of unique.entries()) {
      const data = { isLead: index === 0, order: index };
      await tx.courseMentor.upsert({
        where: { courseId_mentorId: { courseId, mentorId } },
        create: { courseId, mentorId, ...data },
        update: data,
      });
    }
  });
}
