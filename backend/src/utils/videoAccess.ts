import crypto from 'crypto';
import { env } from '../config/env';
import { safeCompare } from './safeCompare';

// Lokal disk'dagi video fayllarni himoyalash uchun HMAC asosidagi vaqtinchalik token.
// Cloudinary'dagi "authenticated" turidagi imzoli URL'larga o'xshash maqsad: bir marta
// oshkor bo'lgan havola muddat (TTL) tugagach ishlamay qoladi.
function sign(filename: string, exp: number): string {
  return crypto.createHmac('sha256', env.JWT_SECRET).update(`${filename}:${exp}`).digest('hex');
}

export function signLocalVideoUrl(url: string, ttlSeconds = 6 * 3600): string {
  const match = /\/uploads\/videos\/([^/?#]+)/.exec(url);
  if (!match) return url;
  const filename = match[1];
  const exp = Math.floor(Date.now() / 1000) + ttlSeconds;
  const sig = sign(filename, exp);
  const separator = url.includes('?') ? '&' : '?';
  return `${url}${separator}exp=${exp}&sig=${sig}`;
}

export function verifyLocalVideoToken(filename: string, exp: unknown, sig: unknown): boolean {
  if (typeof exp !== 'string' || typeof sig !== 'string') return false;
  const expNum = Number(exp);
  if (!Number.isFinite(expNum) || expNum < Math.floor(Date.now() / 1000)) return false;

  return safeCompare(sign(filename, expNum), sig);
}
