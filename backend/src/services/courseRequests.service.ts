import { CourseFormat, CourseRequestStatus, Prisma } from '@prisma/client';
import { prisma } from '../config/prisma';
import { SupportedLocale } from '../config/locale';
import { ApiError } from '../utils/ApiError';
import { Actor } from '../utils/mentorAccess';
import { resolveLocaleDeep, toUzText } from '../utils/localizedField';
import { excerpt, notifyAdmins } from './notifications.service';
import { sendAdminMessageTo } from './messages.service';

/**
 * Kursga qiziqqan odamning administratsiyaga murojaati.
 *
 * NEGA ENROLLMENT EMAS: offline guruhga o'quvchi o'zi yozilib qo'ya olmaydi —
 * joy, jadval va to'lov admin bilan kelishiladi. Agar bu Enrollment orqali
 * qilinsa, to'lanmagan, hatto hali gaplashilmagan yozilishlar kurs
 * statistikasi, progress va sertifikat tizimiga aralashib ketardi.
 *
 * Mehmon ham (login qilmasdan) so'rov yubora oladi: aynan shu odamlar
 * keyinchalik ro'yxatdan o'tadi. Login qilgan bo'lsa — so'rov hisobiga
 * bog'lanadi va adminning javobi uning yozishmasiga tushadi.
 */

const requestInclude = {
  course: { select: { id: true, title: true, slug: true, format: true, color: true } },
  user: { select: { id: true, name: true, email: true, avatarUrl: true, focusX: true, focusY: true } },
} satisfies Prisma.CourseRequestInclude;

export interface CreateCourseRequestInput {
  courseId: string;
  format: CourseFormat;
  name: string;
  phone: string;
  email?: string | null;
  note?: string | null;
}

/**
 * So'ralgan format kursning formatiga mos kelishini tekshiradi.
 * HYBRID kursda tanlov o'quvchida, aks holda faqat kursning o'z formati.
 */
function assertFormatAllowed(courseFormat: CourseFormat, requested: CourseFormat): void {
  if (requested === 'HYBRID') {
    throw ApiError.badRequest('Format aniq tanlanishi kerak (online yoki offline)', 'INVALID_FORMAT');
  }
  if (courseFormat !== 'HYBRID' && courseFormat !== requested) {
    throw ApiError.badRequest('Bu kurs tanlangan formatda o‘tilmaydi', 'FORMAT_NOT_AVAILABLE');
  }
}

export async function createCourseRequest(
  input: CreateCourseRequestInput,
  userId: string | undefined,
  locale: SupportedLocale,
) {
  const course = await prisma.course.findFirst({
    where: { id: input.courseId, published: true },
    select: { id: true, title: true, format: true },
  });
  if (!course) {
    throw ApiError.notFound('Kurs topilmadi');
  }
  // DIQQAT: yozilish yopiq bo'lsa ham so'rov QABUL QILINADI va bu ataylab
  // shunday. Yopiq kurs saytda "Tez orada" bo'lib turadi, qiziqqan odam esa
  // shu forma orqali navbatga yoziladi — admin uchun bu talab o'lchagichi:
  // guruh qachon ochilishini shu ro'yxatga qarab hal qiladi. Faqat to'g'ridan
  // -to'g'ri yozilish (enrollments.service.ts) to'xtatiladi.
  assertFormatAllowed(course.format, input.format);

  // Bir odam bir kursga qayta-qayta so'rov yubormasin: hali ko'rib
  // chiqilmagan so'rovi bo'lsa yangisi yaratilmaydi (admin ro'yxati
  // bir xil murojaat nusxalari bilan to'lib ketmasligi uchun)
  if (userId) {
    const pending = await prisma.courseRequest.findFirst({
      where: { courseId: course.id, userId, status: { in: ['NEW', 'CONTACTED'] } },
      select: { id: true },
    });
    if (pending) {
      throw ApiError.conflict('Bu kurs bo‘yicha so‘rovingiz allaqachon ko‘rib chiqilmoqda', 'REQUEST_PENDING');
    }
  }

  const request = await prisma.courseRequest.create({
    data: { ...input, userId: userId ?? null },
    include: requestInclude,
  });

  await notifyAdmins({
    type: 'NEW_COURSE_REQUEST',
    title: `Kurs so'rovi: ${toUzText(course.title)}`,
    body: `${input.name} (${input.phone}) — ${input.format === 'OFFLINE' ? 'offline' : 'online'}${input.note ? `: ${excerpt(input.note, 100)}` : ''}`,
    link: '/admin/course-requests',
  });

  return resolveLocaleDeep(request, locale);
}

