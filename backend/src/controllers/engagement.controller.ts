import { EngagementTarget } from '@prisma/client';
import { Request, Response } from 'express';
import * as engagementService from '../services/engagement.service';
import { asyncHandler } from '../utils/asyncHandler';
import { sendSuccess } from '../utils/ApiResponse';
import { ApiError } from '../utils/ApiError';

// URL'da qisqa va o'qiladigan ko'rinish ishlatiladi ("blog", "project"),
// bazada esa enum qiymati — ikkalasi orasidagi yagona moslik jadvali
const TARGET_BY_SLUG: Record<string, EngagementTarget> = {
  blog: 'BLOG_POST',
  project: 'PROJECT',
  course: 'COURSE',
  testimonial: 'TESTIMONIAL',
};

function parseTarget(value: string): EngagementTarget {
  const target = TARGET_BY_SLUG[value];
  if (!target) throw ApiError.notFound('Bunday kontent turi mavjud emas', 'UNKNOWN_CONTENT_TYPE');
  return target;
}

/**
 * Yoqtirish/ko'rish yozuvlari ochiq keshni TOZALAMASLIGI kerak.
 *
 * `app.ts`dagi umumiy qoida har muvaffaqiyatli yozuvdan keyin keshni
 * tozalaydi (admin tahriri darhol ko'rinsin uchun). Lekin yoqtirish — bu
 * tez-tez takrorlanadigan, kichik ahamiyatli yozuv: har bosishda butun kesh
 * tozalansa, ochilish kuni uchun qurilgan himoya butunlay ishdan chiqardi.
 * Raqamlar mijozda darhol yangilanadi, ro'yxatdagi qiymat esa TTL ichida
 * o'z-o'zidan yetib oladi.
 */
function keepCache(res: Response): void {
  res.locals.skipCacheInvalidation = true;
}

export const toggleLikeHandler = asyncHandler(async (req: Request, res: Response) => {
  keepCache(res);
  const target = parseTarget(req.params.target as string);
  // requireDeviceId middleware'i o'tkazgan bo'lsa deviceId albatta bor
  const result = await engagementService.toggleLike(target, req.params.id as string, req.deviceId!);
  sendSuccess(res, result);
});

export const registerViewHandler = asyncHandler(async (req: Request, res: Response) => {
  keepCache(res);
  const target = parseTarget(req.params.target as string);
  const result = await engagementService.registerView(target, req.params.id as string, req.deviceId!);
  sendSuccess(res, result);
});

export const getStatsHandler = asyncHandler(async (req: Request, res: Response) => {
  const target = parseTarget(req.params.target as string);

  const raw = typeof req.query.ids === 'string' ? req.query.ids : '';
  const ids = raw.split(',').map((s) => s.trim()).filter(Boolean);
  // Bitta so'rov bilan cheksiz ko'p element so'ralmasin
  if (ids.length > 100) {
    throw ApiError.badRequest("Bir so'rovda 100 tadan ko'p element so'rab bo'lmaydi", 'TOO_MANY_IDS');
  }

  const stats = await engagementService.getStats(target, ids, req.deviceId);
  sendSuccess(res, stats);
});
