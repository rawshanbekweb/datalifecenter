import { EngagementTarget, Prisma } from '@prisma/client';
import { prisma } from '../config/prisma';
import { ApiError } from '../utils/ApiError';

/**
 * Yoqtirish (like) va ko'rishlar (views) hisoblagichlari — barcha kontent
 * turlari uchun bitta joyda.
 *
 * Uchta ongli qaror:
 *
 * 1. **Polimorf `ContentLike`** — har tur uchun alohida jadval o'rniga bitta
 *    jadval (`contentType` + `contentId`). Foreign key yo'q, shuning uchun
 *    kontent o'chirilganda `purgeEngagement()` chaqirilishi SHART.
 *
 * 2. **Denormallashtirilgan hisoblagich** — `likesCount`/`views` har bir
 *    kontent jadvalida saqlanadi. Ro'yxat endpointlari (bosh sahifa, blog)
 *    yuklama ostida har element uchun `COUNT(*)` qilishga chidamaydi; bu
 *    raqamlar allaqachon keshlanadigan javoblarning bir qismi bo'lib keladi.
 *
 * 3. **Qurilma bo'yicha (login talab qilinmaydi)** — `deviceId` httpOnly
 *    cookie'da. Mehmon ham yoqtira olishi kerak. Cookie tozalansa qayta
 *    yoqtirish mumkin: bu ongli murosa, qat'iy noyoblik login talab qilardi.
 */

// Ko'rishlar faqat "ochiladigan" kontentda mantiqli — sharh (testimonial)
// alohida sahifaga ega emas, uni "ko'rish" tushunchasi yo'q.
const VIEWABLE: EngagementTarget[] = ['BLOG_POST', 'PROJECT', 'COURSE'];

export function isViewable(target: EngagementTarget): boolean {
  return VIEWABLE.includes(target);
}

interface Counters {
  likesCount: number;
  views: number | null;
}

/**
 * Kontent mavjud va OMMAVIY (published) ekanini tekshiradi.
 * Nashr qilinmagan qoralamani yoqtirib bo'lmasligi kerak.
 */
async function assertPublished(target: EngagementTarget, id: string): Promise<void> {
  const found = await (async () => {
    switch (target) {
      case 'BLOG_POST': return prisma.blogPost.findFirst({ where: { id, published: true }, select: { id: true } });
      case 'PROJECT': return prisma.project.findFirst({ where: { id, published: true }, select: { id: true } });
      case 'COURSE': return prisma.course.findFirst({ where: { id, published: true }, select: { id: true } });
      case 'TESTIMONIAL': return prisma.testimonial.findFirst({ where: { id, published: true }, select: { id: true } });
    }
  })();

  if (!found) throw ApiError.notFound('Bunday kontent topilmadi', 'CONTENT_NOT_FOUND');
}

/** Hisoblagichni delta'ga o'zgartiradi va yangi qiymatni qaytaradi. */
async function bumpCounter(
  tx: Prisma.TransactionClient,
  target: EngagementTarget,
  id: string,
  field: 'likesCount' | 'views',
  delta: number,
): Promise<Counters> {
  const data = { [field]: { increment: delta } };
  switch (target) {
    case 'BLOG_POST': {
      const row = await tx.blogPost.update({ where: { id }, data, select: { likesCount: true, views: true } });
      return row;
    }
    case 'PROJECT': {
      const row = await tx.project.update({ where: { id }, data, select: { likesCount: true, views: true } });
      return row;
    }
    case 'COURSE': {
      const row = await tx.course.update({ where: { id }, data, select: { likesCount: true, views: true } });
      return row;
    }
    case 'TESTIMONIAL': {
      // Sharhda `views` ustuni yo'q — shuning uchun null qaytadi
      const row = await tx.testimonial.update({ where: { id }, data, select: { likesCount: true } });
      return { likesCount: row.likesCount, views: null };
    }
  }
}

export interface LikeResult {
  liked: boolean;
  likesCount: number;
}

/**
 * Yoqtirishni almashtiradi: qo'yilmagan bo'lsa qo'yadi, qo'yilgan bo'lsa oladi.
 *
 * Yozuv yaratish/o'chirish va hisoblagichni o'zgartirish BITTA tranzaksiyada —
 * aks holda parallel bosishlarda hisoblagich haqiqiy yozuvlar sonidan
 * ajralib ketardi.
 */
export async function toggleLike(
  target: EngagementTarget,
  contentId: string,
  deviceId: string,
): Promise<LikeResult> {
  await assertPublished(target, contentId);

  return prisma.$transaction(async (tx) => {
    const existing = await tx.contentLike.findUnique({
      where: { contentType_contentId_deviceId: { contentType: target, contentId, deviceId } },
      select: { id: true },
    });

    if (existing) {
      await tx.contentLike.delete({ where: { id: existing.id } });
      const { likesCount } = await bumpCounter(tx, target, contentId, 'likesCount', -1);
      return { liked: false, likesCount };
    }

    await tx.contentLike.create({ data: { contentType: target, contentId, deviceId } });
    const { likesCount } = await bumpCounter(tx, target, contentId, 'likesCount', 1);
    return { liked: true, likesCount };
  });
}

// Bitta qurilmaning ko'rishi shu muddatdan keyin qayta hisoblanadi
const VIEW_DEDUP_MS = 24 * 60 * 60 * 1000;

