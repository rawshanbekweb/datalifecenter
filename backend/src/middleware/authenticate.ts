import { NextFunction, Request, Response } from 'express';
import { prisma } from '../config/prisma';
import { ApiError } from '../utils/ApiError';
import { verifyToken } from '../utils/jwt';
import { idleLimitMs, LAST_SEEN_THROTTLE_MS } from '../services/session.service';

// Token cookie'dan yoki Authorization: Bearer header'dan olinadi.
// Header birinchi: Safari kabi brauzerlar krossdomen cookie'ni bloklaydi —
// frontend tokenni localStorage'da saqlab header orqali yuboradi.
function extractToken(req: Request): string | undefined {
  const header = req.headers.authorization;
  if (header?.startsWith('Bearer ')) {
    return header.slice(7);
  }
  return req.cookies?.token;
}

/**
 * Tokenni tekshiradi va so'rovni foydalanuvchiga bog'laydi.
 *
 * MUHIM: bazaga murojaat soni o'zgarmagan. Avval `user` o'qilardi, endi
 * `session` o'qiladi va `user` shu bitta so'rov ichida birga keladi.
 * `lastSeenAt` yozuvi esa daqiqasiga ko'pi bilan bir marta bo'ladi.
 */
export async function authenticate(req: Request, _res: Response, next: NextFunction) {
  const token = extractToken(req);
  if (!token) {
    return next(ApiError.unauthorized());
  }

  try {
    req.user = verifyToken(token);
  } catch {
    return next(ApiError.unauthorized("Token yaroqsiz yoki muddati o'tgan"));
  }

  // Seans id'si yo'q token — bu imkoniyat joriy qilinishidan oldingi eski
  // token. Ataylab rad etiladi: aynan shu narsa oshkor bo'lgan eski
  // tokenlarni ham bekor qiladi (deploy paytida hamma qayta kiradi).
  const sid = req.user.sid;
  if (!sid) {
    return next(ApiError.unauthorized('Sessiya eskirgan. Qaytadan kiring.', 'SESSION_REVOKED'));
  }

  const session = await prisma.session.findUnique({
    where: { id: sid },
    select: {
      userId: true,
      revokedAt: true,
      lastSeenAt: true,
      user: { select: { isBlocked: true, role: true, tokenVersion: true } },
    },
  });

  // Seans yo'q yoki yopilgan — boshqa qurilmadan chiqarilgan bo'lishi mumkin.
  // Tokendagi userId seansnikiga to'g'ri kelishi ham tekshiriladi (imzo buni
  // kafolatlaydi, lekin tekshiruv arzon va xatoni erta ushlaydi).
  if (!session || session.revokedAt || session.userId !== req.user.userId) {
    return next(ApiError.unauthorized('Sessiya eskirgan. Qaytadan kiring.', 'SESSION_REVOKED'));
  }

  const user = session.user;
  if (user.isBlocked) {
    return next(ApiError.forbidden('Hisobingiz bloklangan. Administratorga murojaat qiling.', 'USER_BLOCKED'));
  }

  // Parol o'zgargan bo'lsa eski sessiyalar ishlamasligi kerak
  if ((req.user.tv ?? 0) !== user.tokenVersion) {
    return next(ApiError.unauthorized('Sessiya eskirgan. Qaytadan kiring.', 'SESSION_REVOKED'));
  }

  // Harakatsizlik. Chegara ROLGA qarab (session.service.ts), rol esa bazadan
  // olinadi — admin rolni o'zgartirsa chegara darhol yangisiga mos keladi.
  const now = Date.now();
  const idleMs = now - session.lastSeenAt.getTime();
  if (idleMs > idleLimitMs(user.role)) {
    await prisma.session.update({ where: { id: sid }, data: { revokedAt: new Date() } });
    return next(
      ApiError.unauthorized("Uzoq vaqt harakat bo'lmagani uchun tizimdan chiqarildingiz", 'SESSION_IDLE')
    );
  }

  // Har so'rovda UPDATE qilish bepul emas — daqiqasiga bir marta yetarli
  if (idleMs > LAST_SEEN_THROTTLE_MS) {
    await prisma.session.update({ where: { id: sid }, data: { lastSeenAt: new Date(now) } });
  }

  // Rol har doim bazadan olinadi — admin rolni o'zgartirsa qayta login talab qilinmaydi
  // (aks holda tokendagi eski rol bilan yangi rol sahifalari 403 qaytaradi)
  req.user.role = user.role;

  next();
}
