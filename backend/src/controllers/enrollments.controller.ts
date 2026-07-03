import { Request, Response } from 'express';
import * as enrollmentsService from '../services/enrollments.service';
import { asyncHandler } from '../utils/asyncHandler';
import { sendSuccess } from '../utils/ApiResponse';
import { ApiError } from '../utils/ApiError';

export const createEnrollmentHandler = asyncHandler(async (req: Request, res: Response) => {
  if (!req.user) throw ApiError.unauthorized();
  const enrollment = await enrollmentsService.createEnrollment(req.user.userId, req.body.courseId);
  sendSuccess(res, enrollment, 201);
});

export const myEnrollmentsHandler = asyncHandler(async (req: Request, res: Response) => {
  if (!req.user) throw ApiError.unauthorized();
  const enrollments = await enrollmentsService.getMyEnrollments(req.user.userId);
  sendSuccess(res, enrollments);
});

export const mockPayHandler = asyncHandler(async (req: Request, res: Response) => {
  if (!req.user) throw ApiError.unauthorized();
  const enrollment = await enrollmentsService.mockPayEnrollment(req.user.userId, req.params.id as string);
  sendSuccess(res, enrollment);
});
