import { Request, Response } from 'express';
import * as progressService from '../services/progress.service';
import { asyncHandler } from '../utils/asyncHandler';
import { sendSuccess } from '../utils/ApiResponse';
import { ApiError } from '../utils/ApiError';

export const completeLessonHandler = asyncHandler(async (req: Request, res: Response) => {
  if (!req.user) throw ApiError.unauthorized();
  const summary = await progressService.completeLesson(req.user.userId, req.params.lessonId as string);
  sendSuccess(res, summary);
});

export const uncompleteLessonHandler = asyncHandler(async (req: Request, res: Response) => {
  if (!req.user) throw ApiError.unauthorized();
  const summary = await progressService.uncompleteLesson(req.user.userId, req.params.lessonId as string);
  sendSuccess(res, summary);
});
