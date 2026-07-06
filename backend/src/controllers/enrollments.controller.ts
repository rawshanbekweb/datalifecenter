import { Request, Response } from 'express';
import * as enrollmentsService from '../services/enrollments.service';
import { asyncHandler } from '../utils/asyncHandler';
import { sendSuccess } from '../utils/ApiResponse';
import { ApiError } from '../utils/ApiError';
import { streamCertificatePdf } from '../utils/certificate';

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

export const listEnrollmentsAdminHandler = asyncHandler(async (req: Request, res: Response) => {
  const filters = req.validatedQuery as {
    status?: 'PENDING' | 'ACTIVE' | 'COMPLETED' | 'CANCELLED';
    paymentStatus?: 'FREE' | 'UNPAID' | 'PENDING' | 'PAID' | 'REFUNDED';
    search?: string;
    page: number;
    limit: number;
  };
  const result = await enrollmentsService.listEnrollmentsAdmin(filters);
  sendSuccess(res, result);
});

export const updateEnrollmentAdminHandler = asyncHandler(async (req: Request, res: Response) => {
  const enrollment = await enrollmentsService.updateEnrollmentAdmin(req.params.id as string, req.body);
  sendSuccess(res, enrollment);
});

export const submitReceiptHandler = asyncHandler(async (req: Request, res: Response) => {
  if (!req.user) throw ApiError.unauthorized();
  const enrollment = await enrollmentsService.submitReceipt(
    req.user.userId,
    req.params.id as string,
    req.body.receiptUrl
  );
  sendSuccess(res, enrollment);
});

export const certificateHandler = asyncHandler(async (req: Request, res: Response) => {
  if (!req.user) throw ApiError.unauthorized();
  const data = await enrollmentsService.getCertificateData(
    req.user.userId,
    req.user.role,
    req.params.id as string
  );
  streamCertificatePdf(res, data);
});

export const mockPayHandler = asyncHandler(async (req: Request, res: Response) => {
  if (!req.user) throw ApiError.unauthorized();
  const enrollment = await enrollmentsService.mockPayEnrollment(req.user.userId, req.params.id as string);
  sendSuccess(res, enrollment);
});
