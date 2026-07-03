import { CookieOptions, Request, Response } from 'express';
import * as authService from '../services/auth.service';
import { asyncHandler } from '../utils/asyncHandler';
import { sendSuccess } from '../utils/ApiResponse';
import { env } from '../config/env';
import { ApiError } from '../utils/ApiError';

const cookieOptions: CookieOptions = {
  httpOnly: true,
  sameSite: 'lax',
  secure: env.NODE_ENV === 'production',
  maxAge: 7 * 24 * 60 * 60 * 1000,
};

export const registerHandler = asyncHandler(async (req: Request, res: Response) => {
  const { user, token } = await authService.register(req.body);
  res.cookie('token', token, cookieOptions);
  sendSuccess(res, user, 201);
});

export const loginHandler = asyncHandler(async (req: Request, res: Response) => {
  const { user, token } = await authService.login(req.body);
  res.cookie('token', token, cookieOptions);
  sendSuccess(res, user);
});

export const logoutHandler = asyncHandler(async (_req: Request, res: Response) => {
  res.clearCookie('token', cookieOptions);
  sendSuccess(res, { message: 'Chiqildi' });
});

export const meHandler = asyncHandler(async (req: Request, res: Response) => {
  if (!req.user) throw ApiError.unauthorized();
  const user = await authService.getMe(req.user.userId);
  sendSuccess(res, user);
});
