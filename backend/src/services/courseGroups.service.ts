import { CourseGroupStatus, EnrollmentFormat, Prisma } from '@prisma/client';
import { prisma } from '../config/prisma';
import { SupportedLocale } from '../config/locale';
import { ApiError } from '../utils/ApiError';
import { Actor, requireMentorId } from '../utils/mentorAccess';
import { resolveLocaleDeep, toUzText } from '../utils/localizedField';
import { notify } from './notifications.service';

/**
 * O'quv guruhlari — "kimga qabul qilindi" dan keyingi savol: QACHON, QAYERDA
 * va KIM BILAN. Modelning o'zi va nega kerakligi schema.prisma dagi
 * CourseGroup izohida.
 *
 * KIM BOSHQARADI: yozish amallari faqat ADMIN'da. Guruh ochish — ma'muriy
 * qaror (xona, jadval, to'lov, sig'im), mentor esa unga biriktiriladi.
 * Mentor o'z guruhlarini KO'RADI (jadval unga ham kerak), lekin tahrirlay
 * olmaydi — aks holda ikki mentor bir xonani bir vaqtga yozib qo'yardi.
 */

// Bildirishnoma va xat matnlari hozircha faqat o'zbekcha (localizedField.ts
// dagi toUzText bilan bir xil qoida) — tarjimasi alohida ish
const WEEKDAY_UZ = ['Yakshanba', 'Dushanba', 'Seshanba', 'Chorshanba', 'Payshanba', 'Juma', 'Shanba'];

export interface GroupScheduleFields {
  name: string;
  startsAt: Date;
  weekdays: number[];
  startTime: string | null;
  room: string | null;
}

/**
 * Guruh jadvalining bir qatorli ta'rifi: "Python-3 kechki · boshlanish:
 * 15.09.2026 · Dushanba, Chorshanba, Juma 18:00 · 2-xona".
 *
 * Bitta joyda turadi, chunki bir xil matn uch joyda kerak: qabul
 * bildirishnomasi, qabul xati va jadval o'zgargandagi xabar.
 */
export function groupScheduleText(group: GroupScheduleFields): string {
  const parts = [group.name, `boshlanish: ${group.startsAt.toLocaleDateString('uz-UZ')}`];
  const days = group.weekdays.map((d) => WEEKDAY_UZ[d]).filter(Boolean).join(', ');
  if (days) {
    parts.push(group.startTime ? `${days} ${group.startTime}` : days);
  }
  if (group.room) {
    parts.push(group.room);
  }
  return parts.join(' · ');
}

const groupInclude = {
  course: { select: { id: true, title: true, slug: true, color: true, iconKey: true } },
  mentor: { select: { id: true, name: true, photoUrl: true, focusX: true, focusY: true } },
  // A'zolar soni har ro'yxatda kerak: "5/6 to'lgan"
  _count: { select: { enrollments: true } },
} satisfies Prisma.CourseGroupInclude;

export interface CreateCourseGroupInput {
  courseId: string;
  name: string;
  format: EnrollmentFormat;
  mentorId?: string | null;
  status?: CourseGroupStatus;
  startsAt: Date;
  endsAt?: Date | null;
  weekdays?: number[];
  startTime?: string | null;
  durationMin?: number;
  room?: string | null;
  capacity?: number | null;
}

export type UpdateCourseGroupInput = Partial<Omit<CreateCourseGroupInput, 'courseId'>>;

/** Mentor faqat o'ziga biriktirilgan kurslarning guruhlarini ko'radi. */
async function visibilityFilter(actor: Actor): Promise<Prisma.CourseGroupWhereInput> {
  if (actor.role === 'ADMIN') return {};
  const mentorId = await requireMentorId(actor.userId);
  // Guruhning o'ziga biriktirilgani ham, kursiga biriktirilgani ham ko'rinadi:
  // mentor guruhga hali tayinlanmagan bo'lishi mumkin, lekin kursni o'zi o'tadi
  return {
    OR: [
      { mentorId },
      { course: { mentors: { some: { mentorId } } } },
    ],
  };
}

interface ListFilters {
  courseId?: string;
  status?: CourseGroupStatus;
  format?: EnrollmentFormat;
}

