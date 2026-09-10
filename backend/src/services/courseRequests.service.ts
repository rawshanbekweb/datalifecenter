import { CourseFormat, CourseRequestStatus, Prisma } from '@prisma/client';
import { prisma } from '../config/prisma';
import { env } from '../config/env';
import { SupportedLocale } from '../config/locale';
import { ApiError } from '../utils/ApiError';
import { Actor } from '../utils/mentorAccess';
import { resolveLocaleDeep, toUzText } from '../utils/localizedField';
import { excerpt, notify, notifyAdmins } from './notifications.service';
import { sendAdminMessageTo } from './messages.service';
import { sendCourseEnrolledEmail } from './email.service';
import { assertGroupFits, groupScheduleText } from './courseGroups.service';
import { addEnrollmentPayment, enrollmentDebt, recalcEnrollmentPayment } from './enrollmentPayments.service';
import { assertSeatAvailable, seatFormatFor } from './courseSeats.service';

/**
 * Kursga qiziqqan odamning administratsiyaga murojaati.
 *
 * NEGA ENROLLMENT EMAS: offline guruhga o'quvchi o'zi yozilib qo'ya olmaydi —
 * joy, jadval va to'lov admin bilan kelishiladi. Agar bu Enrollment orqali
 * qilinsa, to'lanmagan, hatto hali gaplashilmagan yozilishlar kurs
 * statistikasi, progress va sertifikat tizimiga aralashib ketardi.
 *
 * KIM YUBORA OLADI (2026-08-14 dan): faqat ro'yxatdan o'tgan va emaili
 * TASDIQLANGAN foydalanuvchi. Avval mehmon ham yubora olardi, lekin
 * o'quvchini guruhga rasman yozish uchun hisob kerak — status, guruh va
 * yozishma o'sha hisobga bog'lanadi. Tasdiqlanmagan email esa amalda
 * aloqa kanali emas: kurs boshlanishi va to'lov haqidagi xabarlar
 * hech qayerga bormaydi.
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
  userId: string,
  locale: SupportedLocale,
) {
  // Email tasdiqlanmagan bo'lsa so'rov qabul qilinmaydi — aks holda o'quvchi
  // ro'yxatga tushadi, lekin unga birorta ham xabar yetib bormaydi
  const account = await prisma.user.findUnique({
    where: { id: userId },
    select: { emailVerifiedAt: true },
  });
  if (!account) {
    throw ApiError.notFound('Foydalanuvchi topilmadi');
  }
  if (!account.emailVerifiedAt) {
    throw ApiError.forbidden(
      "So'rov yuborish uchun avval emailingizni tasdiqlang",
      'EMAIL_NOT_VERIFIED'
    );
  }

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
  const pending = await prisma.courseRequest.findFirst({
    where: { courseId: course.id, userId, status: { in: ['NEW', 'CONTACTED'] } },
    select: { id: true },
  });
  if (pending) {
    throw ApiError.conflict('Bu kurs bo‘yicha so‘rovingiz allaqachon ko‘rib chiqilmoqda', 'REQUEST_PENDING');
  }

  const request = await prisma.courseRequest.create({
    data: { ...input, userId },
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

const STATUS_LABEL: Record<CourseRequestStatus, string> = {
  NEW: 'Yangi',
  CONTACTED: "Bog'lanildi",
  ENROLLED: "Ro'yxatga olindi",
  REJECTED: 'Rad etildi',
};
const FORMAT_LABEL: Record<CourseFormat, string> = {
  ONLINE: 'Onlayn',
  OFFLINE: 'Offline',
  HYBRID: 'Gibrid',
};

// Excel/Google Sheets vergul, tirnoq yoki yangi qatorni ko'rsa maydonni
// tirnoqqa oladi — aks holda ular ustunlarni siljitib yuboradi.
function csvCell(value: string | null | undefined): string {
  const text = (value ?? '').toString();
  if (/[",\n\r]/.test(text)) {
    return `"${text.replace(/"/g, '""')}"`;
  }
  return text;
}

interface ExportCourseRequestsFilters {
  status?: CourseRequestStatus;
  format?: CourseFormat;
  search?: string;
}

/**
 * Kursga yozilish so'rovlarini CSV (Excel'da to'g'ridan-to'g'ri ochiladi)
 * ko'rinishida qaytaradi. Sahifalash yo'q — joriy filtrga mos HAMMASI.
 */
