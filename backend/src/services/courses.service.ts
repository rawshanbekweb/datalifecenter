import { Prisma } from '@prisma/client';
import { prisma } from '../config/prisma';
import { SupportedLocale } from '../config/locale';
import { ApiError } from '../utils/ApiError';
import { isForeignKeyViolation } from '../utils/prismaErrors';
import { LocalizedString, resolveLocaleDeep, toJsonInput } from '../utils/localizedField';
import { slugify } from '../utils/slugify';
import { signVideoUrls } from './storage.service';
import { hasActiveSubscription } from './subscriptions.service';
import { getCourseSeats, getSeatsForCourses } from './courseSeats.service';
import { purgeEngagement } from './engagement.service';
import { flatMentors, mentorsBrief, mentorsFull, setCourseMentors } from '../utils/courseMentors';

interface ListCoursesFilters {
  level?: 'BEGINNER' | 'INTERMEDIATE' | 'ADVANCED';
  isFree?: 'true' | 'false';
  search?: string;
  page: number;
  limit: number;
}

export async function listCourses(filters: ListCoursesFilters, locale: SupportedLocale) {
  const where: Prisma.CourseWhereInput = {
    published: true,
    ...(filters.level ? { level: filters.level } : {}),
    ...(filters.isFree !== undefined ? { isFree: filters.isFree === 'true' } : {}),
    // Qidiruv faqat o'zbekcha matnga ishlaydi — ru/kaa/en kontenti bo'yicha
    // qidiruv hozircha qo'llab-quvvatlanmaydi (bilingan cheklov).
    ...(filters.search
      ? { title: { path: ['uz'], string_contains: filters.search, mode: 'insensitive' } }
      : {}),
  };

  const [items, total] = await Promise.all([
    prisma.course.findMany({
      where,
      orderBy: { createdAt: 'asc' },
      skip: (filters.page - 1) * filters.limit,
      take: filters.limit,
      include: {
        ...mentorsBrief,
        modules: { select: { id: true, title: true, order: true }, orderBy: { order: 'asc' } },
      },
    }),
    prisma.course.count({ where }),
  ]);

  // Joylar bitta paketli so'rovda — kurs boshiga alohida COUNT yuborilmaydi
  const seats = await getSeatsForCourses(items);

  return {
    items: resolveLocaleDeep(
      items.map((c) => ({ ...c, mentors: flatMentors(c.mentors), seats: seats.get(c.id) })),
      locale
    ),
    pagination: { page: filters.page, limit: filters.limit, total, totalPages: Math.ceil(total / filters.limit) },
  };
}