export async function listCourseGroups(filters: ListFilters, actor: Actor, locale: SupportedLocale) {
  const groups = await prisma.courseGroup.findMany({
    where: {
      ...(await visibilityFilter(actor)),
      ...(filters.courseId ? { courseId: filters.courseId } : {}),
      ...(filters.status ? { status: filters.status } : {}),
      ...(filters.format ? { format: filters.format } : {}),
    },
    // Ochilayotgan guruhlar tepada, keyin boshlanish sanasi bo'yicha
    orderBy: [{ status: 'asc' }, { startsAt: 'asc' }],
    include: groupInclude,
  });
  return resolveLocaleDeep(groups, locale);
}

/** Bitta guruh + a'zolari (admin va kursning mentori uchun). */
export async function getCourseGroup(id: string, actor: Actor, locale: SupportedLocale) {
  const group = await prisma.courseGroup.findFirst({
    where: { id, ...(await visibilityFilter(actor)) },
    include: {
      ...groupInclude,
      enrollments: {
        orderBy: { enrolledAt: 'asc' },
        select: {
          id: true,
          status: true,
          paymentStatus: true,
          enrolledAt: true,
          user: { select: { id: true, name: true, email: true, avatarUrl: true, focusX: true, focusY: true } },
        },
      },
    },
  });
  if (!group) {
    throw ApiError.notFound('Guruh topilmadi');
  }
  return resolveLocaleDeep(group, locale);
}

/**
 * Guruhning o'quvchi ko'radigan qismi — kabinetdagi jadval kartasi uchun.
 * Faqat FAOL yozilishlar: bekor qilingan o'quvchiga jadval ko'rsatilmaydi.
 */
export async function listMyCourseGroups(userId: string, locale: SupportedLocale) {
  const enrollments = await prisma.enrollment.findMany({
    where: { userId, status: { in: ['ACTIVE', 'PENDING'] }, groupId: { not: null } },
    orderBy: { enrolledAt: 'desc' },
    select: {
      id: true,
      status: true,
      group: { include: groupInclude },
    },
  });

  const rows = enrollments
    .filter((e) => e.group !== null && e.group.status !== 'FINISHED')
    .map((e) => ({ enrollmentId: e.id, ...e.group! }));
  return resolveLocaleDeep(rows, locale);
}

/** Guruh formati kursning formatiga mos kelishini tekshiradi. */
async function assertCourseAllowsFormat(courseId: string, format: EnrollmentFormat): Promise<void> {
  const course = await prisma.course.findUnique({ where: { id: courseId }, select: { format: true } });
  if (!course) {
    throw ApiError.notFound('Kurs topilmadi');
  }
  // HYBRID kursda ikkala guruh ham bo'ladi, aks holda faqat kursning formati
  if (course.format !== 'HYBRID' && course.format !== format) {
    throw ApiError.badRequest('Guruh formati kurs formatiga mos emas', 'GROUP_FORMAT_MISMATCH');
  }
}

/** Mentor shu kursga biriktirilganmi — begona mentor guruhga qo'yilmasin. */
async function assertMentorTeachesCourse(courseId: string, mentorId: string): Promise<void> {
  const link = await prisma.courseMentor.findUnique({
    where: { courseId_mentorId: { courseId, mentorId } },
    select: { id: true },
  });
  if (!link) {
    throw ApiError.badRequest('Bu mentor kursga biriktirilmagan', 'MENTOR_NOT_ON_COURSE');
  }
}

export async function createCourseGroup(input: CreateCourseGroupInput, locale: SupportedLocale) {
  await assertCourseAllowsFormat(input.courseId, input.format);
  if (input.mentorId) {
    await assertMentorTeachesCourse(input.courseId, input.mentorId);
  }

  const group = await prisma.courseGroup.create({
    data: { ...input, weekdays: input.weekdays ?? [] },
    include: groupInclude,
  });
  return resolveLocaleDeep(group, locale);
}

