import { EngagementTarget, Prisma } from '@prisma/client';
import { prisma } from '../config/prisma';
import { SupportedLocale } from '../config/locale';
import { resolveLocaleDeep } from '../utils/localizedField';

/**
 * Admin monitoringi: "nima bo'lyapti" emas, "qay tomonga ketyapti".
 *
 * `/admin/stats` JAMI raqamlarni beradi (hammasi bo'lib nechta ko'rish) —
 * u qaysi kuni nima bo'lganini bilmaydi. Bu yerdagi barcha raqamlar esa
 * DAVRGA tegishli va oldingi shuncha kunlik davr bilan solishtiriladi:
 * "oxirgi 30 kunda 1200 ko'rish, avvalgi 30 kunga nisbatan +18%".
 *
 * Manba — `EngagementDaily` (kunlik yig'indi). Foydalanuvchi va yozilishlar
 * uchun alohida jadval kerak emas: ularda `createdAt`/`enrolledAt` bor,
 * shuning uchun kun bo'yicha guruhlash to'g'ridan-to'g'ri qilinadi.
 */

export type AnalyticsRange = 7 | 30 | 90;

export interface DayPoint {
  /** YYYY-MM-DD */
  day: string;
  views: number;
  likes: number;
  users: number;
  enrollments: number;
}

interface Totals {
  views: number;
  likes: number;
  users: number;
  enrollments: number;
}

export interface TopItem {
  id: string;
  type: EngagementTarget;
  title: string;
  slug: string | null;
  views: number;
  likes: number;
}

const DAY_MS = 24 * 60 * 60 * 1000;

/** Kun kaliti — `EngagementDaily.day` bilan bir xil (UTC yarim tuni) */
function dayKey(date: Date): string {
  return date.toISOString().slice(0, 10);
}

function startOfUtcDay(date: Date): Date {
  return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()));
}

interface RawDayCount {
  day: Date;
  count: number;
}

/**
 * Kun bo'yicha yozuvlar soni. XOM SQL ATAYIN: Prisma'ning `groupBy` si
 * DateTime ustunini ANIQ vaqt bo'yicha guruhlaydi (soat-minut-sekund bilan),
 * ya'ni deyarli har yozuv o'z guruhiga tushib qolardi. Kunga keltirish faqat
 * baza tomonida `::date` bilan bo'ladi.
 */
async function dailyCounts(table: 'User' | 'Enrollment', column: string, from: Date): Promise<Map<string, number>> {
  const rows = await prisma.$queryRaw<RawDayCount[]>`
    SELECT (${Prisma.raw(`"${table}"."${column}"`)} AT TIME ZONE 'UTC')::date AS day,
           COUNT(*)::int AS count
    FROM ${Prisma.raw(`"${table}"`)}
    WHERE ${Prisma.raw(`"${table}"."${column}"`)} >= ${from}
    GROUP BY 1
  `;
  return new Map(rows.map((r) => [dayKey(new Date(r.day)), r.count]));
}

/** Davr ichidagi ko'rish/yoqtirish yig'indisi */
async function engagementTotals(from: Date, to: Date): Promise<{ views: number; likes: number }> {
  const agg = await prisma.engagementDaily.aggregate({
    where: { day: { gte: from, lt: to } },
    _sum: { views: true, likes: true },
  });
  return { views: agg._sum.views ?? 0, likes: agg._sum.likes ?? 0 };
}

async function periodTotals(from: Date, to: Date): Promise<Totals> {
  const [engagement, users, enrollments] = await Promise.all([
    engagementTotals(from, to),
    prisma.user.count({ where: { createdAt: { gte: from, lt: to } } }),
    prisma.enrollment.count({ where: { enrolledAt: { gte: from, lt: to } } }),
  ]);
  return { ...engagement, users, enrollments };
}