export async function getCourseBySlug(slug: string, locale: SupportedLocale) {
  const course = await prisma.course.findFirst({
    where: { slug, published: true },
    include: {
      ...mentorsFull,
      modules: {
        orderBy: { order: 'asc' },
        include: {
          lessons: {
            orderBy: { order: 'asc' },
            /**
             * `content` ATAYIN ro'yxatda yo'q.
             *
             * Quyida ko'rinadiki, matn javobga faqat bepul ko'rish uchun ochiq
             * darslarda tushadi — qolganlariniki baribir `null`ga aylanardi.
             * Ilgari esa kursdagi HAMMA darsning to'rt tilli matni bazadan
             * tortilib, tarmoqdan o'tkazilib, keyin tashlab yuborilardi.
             *
             * Bu shunchaki ortiqcha yuk emas: ochiq kurs sahifasi javobi
             * publicCache'da saqlanadi, u yerda esa 512 KB chegara bor. Matni
             * boy uzun kurs o'sha chegaradan oshib ketsa, sahifa umuman
             * keshlanmay qolardi — ya'ni eng og'ir kurs eng ko'p DB so'rovini
             * keltirib chiqarardi.
             */
            select: {
              id: true, moduleId: true, title: true, order: true,
              contentType: true, videoUrl: true, durationMinutes: true, isFreePreview: true,
            },
          },
        },
      },
    },
  });

  if (!course) {
    throw ApiError.notFound('Kurs topilmadi');
  }

  const [signed, previewContent, seats] = await Promise.all([
    // Faqat bepul ko'rish uchun ochiq darslar imzolanadi; qolganlariga null
    // beriladi, shuning uchun imzolash ro'yxatiga ham kirmaydi.
    signVideoUrlMap(course.modules, (lesson) => (lesson.isFreePreview ? lesson.videoUrl : null)),
    // Matn — faqat ochiq darslar uchun, tor alohida so'rovda
    prisma.lesson
      .findMany({
        where: { module: { courseId: course.id }, isFreePreview: true },
        select: { id: true, content: true },
      })
      .then((rows) => new Map(rows.map((l) => [l.id, l.content]))),
    // Ilgari joylar imzolashdan KEYIN, ketma-ket so'ralardi
    getCourseSeats(course),
  ]);

  return resolveLocaleDeep(
    {
      ...course,
      mentors: flatMentors(course.mentors),
      seats,
      modules: course.modules.map((mod) => ({
        ...mod,
        lessons: mod.lessons.map((lesson) => ({
          ...lesson,
          videoUrl: signed.get(lesson.id) ?? null,
          content: previewContent.get(lesson.id) ?? null,
        })),
      })),
    },
    locale
  );
}

/**
 * Kursdagi barcha dars videolarini BITTA to'plamda imzolaydi va lesson.id → havola
 * jadvalini qaytaradi. Supabase imzolash tarmoq so'rovi bo'lgani uchun darslar
 * bittalab imzolanmasligi kerak (30 darsli kursda 30 so'rov bo'lardi).
 */
async function signVideoUrlMap<L extends { id: string; videoUrl: string | null }>(
  modules: { lessons: L[] }[],
  pick: (lesson: L) => string | null
): Promise<Map<string, string | null>> {
  const lessons = modules.flatMap((mod) => mod.lessons);
  const signed = await signVideoUrls(lessons.map(pick));
  return new Map(lessons.map((lesson, i) => [lesson.id, signed[i]]));
}

export async function listCoursesAdmin() {
  const courses = await prisma.course.findMany({
    orderBy: { createdAt: 'desc' },
    include: mentorsBrief,
  });
  return courses.map((c) => ({ ...c, mentors: flatMentors(c.mentors) }));
}

export async function getCourseByIdAdmin(id: string) {
  const course = await prisma.course.findUnique({
    where: { id },
    include: {
      ...mentorsBrief,
      modules: {
        orderBy: { order: 'asc' },
        include: { lessons: { orderBy: { order: 'asc' } } },
      },
    },
  });
  if (!course) {
    throw ApiError.notFound('Kurs topilmadi');
  }
  return { ...course, mentors: flatMentors(course.mentors) };
}

/**
 * Saqlashdan keyin qaytariladigan shakl: kurs maydonlari + mentorlar.
 *
 * `getCourseByIdAdmin` emas — u butun dasturni (modullar va darslar bilan)
 * ham o'qiydi, kurs sozlamalarini saqlashda esa u umuman kerak emas.
 */
async function getCourseWithMentors(id: string) {
  const course = await prisma.course.findUniqueOrThrow({ where: { id }, include: mentorsBrief });
  return { ...course, mentors: flatMentors(course.mentors) };
}