export async function updateCourseGroup(id: string, input: UpdateCourseGroupInput, locale: SupportedLocale) {
  const existing = await prisma.courseGroup.findUnique({
    where: { id },
    select: { id: true, courseId: true, format: true, status: true },
  });
  if (!existing) {
    throw ApiError.notFound('Guruh topilmadi');
  }
  if (input.format && input.format !== existing.format) {
    await assertCourseAllowsFormat(existing.courseId, input.format);
  }
  if (input.mentorId) {
    await assertMentorTeachesCourse(existing.courseId, input.mentorId);
  }

  const group = await prisma.courseGroup.update({
    where: { id },
    data: input,
    include: groupInclude,
  });

  // Jadval o'zgarsa o'quvchi buni bilishi SHART — u shu vaqtga kelib
  // markazga chiqadi. Guruh nomi/xonasi/kunlari tegilganda xabar beriladi.
  const scheduleChanged =
    input.weekdays !== undefined
    || input.startTime !== undefined
    || input.startsAt !== undefined
    || input.room !== undefined;
  if (scheduleChanged) {
    const memberIds = await prisma.enrollment.findMany({
      where: { groupId: id, status: { in: ['ACTIVE', 'PENDING'] } },
      select: { userId: true },
    });
    await notify(memberIds.map((m) => m.userId), {
      type: 'ANNOUNCEMENT',
      title: `Jadval yangilandi: ${group.name}`,
      body: `${toUzText(group.course.title)} — ${groupScheduleText(group)}`,
      link: '/student',
    });
  }

  return resolveLocaleDeep(group, locale);
}

export async function deleteCourseGroup(id: string): Promise<void> {
  const group = await prisma.courseGroup.findUnique({ where: { id }, select: { id: true } });
  if (!group) {
    throw ApiError.notFound('Guruh topilmadi');
  }
  // A'zolarning yozilishi saqlanadi, faqat guruh bog'lanishi uziladi (SetNull) —
  // o'quvchi kursdan chiqarilmaydi, u boshqa guruhga o'tkaziladi
  await prisma.courseGroup.delete({ where: { id } });
}

/**
 * O'quvchini guruhga qo'yadi (yoki `groupId: null` bilan guruhdan chiqaradi).
 *
 * Tekshiruvlar: yozilish va guruh bitta kursniki bo'lishi, formatlar mos
 * kelishi va guruhda joy qolgani. Sig'im nega kurs sig'imidan alohida —
 * schema.prisma dagi CourseGroup izohiga qarang.
 */
export async function setEnrollmentGroup(enrollmentId: string, groupId: string | null, locale: SupportedLocale) {
  const enrollment = await prisma.enrollment.findUnique({
    where: { id: enrollmentId },
    select: { id: true, courseId: true, format: true, groupId: true },
  });
  if (!enrollment) {
    throw ApiError.notFound('Yozilish topilmadi');
  }

  if (groupId !== null) {
    await assertGroupFits(groupId, enrollment);
  }

  const updated = await prisma.enrollment.update({
    where: { id: enrollmentId },
    data: { groupId },
    include: {
      user: { select: { id: true, name: true, email: true } },
      group: { include: groupInclude },
    },
  });
  return resolveLocaleDeep(updated, locale);
}

interface EnrollmentForGroup {
  id: string;
  courseId: string;
  format: EnrollmentFormat;
  groupId: string | null;
}

/**
 * Yozilishni shu guruhga qo'yish mumkinmi. Guruhga birinchi marta
 * qo'shilayotgan bo'lsagina joy sanaladi — allaqachon shu guruhdagi
 * o'quvchini qayta saqlash joyni ikkinchi marta yemasligi kerak.
 */
export async function assertGroupFits(groupId: string, enrollment: EnrollmentForGroup): Promise<void> {
  const group = await prisma.courseGroup.findUnique({
    where: { id: groupId },
    select: { id: true, courseId: true, format: true, capacity: true, status: true },
  });
  if (!group) {
    throw ApiError.notFound('Guruh topilmadi');
  }
  if (group.courseId !== enrollment.courseId) {
    throw ApiError.badRequest('Guruh boshqa kursga tegishli', 'GROUP_COURSE_MISMATCH');
  }
  if (group.format !== enrollment.format) {
    throw ApiError.badRequest(
      "Guruh formati o'quvchining yozilish formatiga mos emas",
      'GROUP_FORMAT_MISMATCH'
    );
  }
  if (group.status === 'FINISHED') {
    throw ApiError.conflict("Tugagan guruhga o'quvchi qo'shilmaydi", 'GROUP_FINISHED');
  }
  if (group.capacity !== null && enrollment.groupId !== groupId) {
    const taken = await prisma.enrollment.count({
      where: { groupId, status: { in: ['PENDING', 'ACTIVE'] } },
    });
    if (taken >= group.capacity) {
      throw ApiError.conflict('Bu guruhda joylar tugagan', 'GROUP_FULL');
    }
  }
}
