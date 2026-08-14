import { CookieOptions, Request, Response } from 'express';
import * as authService from '../services/auth.service';
import { asyncHandler } from '../utils/asyncHandler';
import { sendSuccess } from '../utils/ApiResponse';
import { env } from '../config/env';
import { ApiError } from '../utils/ApiError';
import { verifyToken } from '../utils/jwt';
import {
  listSessions,
  revokeOtherSessions,
  revokeSession,
  sessionContextFromRequest,
} from '../services/session.service';

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
  const { user, token } = await authService.register(req.body, sessionContextFromRequest(req));
  res.cookie('token', token, cookieOptions);
  sendSuccess(res, { user, token }, 201);
});

export const loginHandler = asyncHandler(async (req: Request, res: Response) => {
  const { user, token } = await authService.login(req.body, sessionContextFromRequest(req));
  res.cookie('token', token, cookieOptions);
  sendSuccess(res, { user, token });
});

/**
 * Chiqish. Avval bu faqat cookie'ni tozalardi va token yana 7 kun amal
 * qilaverardi — endi seans yozuvi ham yopiladi.
 *
 * Yo'l `authenticate`siz qoldirilgan (eskirgan token bilan ham "chiqa"
 * olish kerak), shuning uchun tokenni o'zimiz o'qiymiz va yaroqsiz bo'lsa
 * jimgina o'tamiz — chiqish hech qachon xato bermasin.
 */
export const logoutHandler = asyncHandler(async (req: Request, res: Response) => {
  const header = req.headers.authorization;
  const raw = header?.startsWith('Bearer ') ? header.slice(7) : req.cookies?.token;
  if (raw) {
    try {
      const payload = verifyToken(raw);
      if (payload.sid) {
        await revokeSession(payload.userId, payload.sid).catch(() => undefined);
      }
    } catch {
      // Yaroqsiz yoki muddati o'tgan token — bekor qiladigan narsa yo'q
    }
  }
  res.clearCookie('token', cookieOptions);
  sendSuccess(res, { message: 'Chiqildi' });
});

export const listSessionsHandler = asyncHandler(async (req: Request, res: Response) => {
  if (!req.user) throw ApiError.unauthorized();
  sendSuccess(res, await listSessions(req.user.userId, req.user.sid));
});

export const revokeSessionHandler = asyncHandler(async (req: Request, res: Response) => {
  if (!req.user) throw ApiError.unauthorized();
  await revokeSession(req.user.userId, req.params.id as string);
  sendSuccess(res, { message: 'Seans yopildi' });
});

export const revokeOtherSessionsHandler = asyncHandler(async (req: Request, res: Response) => {
  if (!req.user) throw ApiError.unauthorized();
  const count = await revokeOtherSessions(req.user.userId, req.user.sid);
  sendSuccess(res, { count, message: 'Boshqa qurilmalardan chiqildi' });
});

/**
 * "Men shu yerdaman" — tanani qaytarmaydi, butun ishi `authenticate`
 * ichidagi `lastSeenAt` yangilanishi. Shuning uchun 204.
 */
export const heartbeatHandler = asyncHandler(async (_req: Request, res: Response) => {
  res.status(204).end();
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
  const token = await authService.changePassword(
    req.user.userId,
    req.body.currentPassword,
    req.body.newPassword,
    sessionContextFromRequest(req)
  );
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
