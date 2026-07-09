import { Request, Response } from 'express';
import * as adminService from '../services/admin.service';
import { asyncHandler } from '../utils/asyncHandler';
import { sendSuccess } from '../utils/ApiResponse';

export const getStatsHandler = asyncHandler(async (req: Request, res: Response) => {
  const stats = await adminService.getStats(req.locale);
  sendSuccess(res, stats);
});