export interface ViewResult {
  views: number;
  /** Hisoblagich haqiqatan oshdimi (dublikat bo'lsa false) */
  counted: boolean;
}

/**
 * Ko'rishni hisoblaydi — bitta qurilma uchun 24 soatda bir marta.
 *
 * Dublikat tekshiruvi bazada (`ContentView`), cookie'da EMAS: krossdomen
 * cookie Safari'da bloklanadi va o'sha brauzerlarda har yangilash ko'rishni
 * oshirib yuborardi.
 */
export async function registerView(
  target: EngagementTarget,
  contentId: string,
  deviceId: string,
): Promise<ViewResult> {
  if (!isViewable(target)) {
    throw ApiError.badRequest("Bu kontent turida ko'rishlar hisoblanmaydi", 'VIEWS_NOT_SUPPORTED');
  }
  await assertPublished(target, contentId);

  const key = { contentType_contentId_deviceId: { contentType: target, contentId, deviceId } };
  const seen = await prisma.contentView.findUnique({ where: key, select: { viewedAt: true } });

  if (seen && Date.now() - seen.viewedAt.getTime() < VIEW_DEDUP_MS) {
    const current = await currentViews(target, contentId);
    return { views: current, counted: false };
  }

  const { views } = await prisma.$transaction(async (tx) => {
    // upsert: birinchi ko'rish — yangi yozuv, 24 soatdan keyingisi — vaqtni yangilash
    await tx.contentView.upsert({
      where: key,
      create: { contentType: target, contentId, deviceId },
      update: { viewedAt: new Date() },
    });
    return bumpCounter(tx, target, contentId, 'views', 1);
  });

  return { views: views ?? 0, counted: true };
}

/** Dublikat ko'rishda hozirgi hisobni qaytarish uchun. */
async function currentViews(target: EngagementTarget, contentId: string): Promise<number> {
  switch (target) {
    case 'BLOG_POST': return (await prisma.blogPost.findUnique({ where: { id: contentId }, select: { views: true } }))?.views ?? 0;
    case 'PROJECT': return (await prisma.project.findUnique({ where: { id: contentId }, select: { views: true } }))?.views ?? 0;
    case 'COURSE': return (await prisma.course.findUnique({ where: { id: contentId }, select: { views: true } }))?.views ?? 0;
    case 'TESTIMONIAL': return 0;
  }
}

export interface EngagementStats {
  contentId: string;
  likesCount: number;
  views: number | null;
  /** Shu qurilma yoqtirganmi — yurakni to'ldirilgan holda ko'rsatish uchun */
  liked: boolean;
}

/**
 * Bir nechta element uchun hisoblagichlarni va shu qurilmaning yoqtirish
 * holatini bitta so'rovda qaytaradi.
 *
 * Ro'yxat sahifalari (blog, loyihalar) uchun ATAYIN paketli: har karta uchun
 * alohida so'rov yuborilsa bitta sahifa ochilishi o'nlab so'rovga aylanardi.
 */
export async function getStats(
  target: EngagementTarget,
  contentIds: string[],
  deviceId: string | undefined,
): Promise<EngagementStats[]> {
  if (contentIds.length === 0) return [];

  const counters = await (async (): Promise<Map<string, Counters>> => {
    const select = { id: true, likesCount: true, views: true };
    const rows = await (async () => {
      switch (target) {
        case 'BLOG_POST': return prisma.blogPost.findMany({ where: { id: { in: contentIds } }, select });
        case 'PROJECT': return prisma.project.findMany({ where: { id: { in: contentIds } }, select });
        case 'COURSE': return prisma.course.findMany({ where: { id: { in: contentIds } }, select });
        case 'TESTIMONIAL': {
          const list = await prisma.testimonial.findMany({
            where: { id: { in: contentIds } },
            select: { id: true, likesCount: true },
          });
          return list.map((r) => ({ ...r, views: null }));
        }
      }
    })();
    return new Map(rows.map((r) => [r.id, { likesCount: r.likesCount, views: r.views }]));
  })();

  // deviceId bo'lmasa (cookie hali yo'q) — hech narsa yoqtirilmagan
  const likedIds = deviceId
    ? new Set(
      (await prisma.contentLike.findMany({
        where: { contentType: target, contentId: { in: contentIds }, deviceId },
        select: { contentId: true },
      })).map((r) => r.contentId),
    )
    : new Set<string>();

  return contentIds
    .filter((id) => counters.has(id))
    .map((id) => ({
      contentId: id,
      likesCount: counters.get(id)!.likesCount,
      views: counters.get(id)!.views,
      liked: likedIds.has(id),
    }));
}

/**
 * Kontent o'chirilganda unga tegishli yoqtirishlarni tozalaydi.
 *
 * Polimorf jadvalda foreign key yo'q — bu chaqiruv unutilsa baza yetim
 * yozuvlar bilan to'lib boradi va o'chirilgan kontent id'si qayta
 * ishlatilsa (cuid'da amalda bo'lmaydi, lekin) noto'g'ri hisob chiqardi.
 */
export async function purgeEngagement(target: EngagementTarget, contentId: string): Promise<void> {
  await prisma.$transaction([
    prisma.contentLike.deleteMany({ where: { contentType: target, contentId } }),
    prisma.contentView.deleteMany({ where: { contentType: target, contentId } }),
  ]);
}