export async function getCourseForLearning(slug: string, userId: string, role: string, locale: SupportedLocale) {
  const course = await prisma.course.findFirst({
    where: { slug, published: true },
    include: {
      ...mentorsFull,
      modules: {
        orderBy: { order: 'asc' },
        include: { lessons: { orderBy: { order: 'asc' } } },
      },
    },
  });

  if (!course) {
    throw ApiError.notFound('Kurs topilmadi');
  }

  /**
   * Obuna holati bitta so'rov davomida o'zgarmaydi — bir marta o'qib qo'yamiz.
   *
   * Quyida ikkita shoxobcha shu javobga muhtoj va OBUNACHI yangi nashr
   * qilingan kursni ochganda IKKALASI ham ishga tushadi: birinchisi kirish
   * beradi, ikkinchisi o'sha yaratilgan yozuvni tekshiradi. Ilgari bu ikkita
   * bir xil so'rov demak edi.
   */
  let subscriptionActive: boolean | null = null;
  const isSubscriptionActive = async (): Promise<boolean> => {
    if (subscriptionActive === null) subscriptionActive = await hasActiveSubscription(userId);
    return subscriptionActive;
  };

  let enrollment = null;
  if (role !== 'ADMIN') {
    enrollment = await prisma.enrollment.findUnique({
      where: { userId_courseId: { userId, courseId: course.id } },
    });

    // Enrollment yo'q, lekin foydalanuvchining faol obunasi bo'lsa — shu kursga ham
    // avtomatik (lazy) kirish beriladi. Obuna faollashganda barcha NASHR qilingan
    // kurslarga bir yo'la provisioning qilinadi (subscriptions.service.ts); bu shoxobcha
    // faqat obunadan KEYIN nashr qilingan kurslar uchun.
    // Onlayn yozilishi yopiq kursga obuna orqali ham avtomatik kirish
    // berilmaydi (obuna — onlayn kirish, offline bayroqqa bog'liq emas;
    // subscriptions.service.ts dagi provisioning bilan bir xil qoida).
    if (!enrollment && course.onlineEnrollmentOpen && (await isSubscriptionActive())) {
      enrollment = await prisma.enrollment.create({
        data: { userId, courseId: course.id, status: 'ACTIVE', paymentStatus: 'FREE', provider: 'subscription' },
      });
    }

    if (!enrollment) {
      throw ApiError.forbidden("Siz bu kursga yozilmagansiz", 'NOT_ENROLLED');
    }
    if (enrollment.status === 'PENDING') {
      throw ApiError.forbidden("Yozilishingiz hali tasdiqlanmagan — to'lov kutilmoqda", 'ENROLLMENT_PENDING');
    }
    if (enrollment.status === 'CANCELLED') {
      throw ApiError.forbidden('Yozilishingiz bekor qilingan', 'ENROLLMENT_CANCELLED');
    }
    // Obuna orqali berilgan (hali "yakunlanmagan") kirish — obuna muddati tugagan bo'lsa
    // yopiladi. Tugatilgan kurslar doim ochiq qoladi (allaqachon topshirilgan narsa
    // qaytarib olinmaydi).
    if (enrollment.provider === 'subscription' && enrollment.status !== 'COMPLETED' && !(await isSubscriptionActive())) {
      throw ApiError.forbidden('Obuna muddati tugagan — davom etish uchun yangilang', 'SUBSCRIPTION_EXPIRED');
    }
  }

  // Videolarni imzolash TARMOQ so'rovi (Supabase), progress esa bazadan —
  // ular bir-biriga bog'liq emas, shuning uchun ketma-ket emas, parallel
  const [progress, signed] = await Promise.all([
    prisma.lessonProgress.findMany({
      where: { userId, lesson: { module: { courseId: course.id } } },
      select: { lessonId: true },
    }),
    signVideoUrlMap(course.modules, (lesson) => lesson.videoUrl),
  ]);

  const signedCourse = resolveLocaleDeep(
    {
      ...course,
      mentors: flatMentors(course.mentors),
      modules: course.modules.map((mod) => ({
        ...mod,
        lessons: mod.lessons.map((lesson) => ({ ...lesson, videoUrl: signed.get(lesson.id) ?? null })),
      })),
    },
    locale
  );

  return { course: signedCourse, enrollment, completedLessonIds: progress.map((p) => p.lessonId) };
}

