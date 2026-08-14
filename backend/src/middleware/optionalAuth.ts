import { NextFunction, Request, Response } from 'express';
import { prisma } from '../config/prisma';
import { verifyToken } from '../utils/jwt';

/**
 * Token bo'lsa foydalanuvchini aniqlaydi, bo'lmasa ham so'rovni o'tkazadi.
 *
 * Kurs so'rovi kabi ochiq formalar uchun: mehmon ham yubora oladi, lekin
 * saytga kirgan o'quvchining so'rovi uning hisobiga bog'lanishi kerak
 * (admin javobi keyin o'sha odamning yozishmasiga tushadi).
 *
 * `authenticate`dan farqi — hech qachon xato otmaydi: yaroqsiz yoki eskirgan
 * token oddiy mehmon sifatida qaraladi.
 */
export async function optionalAuth(req: Request, _res: Response, next: NextFunction): Promise<void> {
  const header = req.headers.authorization;
  const token = header?.startsWith('Bearer ') ? header.slice(7) : req.cookies?.token;
  if (!token) return next();

  try {
    const payload = verifyToken(token);
    // `sid` siz token — seans boshqaruvidan oldingi eski token; mehmon.
    if (!payload.sid) return next();

    const session = await prisma.session.findUnique({
      where: { id: payload.sid },
      select: {
        userId: true,
        revokedAt: true,
        user: { select: { isBlocked: true, role: true, tokenVersion: true } },
      },
    });
    // Yopilgan seans, bloklangan yoki paroli o'zgargan hisob — mehmon sifatida
    // davom etadi. `lastSeenAt` bu yerda ATAYIN yangilanmaydi: mehmonlar uchun
    // ochiq sahifada yozuv qilish seansni "tirik" ushlab turardi.
    if (
      session &&
      !session.revokedAt &&
      session.userId === payload.userId &&
      !session.user.isBlocked &&
      (payload.tv ?? 0) === session.user.tokenVersion
    ) {
      req.user = { ...payload, role: session.user.role };
    }
  } catch {
    // Yaroqsiz token — mehmon
  }
  next();
}
