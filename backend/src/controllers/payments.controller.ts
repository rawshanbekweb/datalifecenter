import { Request, Response } from 'express';
import { asyncHandler } from '../utils/asyncHandler';
import { sendSuccess } from '../utils/ApiResponse';
import { ApiError } from '../utils/ApiError';
import * as checkoutService from '../services/payments/checkout.service';
import { handlePrepare, handleComplete, ClickParams } from '../services/payments/click.service';
import { handleRpc, verifyPaymeAuth, PAYME_AUTH_ERROR, JsonRpcRequest } from '../services/payments/payme.service';

export const paymentConfigHandler = asyncHandler(async (_req: Request, res: Response) => {
  sendSuccess(res, checkoutService.getPaymentConfig());
});

export const createCheckoutHandler = asyncHandler(async (req: Request, res: Response) => {
  if (!req.user) throw ApiError.unauthorized();
  const { enrollmentId, subscriptionId, provider } = req.body as {
    enrollmentId?: string;
    subscriptionId?: string;
    provider: 'click' | 'payme';
  };
  const target: checkoutService.CheckoutTarget = enrollmentId
    ? { kind: 'enrollment', enrollmentId }
    : { kind: 'subscription', subscriptionId: subscriptionId as string };
  const url = await checkoutService.createCheckout(req.user.userId, target, provider);
  sendSuccess(res, { url });
});

// Click server-server webhook'lari — HTTP 200 va ularning o'z JSON kontraktida javob
// qaytariladi (ApiError/errorHandler ishlatilmaydi, bu Click uchun tushunarsiz bo'lardi).
export const clickPrepareHandler = asyncHandler(async (req: Request, res: Response) => {
  const result = await handlePrepare(req.body as ClickParams);
  res.json(result);
});

export const clickCompleteHandler = asyncHandler(async (req: Request, res: Response) => {
  const result = await handleComplete(req.body as ClickParams);
  res.json(result);
});

// Payme JSON-RPC — bitta endpoint, Basic Auth header bilan
export const paymeRpcHandler = asyncHandler(async (req: Request, res: Response) => {
  const body = req.body as JsonRpcRequest;
  if (!verifyPaymeAuth(req.headers.authorization)) {
    res.json({ error: PAYME_AUTH_ERROR, id: body?.id ?? null });
    return;
  }
  const result = await handleRpc(body);
  res.json(result);
});
