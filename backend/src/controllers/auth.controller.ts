import { CookieOptions, Request, Response } from 'express';
import * as authService from '../services/auth.service';
import { asyncHandler } from '../utils/asyncHandler';
import { sendSuccess } from '../utils/ApiResponse';
import { env } from '../config/env';
import { ApiError } from '../utils/ApiError';

// Production'da frontend (vercel.app) va backend (onrender.com) turli saytlarda —
// krossdomen cookie faqat SameSite=None; Secure bilan ishlaydi. Lokalda 'lax' qoladi.
const isProd = env.NODE_ENV === 'production';
const cookieOptions: CookieOptions = {
  httpOnly: true,
  sameSite: isProd ? 'none' : 'lax',
  secure: isProd,
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

export const updateProfileHandler = asyncHandler(async (req: Request, res: Response) => {
  if (!req.user) throw ApiError.unauthorized();
  const user = await authService.updateProfile(req.user.userId, req.body);
  sendSuccess(res, user);
});

export const changePasswordHandler = asyncHandler(async (req: Request, res: Response) => {
  if (!req.user) throw ApiError.unauthorized();
  await authService.changePassword(req.user.userId, req.body.currentPassword, req.body.newPassword);
  sendSuccess(res, { message: "Parol o'zgartirildi" });
});
