import { Request, Response } from 'express';
import * as courseReviewsService from '../services/courseReviews.service';
import { asyncHandler } from '../utils/asyncHandler';
import { sendSuccess } from '../utils/ApiResponse';
import { ApiError } from '../utils/ApiError';

export const listReviewsHandler = asyncHandler(async (req: Request, res: Response) => {
  const reviews = await courseReviewsService.listReviews(req.params.slug as string);
  sendSuccess(res, reviews);
});

export const getMyReviewHandler = asyncHandler(async (req: Request, res: Response) => {
  if (!req.user) throw ApiError.unauthorized();
  const review = await courseReviewsService.getMyReview(req.params.slug as string, req.user.userId);
  sendSuccess(res, review);
});

export const upsertReviewHandler = asyncHandler(async (req: Request, res: Response) => {
  if (!req.user) throw ApiError.unauthorized();
  const review = await courseReviewsService.upsertReview(req.params.slug as string, req.user.userId, req.body);
  sendSuccess(res, review, 201);
});

export const deleteMyReviewHandler = asyncHandler(async (req: Request, res: Response) => {
  if (!req.user) throw ApiError.unauthorized();
  await courseReviewsService.deleteMyReview(req.params.slug as string, req.user.userId);
  sendSuccess(res, { message: "Sharh o'chirildi" });
});

export const listReviewsAdminHandler = asyncHandler(async (req: Request, res: Response) => {
  const filters = req.validatedQuery as unknown as { page: number; limit: number };
  const result = await courseReviewsService.listReviewsAdmin(filters);
  sendSuccess(res, result);
});

export const setReviewPublishedHandler = asyncHandler(async (req: Request, res: Response) => {
  const review = await courseReviewsService.setReviewPublished(req.params.id as string, req.body.published);
  sendSuccess(res, review);
});

export const deleteReviewAdminHandler = asyncHandler(async (req: Request, res: Response) => {
  await courseReviewsService.deleteReviewAdmin(req.params.id as string);
  sendSuccess(res, { message: "Sharh o'chirildi" });
});
