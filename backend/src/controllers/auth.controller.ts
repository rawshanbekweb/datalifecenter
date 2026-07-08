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

// Token cookie'da HAM, javob tanasida HAM qaytadi: Safari va boshqa brauzerlar
// krossdomen (vercel.app ↔ onrender.com) cookie'ni bloklaydi — frontend tokenni
// localStorage'ga olib Authorization header orqali yuboradi.
export const registerHandler = asyncHandler(async (req: Request, res: Response) => {
  const { user, token } = await authService.register(req.body);
  res.cookie('token', token, cookieOptions);
  sendSuccess(res, { user, token }, 201);
});

export const loginHandler = asyncHandler(async (req: Request, res: Response) => {
  const { user, token } = await authService.login(req.body);
  res.cookie('token', token, cookieOptions);
  sendSuccess(res, { user, token });
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
  // tokenVersion oshgani uchun joriy sessiyaga yangi token beriladi —
  // foydalanuvchi o'zi chiqib qolmaydi, boshqa qurilmalardagi sessiyalar bekor bo'ladi
  const token = await authService.changePassword(req.user.userId, req.body.currentPassword, req.body.newPassword);
  res.cookie('token', token, cookieOptions);
  sendSuccess(res, { message: "Parol o'zgartirildi", token });
});

export const verifyEmailHandler = asyncHandler(async (req: Request, res: Response) => {
  await authService.verifyEmail(req.body.token);
  sendSuccess(res, { message: 'Email tasdiqlandi' });
});

export const resendVerificationHandler = asyncHandler(async (req: Request, res: Response) => {
  if (!req.user) throw ApiError.unauthorized();
  await authService.resendVerification(req.user.userId);
  sendSuccess(res, { message: 'Tasdiqlash havolasi qayta yuborildi' });
});

export const forgotPasswordHandler = asyncHandler(async (req: Request, res: Response) => {
  await authService.forgotPassword(req.body.email);
  // Email bazada bor-yo'qligini oshkor qilmaymiz — javob har doim bir xil
  sendSuccess(res, { message: "Agar bu email ro'yxatdan o'tgan bo'lsa, parolni tiklash havolasi yuborildi" });
});

export const resetPasswordHandler = asyncHandler(async (req: Request, res: Response) => {
  await authService.resetPassword(req.body.token, req.body.newPassword);
  sendSuccess(res, { message: "Parol yangilandi. Endi yangi parol bilan kirishingiz mumkin." });
});
