import jwt from 'jsonwebtoken';
import { env } from '../config/env';

export interface JwtPayload {
  userId: string;
  role: string;
  // tokenVersion: parol o'zgarganda bazadagi qiymat oshadi va eski tokenlar
  // bekor bo'ladi. Eski (tv'siz) tokenlar 0 deb qabul qilinadi.
  tv?: number;
}

export function signToken(payload: JwtPayload): string {
  return jwt.sign(payload, env.JWT_SECRET, { expiresIn: env.JWT_EXPIRES_IN as jwt.SignOptions['expiresIn'] });
}

export function verifyToken(token: string): JwtPayload {
  return jwt.verify(token, env.JWT_SECRET) as JwtPayload;
}
