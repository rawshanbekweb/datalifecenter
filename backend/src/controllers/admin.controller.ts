import { Request, Response } from 'express';
import * as adminService from '../services/admin.service';
import * as analyticsService from '../services/analytics.service';
import { asyncHandler } from '../utils/asyncHandler';
import { sendSuccess } from '../utils/ApiResponse';

export const getStatsHandler = asyncHandler(async (req: Request, res: Response) => {
  const stats = await adminService.getStats(req.locale);
  sendSuccess(res, stats);
});

// Ruxsat etilgan davrlar — ixtiyoriy son qabul qilinsa, katta oraliq
// (masalan ?days=100000) butun jadvalni skanerlashga aylanardi
const RANGES = [7, 30, 90];
const DEFAULT_RANGE = 30;

export const getAnalyticsHandler = asyncHandler(async (req: Request, res: Response) => {
  const requested = Number(req.query.days);
  const days = RANGES.includes(requested) ? requested : DEFAULT_RANGE;
  sendSuccess(res, await analyticsService.getAnalytics(days, req.locale));
});