export async function exportCourseRequestsCsv(filters: ExportCourseRequestsFilters): Promise<string> {
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

  const items = await prisma.courseRequest.findMany({
    where,
    orderBy: [{ status: 'asc' }, { createdAt: 'desc' }],
    include: requestInclude,
  });

  const header = ['Sana', 'Ism', 'Telefon', 'Email', 'Kurs', 'Format', 'Holat', 'Izoh', 'Javob', 'Hisob'];
  const rows = items.map((r) => [
    r.createdAt.toISOString().slice(0, 16).replace('T', ' '),
    r.name,
    r.phone,
    r.email ?? '',
    toUzText(r.course.title),
    FORMAT_LABEL[r.format],
    STATUS_LABEL[r.status],
    r.note ?? '',
    r.reply ?? '',
    r.userId ? 'Ro‘yxatdan o‘tgan' : 'Mehmon',
  ]);

  // BOM: Excel qatorni UTF-8 deb tanimasa, qoraqalpoqcha/o'zbekcha harflar
  // buzilib ko'rinadi
  const BOM = '﻿';
  return BOM + [header, ...rows].map((row) => row.map(csvCell).join(',')).join('\r\n');
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

/**
 * Admin so'rovni tasdiqlab, o'quvchini kursga QO'SHADI — "yozilish admin
 * orqali" oqimining oxirgi bo'g'ini.
 *
 * IKKALA FORMATDA HAM Enrollment yaratiladi (ACTIVE). Ilgari offline
 * tasdiqlash faqat so'rov holatini o'zgartirardi va o'quvchi shu yerda
 * "yo'qolib" qolardi — sabablari schema.prisma dagi Enrollment izohida.
 * Farq endi bitta ustunda: `format`.
 *
 * TO'LOV: yozilishga KELISHILGAN summa (`priceAgreed`) yoziladi — offline
 * uchun Course.offlinePrice'dan, markazda o'qish qimmatroq. Pulning o'zi
 * to'lov daftariga tushadi (enrollmentPayments.service.ts):
 *   - `paidAmount` berilmasa — kelishilgan summa to'liq to'langan deb
 *     yoziladi (markazda odatda shunday va bu eski xatti-harakat);
 *   - `paidAmount` berilsa — o'sha summa oldindan to'lov bo'lib tushadi va
 *     yozilish PARTIAL holatida qoladi, qarzi qarzdorlar ro'yxatida ko'rinadi.
 * Bepul kursda pul yozilmaydi (FREE).
 *
 * Idempotent: allaqachon ENROLLED so'rov qayta ishlanmaydi, aks holda
 * joylar har bosishda qaytadan sanalardi.
 */
export interface EnrollFromRequestOptions {
  groupId?: string | null;
  /** Oldindan to'lov; berilmasa kelishilgan summa to'liq to'langan deb hisoblanadi */
  paidAmount?: number | string | null;
}

export async function enrollFromRequest(
  id: string,
  options: EnrollFromRequestOptions,
  locale: SupportedLocale,
) {
  const groupId = options.groupId ?? null;
  const request = await prisma.courseRequest.findUnique({
    where: { id },
    include: {
      course: {
        select: {
          id: true, title: true, slug: true, format: true, location: true, currency: true,
          isFree: true, price: true, offlinePrice: true, onlineSeats: true, offlineSeats: true,
        },
      },
      user: { select: { name: true, email: true } },
    },
  });
  if (!request) {
    throw ApiError.notFound('So‘rov topilmadi');
  }
  if (request.status === 'ENROLLED') {
    const current = await prisma.courseRequest.findUniqueOrThrow({ where: { id }, include: requestInclude });
    return resolveLocaleDeep(current, locale);
  }
  // Mehmon so'rovida biriktiriladigan hisob yo'q — admin avval o'quvchini
  // ro'yxatdan o'tkazishi kerak (telefon orqali bog'lanib).
  if (!request.userId || !request.user) {
    throw ApiError.badRequest(
      'Bu so‘rov hisobsiz yuborilgan — avval o‘quvchi ro‘yxatdan o‘tishi kerak',
      'REQUEST_HAS_NO_ACCOUNT'
    );
  }

  const format = seatFormatFor(request.course.format, request.format);
  const existing = await prisma.enrollment.findUnique({
    where: { userId_courseId: { userId: request.userId, courseId: request.courseId } },
    select: { id: true, status: true, format: true, paymentStatus: true, groupId: true },
  });

  // Mavjud yozilish AYNI SHU formatda joyni allaqachon band qilgan bo'lsa
  // qayta tekshirilmaydi. Qolgan hamma holatda (yangi yozilish, bekor
  // qilinganini tiklash, onlayndan offline guruhga o'tish) joy kerak.
  const holdsSeat = existing !== null
    && existing.format === format
    && (existing.status === 'PENDING' || existing.status === 'ACTIVE');
  if (!holdsSeat) {
    await assertSeatAvailable(request.course, format);
  }

  // Guruh tanlangan bo'lsa u kursga, formatga va sig'imga mos kelishi kerak.
  // Tanlanmasa o'quvchi guruhsiz qabul qilinadi — admin keyin guruhga
  // taqsimlaydi (onlayn o'quvchi ko'pincha guruhsiz qolaveradi).
  if (groupId) {
    await assertGroupFits(groupId, {
      id: existing?.id ?? '',
      courseId: request.courseId,
      format,
      groupId: existing?.groupId ?? null,
    });
  }

  // Kelishilgan summa — offline uchun markazdagi narx (odatda qimmatroq).
  // Allaqachon to'liq to'lagan yozilishning kelishuviga tegilmaydi.
  const agreed = request.course.isFree
    ? null
    : (format === 'OFFLINE' ? request.course.offlinePrice ?? request.course.price : request.course.price);
  const terms = {
    provider: 'admin',
    providerRef: `request_${request.id}`,
    ...(existing?.paymentStatus === 'PAID' ? {} : { priceAgreed: agreed }),
  };

  // Yozilish va so'rov holati BITTA tranzaksiyada: orada uzilish bo'lsa
  // o'quvchi kursga qo'shilib, so'rov esa "yangi" bo'lib qolib ketardi.
  const writes: Prisma.PrismaPromise<unknown>[] = [];
  if (!existing) {
    writes.push(
      prisma.enrollment.create({
        data: { userId: request.userId, courseId: request.courseId, format, groupId, status: 'ACTIVE', ...terms },
      }),
      prisma.course.update({ where: { id: request.courseId }, data: { studentsCount: { increment: 1 } } }),
    );
  } else if (existing.status !== 'COMPLETED') {
    // Kursni tamomlaganga tegilmaydi — ACTIVE'ga qaytarish sertifikatni
    // olib qo'yardi. Boshqa holatlarda yozilish faollashtiriladi va format
    // yangilanadi (o'quvchi boshqa guruhga o'tgan bo'lishi mumkin).
    writes.push(
      prisma.enrollment.update({
        where: { id: existing.id },
        data: {
          status: 'ACTIVE',
          format,
          // Guruh faqat yangisi tanlanganda almashadi — bo'sh yuborilsa
          // o'quvchi hozirgi guruhida qoladi
          ...(groupId ? { groupId } : {}),
          ...terms,
        },
      }),
    );
  }
  writes.push(prisma.courseRequest.update({ where: { id }, data: { status: 'ENROLLED' } }));
  await prisma.$transaction(writes);

  // Pul daftarga alohida tushadi. Yoziladigan summa QARZdan oshmaydi:
  // shu tufayli allaqachon to'lagan o'quvchiga (ikkinchi so'rov tasdiqlansa)
  // pul ikkinchi marta qo'shilmaydi.
  const enrollment = await prisma.enrollment.findUniqueOrThrow({
    where: { userId_courseId: { userId: request.userId, courseId: request.courseId } },
    select: { id: true },
  });
  const debt = await enrollmentDebt(enrollment.id);
  const requested = options.paidAmount === undefined || options.paidAmount === null
    ? debt
    : new Prisma.Decimal(options.paidAmount);
  const toRecord = Prisma.Decimal.min(requested, debt);
  if (toRecord.greaterThan(0)) {
    await addEnrollmentPayment(
      enrollment.id,
      { amount: toRecord.toString(), method: 'CASH', note: `request_${request.id}` },
      null,
      locale,
      // Quyida qabul haqidagi to'liq xabar va email yuboriladi
      { notifyStudent: false },
    );
  } else {
    await recalcEnrollmentPayment(enrollment.id);
  }

  const updated = await prisma.courseRequest.findUniqueOrThrow({ where: { id }, include: requestInclude });

  // Guruh tanlangan bo'lsa jadval xabarning eng qimmatli qismi bo'ladi:
  // "qachon va qayerda kelaman" degan savolga javob shu qatorda
  const group = groupId
    ? await prisma.courseGroup.findUnique({
      where: { id: groupId },
      select: { name: true, startsAt: true, weekdays: true, startTime: true, room: true },
    })
    : null;
  const schedule = group ? groupScheduleText(group) : null;

  // Qarz qolgan bo'lsa o'quvchi buni birinchi kundan bilib tursin —
  // keyin "menga aytilmagan edi" degan gap chiqmasin
  const remaining = await enrollmentDebt(enrollment.id);
  const debtLine = remaining.greaterThan(0)
    ? `\nQolgan to'lov: ${remaining.toString()} ${request.course.currency}`
    : '';

  const baseBody = format === 'ONLINE'
    ? 'Kurs kabinetingizda ochildi — darslarni boshlashingiz mumkin.'
    : 'Offline guruhga yozildingiz. Kurs materiallari kabinetingizda ochiq.';
  await notify(request.userId, {
    type: 'ENROLLMENT_ACTIVATED',
    title: `Kursga qabul qilindingiz: ${toUzText(request.course.title)}`,
    body: `${baseBody}${schedule ? `\nGuruhingiz: ${schedule}` : ''}${debtLine}`,
    link: `/learn/${request.course.slug}`,
  });

  // Bildirishnoma faqat saytga kirgan odamga ko'rinadi — so'rov yuborib
  // javob kutayotgan o'quvchi esa aynan saytdan tashqarida bo'ladi.
  await sendCourseEnrolledEmail({
    to: request.user.email,
    name: request.user.name,
    courseTitle: toUzText(request.course.title),
    format,
    courseUrl: `${env.FRONTEND_URL.replace(/\/+$/, '')}/learn/${request.course.slug}`,
    location: format === 'OFFLINE' ? toUzText(request.course.location) || null : null,
    schedule,
  });

  return resolveLocaleDeep(updated, locale);
}

export async function deleteCourseRequest(id: string): Promise<void> {
  const request = await prisma.courseRequest.findUnique({ where: { id } });
  if (!request) {
    throw ApiError.notFound("So'rov topilmadi");
  }
  await prisma.courseRequest.delete({ where: { id } });
}

/**
 * Ommaviy o'chirish — qoidalari shared/bulkDelete.validator.ts da.
 * Qaytadi: haqiqatda o'chirilgan yozuvlar soni (boshqa admin allaqachon
 * o'chirgan bo'lsa so'ralganidan kam bo'lishi mumkin).
 */
export async function deleteCourseRequests(ids: string[]): Promise<number> {
  const { count } = await prisma.courseRequest.deleteMany({ where: { id: { in: ids } } });
  return count;
}
