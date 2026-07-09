import path from 'path';
import { Request, Response } from 'express';
import * as enrollmentsService from '../services/enrollments.service';
import { asyncHandler } from '../utils/asyncHandler';
import { sendSuccess } from '../utils/ApiResponse';
import { ApiError } from '../utils/ApiError';
import { streamCertificatePdf } from '../utils/certificate';
import { fetchRemoteImage } from '../services/storage.service';
import { IMAGES_DIR } from '../config/uploads';

export const createEnrollmentHandler = asyncHandler(async (req: Request, res: Response) => {
  if (!req.user) throw ApiError.unauthorized();
  const enrollment = await enrollmentsService.createEnrollment(req.user.userId, req.body.courseId, req.locale);
  sendSuccess(res, enrollment, 201);
});

export const myEnrollmentsHandler = asyncHandler(async (req: Request, res: Response) => {
  if (!req.user) throw ApiError.unauthorized();
  const enrollments = await enrollmentsService.getMyEnrollments(req.user.userId, req.locale);
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
  const result = await enrollmentsService.listEnrollmentsAdmin(filters, req.locale);
  sendSuccess(res, result);
});

export const updateEnrollmentAdminHandler = asyncHandler(async (req: Request, res: Response) => {
  const enrollment = await enrollmentsService.updateEnrollmentAdmin(req.params.id as string, req.body, req.locale);
  sendSuccess(res, enrollment);
});

export const submitReceiptHandler = asyncHandler(async (req: Request, res: Response) => {
  if (!req.user) throw ApiError.unauthorized();
  const enrollment = await enrollmentsService.submitReceipt(
    req.user.userId,
    req.params.id as string,
    req.body.receiptUrl,
    req.locale
  );
  sendSuccess(res, enrollment);
});

export const receiptHandler = asyncHandler(async (req: Request, res: Response) => {
  if (!req.user) throw ApiError.unauthorized();
  const source = await enrollmentsService.getReceiptSource(req.user.userId, req.user.role, req.params.id as string);
  if (source.kind === 'local') {
    res.sendFile(path.basename(source.filename), { root: IMAGES_DIR, dotfiles: 'deny' }, (err) => {
      if (err && !res.headersSent) {
        res.status(404).json({ success: false, error: { message: 'Fayl topilmadi', code: 'NOT_FOUND' } });
      }
    });
    return;
  }
  const { buffer, contentType } = await fetchRemoteImage(source.url);
  res.setHeader('Content-Type', contentType);
  res.send(buffer);
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

// Ochiq endpoint — autentifikatsiya talab qilinmaydi
export const verifyCertificateHandler = asyncHandler(async (req: Request, res: Response) => {
  const data = await enrollmentsService.verifyCertificate(req.params.no as string);
  sendSuccess(res, data);
});

export const mockPayHandler = asyncHandler(async (req: Request, res: Response) => {
  if (!req.user) throw ApiError.unauthorized();
  const enrollment = await enrollmentsService.mockPayEnrollment(req.user.userId, req.params.id as string, req.locale);
  sendSuccess(res, enrollment);
});