async function uniqueSlug(title: string, excludeId?: string): Promise<string> {
  const base = slugify(title);
  let candidate = base;
  let suffix = 1;
  while (true) {
    const existing = await prisma.course.findUnique({ where: { slug: candidate } });
    if (!existing || existing.id === excludeId) return candidate;
    suffix += 1;
    candidate = `${base}-${suffix}`;
  }
}

interface CourseInput {
  title: LocalizedString;
  subtitle?: LocalizedString | null;
  description: LocalizedString;
  iconKey: string;
  color: string;
  bg: string;
  border: string;
  /** Onlayn o'qish narxi. Offline narxi alohida — schema.prisma izohiga qarang */
  price: number;
  offlinePrice?: number | null;
  currency: string;
  durationMonths: number;
  level: 'BEGINNER' | 'INTERMEDIATE' | 'ADVANCED';
  format: 'ONLINE' | 'OFFLINE' | 'HYBRID';
  location?: LocalizedString | null;
  tags: string[];
  published: boolean;
  /** Onlayn/offline qabul ochiqmi — kurs ko'rinishidan alohida (schema.prisma izohiga qarang) */
  onlineEnrollmentOpen: boolean;
  offlineEnrollmentOpen: boolean;
  /** Guruhdagi joylar soni; null = cheklov yo'q (courseSeats.service.ts) */
  onlineSeats?: number | null;
  offlineSeats?: number | null;
  /** Kursni olib boradigan mentorlar — birinchisi asosiy (utils/courseMentors.ts) */
  mentorIds?: string[];
}

export async function createCourse(input: CourseInput) {
  const { mentorIds, ...fields } = input;
  const slug = await uniqueSlug(input.title.uz);
  const course = await prisma.course.create({
    data: {
      ...fields,
      slug,
      isFree: input.price <= 0,
      subtitle: toJsonInput(input.subtitle),
      location: toJsonInput(input.location),
    } as Prisma.CourseUncheckedCreateInput,
  });

  if (mentorIds?.length) {
    await setCourseMentors(course.id, mentorIds);
  }
  return getCourseWithMentors(course.id);
}

export async function updateCourse(id: string, input: Partial<CourseInput>) {
  const { mentorIds, ...fields } = input;
  const course = await prisma.course.findUnique({ where: { id } });
  if (!course) {
    throw ApiError.notFound('Kurs topilmadi');
  }

  const currentTitle = course.title as unknown as LocalizedString;
  const slug = input.title && input.title.uz !== currentTitle.uz ? await uniqueSlug(input.title.uz, id) : undefined;
  const isFree = input.price !== undefined ? input.price <= 0 : undefined;

  await prisma.course.update({
    where: { id },
    data: {
      ...fields,
      subtitle: toJsonInput(input.subtitle),
      location: toJsonInput(input.location),
      ...(slug ? { slug } : {}),
      ...(isFree !== undefined ? { isFree } : {}),
    } as Prisma.CourseUncheckedUpdateInput,
  });

  // Maydon yuborilmagan bo'lsa mentorlar tegilmaydi (qisman yangilash)
  if (mentorIds !== undefined) {
    await setCourseMentors(id, mentorIds);
  }
  return getCourseWithMentors(id);
}

export async function deleteCourse(id: string) {
  const course = await prisma.course.findUnique({ where: { id } });
  if (!course) {
    throw ApiError.notFound('Kurs topilmadi');
  }
  try {
    await prisma.course.delete({ where: { id } });
  } catch (err) {
    if (isForeignKeyViolation(err)) {
      throw ApiError.conflict("Bu kursga talabalar yozilgan, avval ularni olib tashlang", 'COURSE_HAS_ENROLLMENTS');
    }
    throw err;
  }
  // ContentLike/ContentView polimorf — foreign key yo'q, qo'lda tozalanadi
  await purgeEngagement('COURSE', id);
}