/** Davr ichida eng ko'p ko'rilgan kontent — turi va sarlavhasi bilan */
async function topContent(from: Date, limit: number): Promise<TopItem[]> {
  const grouped = await prisma.engagementDaily.groupBy({
    by: ['contentType', 'contentId'],
    where: { day: { gte: from } },
    _sum: { views: true, likes: true },
    orderBy: { _sum: { views: 'desc' } },
    take: limit,
  });
  if (!grouped.length) return [];

  // Sarlavhalar tur bo'yicha bitta so'rovda olinadi — element boshiga
  // alohida so'rov yuborilsa ro'yxat o'nlab so'rovga aylanardi
  const idsByType = new Map<EngagementTarget, string[]>();
  for (const row of grouped) {
    idsByType.set(row.contentType, [...(idsByType.get(row.contentType) ?? []), row.contentId]);
  }

  const titles = new Map<string, { title: unknown; slug: string | null }>();
  const remember = (type: EngagementTarget, rows: { id: string; title: unknown; slug?: string }[]) => {
    for (const row of rows) titles.set(`${type}:${row.id}`, { title: row.title, slug: row.slug ?? null });
  };

  await Promise.all(
    [...idsByType.entries()].map(async ([type, ids]) => {
      switch (type) {
        case 'COURSE':
          return remember(type, await prisma.course.findMany({ where: { id: { in: ids } }, select: { id: true, title: true, slug: true } }));
        case 'BLOG_POST':
          return remember(type, await prisma.blogPost.findMany({ where: { id: { in: ids } }, select: { id: true, title: true, slug: true } }));
        case 'PROJECT':
          return remember(type, await prisma.project.findMany({ where: { id: { in: ids } }, select: { id: true, title: true } }));
        case 'TESTIMONIAL':
          // Sharhda sarlavha yo'q — muallif ismi shu o'rinni bosadi
          return remember(type, await prisma.testimonial.findMany({ where: { id: { in: ids } }, select: { id: true, name: true } })
            .then((rows) => rows.map((r) => ({ id: r.id, title: r.name }))));
      }
    })
  );

  return grouped
    // Kontent o'chirilgan bo'lsa (yetim yig'indi) ro'yxatda ko'rsatilmaydi
    .filter((row) => titles.has(`${row.contentType}:${row.contentId}`))
    .map((row) => {
      const found = titles.get(`${row.contentType}:${row.contentId}`)!;
      return {
        id: row.contentId,
        type: row.contentType,
        title: found.title as string,
        slug: found.slug,
        views: row._sum.views ?? 0,
        likes: row._sum.likes ?? 0,
      };
    });
}

/** Kontent turi bo'yicha taqsimot — qaysi bo'lim e'tiborni tortyapti */
async function byType(from: Date): Promise<{ type: EngagementTarget; views: number; likes: number }[]> {
  const grouped = await prisma.engagementDaily.groupBy({
    by: ['contentType'],
    where: { day: { gte: from } },
    _sum: { views: true, likes: true },
  });
  return grouped
    .map((row) => ({ type: row.contentType, views: row._sum.views ?? 0, likes: row._sum.likes ?? 0 }))
    .sort((a, b) => b.views - a.views);
}

export async function getAnalytics(days: number, locale: SupportedLocale) {
  const today = startOfUtcDay(new Date());
  // Oxirgi `days` kun — BUGUNNI ham qamrab oladi, shuning uchun boshlanish
  // nuqtasi `days - 1` kun oldin
  const from = new Date(today.getTime() - (days - 1) * DAY_MS);
  const tomorrow = new Date(today.getTime() + DAY_MS);
  const prevFrom = new Date(from.getTime() - days * DAY_MS);

  const [engagementRows, userDays, enrollmentDays, current, previous, top, types] = await Promise.all([
    prisma.engagementDaily.groupBy({
      by: ['day'],
      where: { day: { gte: from } },
      _sum: { views: true, likes: true },
    }),
    dailyCounts('User', 'createdAt', from),
    dailyCounts('Enrollment', 'enrolledAt', from),
    periodTotals(from, tomorrow),
    periodTotals(prevFrom, from),
    topContent(from, 8),
    byType(from),
  ]);

  const engagementByDay = new Map(
    engagementRows.map((row) => [dayKey(row.day), { views: row._sum.views ?? 0, likes: row._sum.likes ?? 0 }])
  );

  // Qatorda BO'SH kunlar ham bo'lishi shart: aks holda grafik hodisasiz
  // kunlarni siqib tashlab, o'sishni bor-yo'g'idan tikroq ko'rsatardi
  const series: DayPoint[] = [];
  for (let i = 0; i < days; i += 1) {
    const day = dayKey(new Date(from.getTime() + i * DAY_MS));
    const engagement = engagementByDay.get(day);
    series.push({
      day,
      views: engagement?.views ?? 0,
      likes: engagement?.likes ?? 0,
      users: userDays.get(day) ?? 0,
      enrollments: enrollmentDays.get(day) ?? 0,
    });
  }

  return {
    range: { days, from: dayKey(from), to: dayKey(today) },
    series,
    totals: current,
    previous,
    byType: types,
    topContent: resolveLocaleDeep(top, locale),
  };
}
