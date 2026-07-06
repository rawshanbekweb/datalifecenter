import { NextFunction, Request, Response } from 'express';
import { prisma } from '../config/prisma';
import { ApiError } from '../utils/ApiError';
import { verifyToken } from '../utils/jwt';

export async function authenticate(req: Request, _res: Response, next: NextFunction) {
  const token = req.cookies?.token;
  if (!token) {
    return next(ApiError.unauthorized());
  }

  try {
    req.user = verifyToken(token);
  } catch {
    return next(ApiError.unauthorized("Token yaroqsiz yoki muddati o'tgan"));
  }

  // Token yaroqli bo'lsa ham bloklangan/o'chirilgan user kirolmasligi kerak
  const user = await prisma.user.findUnique({
    where: { id: req.user.userId },
    select: { isBlocked: true, role: true },
  });
  if (!user) {
    return next(ApiError.unauthorized('Hisob topilmadi'));
  }
  if (user.isBlocked) {
    return next(ApiError.forbidden('Hisobingiz bloklangan. Administratorga murojaat qiling.', 'USER_BLOCKED'));
  }

  // Rol har doim bazadan olinadi — admin rolni o'zgartirsa qayta login talab qilinmaydi
  // (aks holda tokendagi eski rol bilan yangi rol sahifalari 403 qaytaradi)
  req.user.role = user.role;

  next();
}
