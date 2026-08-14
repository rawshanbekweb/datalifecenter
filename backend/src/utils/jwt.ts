import jwt from 'jsonwebtoken';
import { env } from '../config/env';

export interface JwtPayload {
  userId: string;
  role: string;
  // tokenVersion: parol o'zgarganda bazadagi qiymat oshadi va eski tokenlar
  // bekor bo'ladi. Eski (tv'siz) tokenlar 0 deb qabul qilinadi.
  tv?: number;
  // Session yozuvining id'si. Shu tufayli bitta qurilmani tanlab chiqarish
  // mumkin bo'ladi. Ixtiyoriy deb belgilangan, chunki tur jihatidan eski
  // tokenlarda yo'q — LEKIN `authenticate` ularni rad etadi (SESSION_REVOKED).
  sid?: string;
}

export function signToken(payload: JwtPayload): string {
  return jwt.sign(payload, env.JWT_SECRET, { expiresIn: env.JWT_EXPIRES_IN as jwt.SignOptions['expiresIn'] });
}

export function verifyToken(token: string): JwtPayload {
  return jwt.verify(token, env.JWT_SECRET) as JwtPayload;
}
