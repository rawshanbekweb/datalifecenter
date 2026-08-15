import { Request, Response } from 'express';
import * as paymentsService from '../services/enrollmentPayments.service';
import { asyncHandler } from '../utils/asyncHandler';
import { sendSuccess } from '../utils/ApiResponse';
import { ApiError } from '../utils/ApiError';

export const listEnrollmentPaymentsHandler = asyncHandler(async (req: Request, res: Response) => {
  if (!req.user) throw ApiError.unauthorized();
  const result = await paymentsService.listEnrollmentPayments(req.params.id as string, req.user);
  sendSuccess(res, result);
});

export const addEnrollmentPaymentHandler = asyncHandler(async (req: Request, res: Response) => {
  if (!req.user) throw ApiError.unauthorized();
  const result = await paymentsService.addEnrollmentPayment(
    req.params.id as string,
    req.body,
    req.user.userId,
    req.locale,
  );
  sendSuccess(res, result, 201);
});

export const deleteEnrollmentPaymentHandler = asyncHandler(async (req: Request, res: Response) => {
  const summary = await paymentsService.deleteEnrollmentPayment(
    req.params.id as string,
    req.params.paymentId as string,
  );
  sendSuccess(res, summary);
});

export const listDebtorsHandler = asyncHandler(async (req: Request, res: Response) => {
  const result = await paymentsService.listDebtors(req.validatedQuery ?? {}, req.locale);
  sendSuccess(res, result);
});
