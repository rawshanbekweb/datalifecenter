import { CourseFormat } from '@prisma/client';
import { prisma } from '../config/prisma';
import { ApiError } from '../utils/ApiError';

/**
 * Guruh sig'imi — "bir vaqtda 5-6 kishi" qoidasi shu yerda, BITTA joyda.
 *
 * Chegara onlayn va offline uchun alohida (Course.onlineSeats / offlineSeats),
 * chunki HYBRID kursda ikki guruh mustaqil to'ladi. null = cheklov yo'q.
 *
 * BAND JOY:
 *   onlayn  — PENDING yoki ACTIVE Enrollment (PENDING ham joyni band qiladi:
 *             admin to'lovni tasdiqlagunicha o'rin boshqasiga berilmasin)
 *   offline — ENROLLED holatidagi CourseRequest (offline yozilishda Enrollment
 *             yaratilmaydi — courseRequests.service.ts izohiga qarang)
 *
 * COMPLETED/CANCELLED joyni bo'shatadi: chegara ayni paytda o'qiyotganlar
 * uchun, kursni tamomlaganlar keyingi guruhning o'rnini egallamaydi.
 */

export interface SeatInfo {
  /** Jami joy; null = cheklanmagan */
  total: number | null;
  taken: number;
  /** Qolgan joy; null = cheklanmagan */
  left: number | null;
  full: boolean;
}

export async function countTakenSeats(courseId: string, format: 'ONLINE' | 'OFFLINE'): Promise<number> {
  if (format === 'ONLINE') {
    return prisma.enrollment.count({
      where: { courseId, status: { in: ['PENDING', 'ACTIVE'] } },
    });
  }
  return prisma.courseRequest.count({
    where: { courseId, format: 'OFFLINE', status: 'ENROLLED' },
  });
}

function toSeatInfo(total: number | null, taken: number): SeatInfo {
  if (total === null) {
    return { total: null, taken, left: null, full: false };
  }
  const left = Math.max(0, total - taken);
  return { total, taken, left, full: left === 0 };
}

interface SeatCourse {
  id: string;
  onlineSeats: number | null;
  offlineSeats: number | null;
}

/** Bitta kursning ikkala guruhi bo'yicha joy holati. */
export async function getCourseSeats(course: SeatCourse): Promise<{ online: SeatInfo; offline: SeatInfo }> {
  const [onlineTaken, offlineTaken] = await Promise.all([
    countTakenSeats(course.id, 'ONLINE'),
    countTakenSeats(course.id, 'OFFLINE'),
  ]);
  return {
    online: toSeatInfo(course.onlineSeats, onlineTaken),
    offline: toSeatInfo(course.offlineSeats, offlineTaken),
  };
}

/**
 * Ro'yxat sahifasi uchun: bitta so'rovda hamma kursning band joylari.
 * Kurs boshiga alohida COUNT yuborilsa, 12 ta kursli sahifa 24 ta so'rov
 * qilardi (engagement.service.ts dagi paketli hisob bilan bir xil sabab).
 */
export async function getSeatsForCourses<T extends SeatCourse>(
  courses: T[]
): Promise<Map<string, { online: SeatInfo; offline: SeatInfo }>> {
  const ids = courses.map((c) => c.id);
  const result = new Map<string, { online: SeatInfo; offline: SeatInfo }>();
  if (ids.length === 0) return result;

  const [onlineRows, offlineRows] = await Promise.all([
    prisma.enrollment.groupBy({
      by: ['courseId'],
      where: { courseId: { in: ids }, status: { in: ['PENDING', 'ACTIVE'] } },
      _count: { _all: true },
    }),
    prisma.courseRequest.groupBy({
      by: ['courseId'],
      where: { courseId: { in: ids }, format: 'OFFLINE', status: 'ENROLLED' },
      _count: { _all: true },
    }),
  ]);

  const onlineTaken = new Map(onlineRows.map((r) => [r.courseId, r._count._all]));
  const offlineTaken = new Map(offlineRows.map((r) => [r.courseId, r._count._all]));

  for (const course of courses) {
    result.set(course.id, {
      online: toSeatInfo(course.onlineSeats, onlineTaken.get(course.id) ?? 0),
      offline: toSeatInfo(course.offlineSeats, offlineTaken.get(course.id) ?? 0),
    });
  }
  return result;
}

/**
 * Joy qolmagan bo'lsa yozilishni to'xtatadi. Yozilish SO'ROVI (CourseRequest)
 * bunga bo'ysunmaydi — guruh to'lganda ham navbat yig'iladi, admin keyingi
 * guruhni shu ro'yxatga qarab ochadi.
 */
export async function assertSeatAvailable(course: SeatCourse, format: 'ONLINE' | 'OFFLINE'): Promise<void> {
  const total = format === 'ONLINE' ? course.onlineSeats : course.offlineSeats;
  if (total === null) return;

  const taken = await countTakenSeats(course.id, format);
  if (taken >= total) {
    throw ApiError.conflict(
      'Bu guruhda joylar tugagan — keyingi guruh ochilishini kuting yoki so‘rov qoldiring',
      'COURSE_FULL'
    );
  }
}

/** HYBRID bo'lmagan kursda so'ralgan format kursning o'z formatiga tenglashtiriladi. */
export function seatFormatFor(courseFormat: CourseFormat, requested: CourseFormat): 'ONLINE' | 'OFFLINE' {
  if (requested === 'ONLINE' || requested === 'OFFLINE') return requested;
  return courseFormat === 'OFFLINE' ? 'OFFLINE' : 'ONLINE';
}