/** O'quvchining o'z so'rovlari — kabinetda holatini ko'rish uchun. */
export async function listMyCourseRequests(userId: string, locale: SupportedLocale) {
  const requests = await prisma.courseRequest.findMany({
    where: { userId },
    orderBy: { createdAt: 'desc' },
    take: 50,
    include: requestInclude,
  });
  return resolveLocaleDeep(requests, locale);
}

interface ListCourseRequestsFilters {
  status?: CourseRequestStatus;
  format?: CourseFormat;
  search?: string;
  page: number;
  limit: number;
}

export async function listCourseRequestsAdmin(filters: ListCourseRequestsFilters, locale: SupportedLocale) {
  const where: Prisma.CourseRequestWhereInput = {
    ...(filters.status ? { status: filters.status } : {}),
    ...(filters.format ? { format: filters.format } : {}),
    ...(filters.search
      ? {
        OR: [
          { name: { contains: filters.search, mode: 'insensitive' } },
          { phone: { contains: filters.search, mode: 'insensitive' } },
          { email: { contains: filters.search, mode: 'insensitive' } },
        ],
      }
      : {}),
  };

  const [items, total] = await Promise.all([
    prisma.courseRequest.findMany({
      where,
      // Yangi murojaatlar tepada: NEW < CONTACTED < ENROLLED < REJECTED
      orderBy: [{ status: 'asc' }, { createdAt: 'desc' }],
      skip: (filters.page - 1) * filters.limit,
      take: filters.limit,
      include: requestInclude,
    }),
    prisma.courseRequest.count({ where }),
  ]);

  return {
    items: resolveLocaleDeep(items, locale),
    pagination: { page: filters.page, limit: filters.limit, total, totalPages: Math.ceil(total / filters.limit) },
  };
}

export interface UpdateCourseRequestInput {
  status?: CourseRequestStatus;
  reply?: string | null;
}

export async function updateCourseRequestAdmin(
  id: string,
  input: UpdateCourseRequestInput,
  actor: Actor,
  locale: SupportedLocale,
) {
  const existing = await prisma.courseRequest.findUnique({
    where: { id },
    select: { id: true, userId: true, reply: true, course: { select: { title: true } } },
  });
  if (!existing) {
    throw ApiError.notFound('So‘rov topilmadi');
  }

  const hasNewReply = typeof input.reply === 'string' && input.reply.trim().length > 0;
  const request = await prisma.courseRequest.update({
    where: { id },
    data: {
      ...(input.status ? { status: input.status } : {}),
      ...(hasNewReply
        ? { reply: input.reply, repliedAt: new Date(), ...(input.status ? {} : { status: 'CONTACTED' as const }) }
        : {}),
    },
    include: requestInclude,
  });

  // Javob ro'yxatda qolib ketmasligi kerak: hisobi bor o'quvchiga u
  // administratsiya yozishmasiga xabar bo'lib tushadi va o'quvchi o'sha
  // yerda savolini davom ettira oladi. Mehmon (hisobsiz) so'rovida esa
  // javob faqat saqlanadi — admin telefon orqali bog'lanadi.
  if (hasNewReply && existing.userId) {
    await sendAdminMessageTo(
      existing.userId,
      actor,
      `${toUzText(existing.course.title)} — kurs so'rovingizga javob:\n\n${input.reply}`,
    );
  }

  return resolveLocaleDeep(request, locale);
}
