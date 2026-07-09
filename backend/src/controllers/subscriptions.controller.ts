import path from 'path';
import { Request, Response } from 'express';
import * as subscriptionsService from '../services/subscriptions.service';
import { asyncHandler } from '../utils/asyncHandler';
import { sendSuccess } from '../utils/ApiResponse';
import { ApiError } from '../utils/ApiError';
import { fetchRemoteImage } from '../services/storage.service';
import { IMAGES_DIR } from '../config/uploads';

export const createSubscriptionHandler = asyncHandler(async (req: Request, res: Response) => {
  if (!req.user) throw ApiError.unauthorized();
  const subscription = await subscriptionsService.createSubscription(req.user.userId);
  sendSuccess(res, subscription, 201);
});

export const mySubscriptionHandler = asyncHandler(async (req: Request, res: Response) => {
  if (!req.user) throw ApiError.unauthorized();
  const subscription = await subscriptionsService.getMySubscription(req.user.userId);
  sendSuccess(res, subscription);
});

export const listSubscriptionsAdminHandler = asyncHandler(async (req: Request, res: Response) => {
  const filters = req.validatedQuery as {
    status?: 'PENDING' | 'ACTIVE' | 'EXPIRED' | 'CANCELLED' | 'REJECTED';
    search?: string;
    page: number;
    limit: number;
  };
  const result = await subscriptionsService.listSubscriptionsAdmin(filters);
  sendSuccess(res, result);
});

export const updateSubscriptionAdminHandler = asyncHandler(async (req: Request, res: Response) => {
  const subscription = await subscriptionsService.updateSubscriptionAdmin(req.params.id as string, req.body);
  sendSuccess(res, subscription);
});

export const submitSubscriptionReceiptHandler = asyncHandler(async (req: Request, res: Response) => {
  if (!req.user) throw ApiError.unauthorized();
  const subscription = await subscriptionsService.submitSubscriptionReceipt(
    req.user.userId,
    req.params.id as string,
    req.body.receiptUrl
  );
  sendSuccess(res, subscription);
});

export const subscriptionReceiptHandler = asyncHandler(async (req: Request, res: Response) => {
  if (!req.user) throw ApiError.unauthorized();
  const source = await subscriptionsService.getSubscriptionReceiptSource(req.user.userId, req.user.role, req.params.id as string);
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
